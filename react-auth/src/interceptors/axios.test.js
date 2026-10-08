/**
 * Session transport (Gait console F0): access token in memory only, refresh
 * token only in Gait's HttpOnly cookie. These tests drive the real
 * interceptors against mocked axios instances.
 */
const cookieStore = {};

function createMockAxiosInstance() {
    const instance = jest.fn((config) => Promise.resolve({ retried: true, config }));
    instance.post = jest.fn();
    instance.defaults = { headers: { common: {} } };
    instance.interceptors = {
        request: {
            handlers: [],
            use: jest.fn((fulfilled, rejected) => {
                instance.interceptors.request.handlers.push({ fulfilled, rejected });
            }),
        },
        response: {
            handlers: [],
            use: jest.fn((fulfilled, rejected) => {
                instance.interceptors.response.handlers.push({ fulfilled, rejected });
            }),
        },
    };
    return instance;
}

function loadAxiosModule({ withLocks = true } = {}) {
    jest.resetModules();
    Object.keys(cookieStore).forEach((key) => delete cookieStore[key]);

    const sessionInstance = createMockAxiosInstance();
    const publicInstance = createMockAxiosInstance();
    const authInstance = createMockAxiosInstance();

    jest.doMock("axios", () => ({
        create: jest.fn()
            .mockReturnValueOnce(sessionInstance)
            .mockReturnValueOnce(publicInstance)
            .mockReturnValueOnce(authInstance),
    }));
    jest.doMock("js-cookie", () => ({
        get: jest.fn((key) => cookieStore[key]),
        set: jest.fn((key, value) => {
            cookieStore[key] = value;
        }),
        remove: jest.fn((key) => {
            delete cookieStore[key];
        }),
    }));

    let lockQueue = Promise.resolve();
    const locks = {
        request: jest.fn((name, options, callback) => {
            const run = lockQueue.then(() => callback());
            lockQueue = run.then(() => undefined, () => undefined);
            return run;
        }),
    };
    Object.defineProperty(global, "navigator", {
        value: withLocks ? { locks } : {},
        configurable: true,
        writable: true,
    });

    const module = require("./axios");
    const tokenStorage = require("./tokenStorage");
    return { ...module, ...tokenStorage, sessionInstance, publicInstance, authInstance, locks };
}

const runRequest = (instance, config) => instance.interceptors.request.handlers[0].fulfilled(config);
const runResponse = (instance, response) => instance.interceptors.response.handlers[0].fulfilled(response);
const runResponseError = (instance, error) => instance.interceptors.response.handlers[0].rejected(error);

describe("Gait session transport", () => {
    beforeEach(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("every request carries X-Gait-Auth", async () => {
        const { publicInstance, authInstance, sessionInstance, persistAuthTokens } = loadAxiosModule();
        persistAuthTokens({ accessToken: "access-1" });

        const publicConfig = await runRequest(publicInstance, { headers: {} });
        const authConfig = await runRequest(authInstance, { headers: {} });
        const sessionConfig = await runRequest(sessionInstance, { headers: {} });

        expect(publicConfig.headers["X-Gait-Auth"]).toBe("1");
        expect(authConfig.headers["X-Gait-Auth"]).toBe("1");
        expect(sessionConfig.headers["X-Gait-Auth"]).toBe("1");
        expect(authConfig.headers.Authorization).toBe("Bearer access-1");
    });

    test("login keeps the access token in memory only and never stores a refresh token", () => {
        const { publicInstance, getAccessToken } = loadAxiosModule();

        runResponse(publicInstance, {
            data: { access_token: "access-1", refresh_token: "must-be-ignored" },
            headers: {},
            config: { url: "/login/" },
        });

        expect(getAccessToken()).toBe("access-1");
        expect(Object.keys(cookieStore)).not.toContain("access_token");
        expect(Object.keys(cookieStore)).not.toContain("refresh_token");
        expect(JSON.stringify(cookieStore)).not.toContain("must-be-ignored");
    });

    test("first authenticated call after a reload restores the session from the cookie", async () => {
        const { authInstance, sessionInstance, getAccessToken } = loadAxiosModule();
        sessionInstance.post.mockResolvedValue({ data: { access_token: "restored" } });

        const config = await runRequest(authInstance, { headers: {} });

        expect(sessionInstance.post).toHaveBeenCalledTimes(1);
        expect(sessionInstance.post).toHaveBeenCalledWith("/auth/refresh/", {});
        expect(getAccessToken()).toBe("restored");
        expect(config.headers.Authorization).toBe("Bearer restored");
    });

    test("no live session: the request goes out unauthenticated and is not refreshed twice", async () => {
        const { authInstance, sessionInstance } = loadAxiosModule();
        sessionInstance.post.mockRejectedValue({ response: { status: 401 } });

        const config = await runRequest(authInstance, { headers: {} });

        expect(config.headers.Authorization).toBeUndefined();
        expect(config._retry).toBe(true);
    });

    test("simultaneous 401s share one refresh and are each retried with the new token", async () => {
        const { authInstance, sessionInstance, persistAuthTokens, locks } = loadAxiosModule();
        persistAuthTokens({ accessToken: "expired" });
        let resolveRefresh;
        sessionInstance.post.mockReturnValue(new Promise((resolve) => { resolveRefresh = resolve; }));

        const first = runResponseError(authInstance, { response: { status: 401 }, config: { headers: {} } });
        const second = runResponseError(authInstance, { response: { status: 401 }, config: { headers: {} } });
        resolveRefresh({ data: { access_token: "fresh" } });
        const [a, b] = await Promise.all([first, second]);

        expect(sessionInstance.post).toHaveBeenCalledTimes(1);
        expect(locks.request).toHaveBeenCalledTimes(1);
        expect(a.config.headers.Authorization).toBe("Bearer fresh");
        expect(b.config.headers.Authorization).toBe("Bearer fresh");
    });

    test("refresh failure clears the token and announces the session ended", async () => {
        const { authInstance, sessionInstance, persistAuthTokens, getAccessToken, SESSION_ENDED_EVENT } = loadAxiosModule();
        persistAuthTokens({ accessToken: "expired" });
        sessionInstance.post.mockRejectedValue({ response: { status: 401 } });
        const listener = jest.fn();
        window.addEventListener(SESSION_ENDED_EVENT, listener);

        await expect(
            runResponseError(authInstance, { response: { status: 401 }, config: { headers: {} } })
        ).rejects.toBeTruthy();

        expect(getAccessToken()).toBeNull();
        expect(listener).toHaveBeenCalledTimes(1);
        window.removeEventListener(SESSION_ENDED_EVENT, listener);
    });

    test("requests marked skipAuthRefresh never trigger a refresh", async () => {
        const { authInstance, sessionInstance } = loadAxiosModule();

        await expect(
            runResponseError(authInstance, { response: { status: 401 }, config: { headers: {}, skipAuthRefresh: true } })
        ).rejects.toBeTruthy();
        expect(sessionInstance.post).not.toHaveBeenCalled();
    });

    test("logout revokes server-side and clears the token even if the request fails", async () => {
        const { logoutSession, sessionInstance, persistAuthTokens, getAccessToken } = loadAxiosModule();
        persistAuthTokens({ accessToken: "access-1" });
        sessionInstance.post.mockRejectedValue(new Error("offline"));

        await expect(logoutSession()).rejects.toThrow("offline");

        expect(sessionInstance.post).toHaveBeenCalledWith("/auth/logout/", {});
        expect(getAccessToken()).toBeNull();
    });

    test("without navigator.locks a tab still refreshes once", async () => {
        const { refreshSession, sessionInstance } = loadAxiosModule({ withLocks: false });
        sessionInstance.post.mockResolvedValue({ data: { access_token: "fresh" } });

        const [a, b] = await Promise.all([refreshSession(), refreshSession()]);

        expect(sessionInstance.post).toHaveBeenCalledTimes(1);
        expect([a, b]).toEqual(["fresh", "fresh"]);
    });

    test("legacy JS-readable token cookies are purged", () => {
        const { purgeLegacyTokenCookies } = loadAxiosModule();
        cookieStore.access_token = "old";
        cookieStore.refresh_token = "old";

        purgeLegacyTokenCookies();

        expect(cookieStore.access_token).toBeUndefined();
        expect(cookieStore.refresh_token).toBeUndefined();
    });

    // GAIT-SEC-035/036: the interceptors' error log never carries credentials.
    test("a failed request is logged without body, Authorization header or query string", async () => {
        const { publicInstance } = loadAxiosModule();
        const error = {
            code: "ERR_BAD_REQUEST",
            config: {
                method: "post",
                url: "/login/?token=query-SECRET",
                headers: { Authorization: "Bearer access-SECRET" },
                data: JSON.stringify({ email: "a@b.c", password: "pw-SECRET" }),
            },
            response: { status: 400, headers: {}, data: { access_token: "resp-SECRET" } },
        };

        await expect(runResponseError(publicInstance, error)).rejects.toBe(error);

        expect(console.error).toHaveBeenCalledWith("Request failed: POST /login/, status 400, code ERR_BAD_REQUEST");
        expect(JSON.stringify(console.error.mock.calls)).not.toMatch(/SECRET|Bearer|token=|password/);
    });
});

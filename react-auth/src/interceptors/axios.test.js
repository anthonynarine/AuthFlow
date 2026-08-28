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

function loadAxiosModule() {
    jest.resetModules();
    Object.keys(cookieStore).forEach((key) => delete cookieStore[key]);

    const publicInstance = createMockAxiosInstance();
    const authInstance = createMockAxiosInstance();

    jest.doMock("axios", () => ({
        create: jest.fn()
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

    const module = require("./axios");
    const Cookies = require("js-cookie");

    return { ...module, publicInstance, authInstance, Cookies };
}

describe("Axios authentication rotation integration", () => {
    test("login response stores access and refresh tokens", () => {
        const { publicInstance, Cookies } = loadAxiosModule();
        const responseHandler = publicInstance.interceptors.response.handlers[0].fulfilled;

        responseHandler({
            data: { access_token: "access-1", refresh_token: "refresh-1" },
            headers: {},
            config: { url: "/login/" },
        });

        expect(Cookies.set).toHaveBeenCalledWith(
            "access_token",
            "access-1",
            expect.objectContaining({ expires: 1 / 96 })
        );
        expect(Cookies.set).toHaveBeenCalledWith(
            "refresh_token",
            "refresh-1",
            expect.objectContaining({ expires: 7 })
        );
    });

    test("successful refresh replaces both access and refresh tokens", async () => {
        const { authInstance } = loadAxiosModule();
        cookieStore.access_token = "expired-access";
        cookieStore.refresh_token = "refresh-a1";
        authInstance.post.mockResolvedValue({
            status: 200,
            data: { access_token: "access-2", refresh_token: "refresh-a2" },
        });
        const errorHandler = authInstance.interceptors.response.handlers[0].rejected;

        await errorHandler({
            response: { status: 401 },
            config: { url: "/private/", headers: {} },
        });

        expect(cookieStore.access_token).toBe("access-2");
        expect(cookieStore.refresh_token).toBe("refresh-a2");
        expect(cookieStore.refresh_token).not.toBe("refresh-a1");
    });

    test("multiple simultaneous 401 responses use one refresh request", async () => {
        const { authInstance } = loadAxiosModule();
        cookieStore.access_token = "expired-access";
        cookieStore.refresh_token = "refresh-a1";
        authInstance.post.mockResolvedValue({
            status: 200,
            data: { access_token: "access-2", refresh_token: "refresh-a2" },
        });
        const errorHandler = authInstance.interceptors.response.handlers[0].rejected;

        await Promise.all([
            errorHandler({ response: { status: 401 }, config: { url: "/a/", headers: {} } }),
            errorHandler({ response: { status: 401 }, config: { url: "/b/", headers: {} } }),
            errorHandler({ response: { status: 401 }, config: { url: "/c/", headers: {} } }),
        ]);

        expect(authInstance.post).toHaveBeenCalledTimes(1);
        expect(authInstance).toHaveBeenCalledTimes(3);
        expect(cookieStore.refresh_token).toBe("refresh-a2");
    });

    test("refresh failure clears auth state", async () => {
        const { authInstance, Cookies } = loadAxiosModule();
        cookieStore.access_token = "expired-access";
        cookieStore.refresh_token = "refresh-a1";
        authInstance.post.mockRejectedValue({ response: { status: 403 } });
        const errorHandler = authInstance.interceptors.response.handlers[0].rejected;

        await expect(errorHandler({
            response: { status: 401 },
            config: { url: "/private/", headers: {} },
        })).rejects.toEqual({ response: { status: 403 } });

        expect(Cookies.remove).toHaveBeenCalledWith("access_token");
        expect(Cookies.remove).toHaveBeenCalledWith("refresh_token");
        expect(cookieStore.access_token).toBeUndefined();
        expect(cookieStore.refresh_token).toBeUndefined();
    });

    test("refresh endpoint 401 does not recursively refresh", async () => {
        const { authInstance } = loadAxiosModule();
        const errorHandler = authInstance.interceptors.response.handlers[0].rejected;
        const error = {
            response: { status: 401 },
            config: { url: "/token-refresh/", headers: {} },
            message: "refresh failed",
        };

        await expect(errorHandler(error)).rejects.toBe(error);

        expect(authInstance.post).not.toHaveBeenCalled();
    });

    test("logout response clears local authentication state", () => {
        const { publicInstance, Cookies } = loadAxiosModule();
        cookieStore.access_token = "access-1";
        cookieStore.refresh_token = "refresh-1";
        const responseHandler = publicInstance.interceptors.response.handlers[0].fulfilled;

        responseHandler({
            data: {},
            headers: {},
            config: { url: "/logout/" },
        });

        expect(Cookies.remove).toHaveBeenCalledWith("access_token");
        expect(Cookies.remove).toHaveBeenCalledWith("refresh_token");
        expect(cookieStore.access_token).toBeUndefined();
        expect(cookieStore.refresh_token).toBeUndefined();
    });
});

import { formatSafeError, safeLogError, safeRequestPath, summarizeError } from "./safeLog";

/** An axios-shaped error carrying every secret a request can hold. */
function secretLadenAxiosError() {
    return {
        name: "AxiosError",
        message: "Request failed with status code 401 for hunter2-password",
        code: "ERR_BAD_REQUEST",
        config: {
            method: "post",
            baseURL: "https://api.example.test/api",
            url: "/login/?next=%2Fconsole&token=query-secret-value#frag-secret",
            headers: {
                Authorization: "Bearer header-access-token",
                "X-CSRFToken": "csrf-secret-value",
            },
            data: JSON.stringify({ email: "person@example.test", password: "hunter2-password" }),
        },
        request: { responseURL: "https://api.example.test/api/login/?token=query-secret-value" },
        response: {
            status: 401,
            headers: { "set-cookie": "gait_refresh=cookie-secret" },
            data: { code: "INVALID_CREDENTIALS", access_token: "response-access-token", detail: "Bad password hunter2-password" },
        },
    };
}

const SECRETS = [
    "hunter2-password",
    "Bearer",
    "header-access-token",
    "csrf-secret-value",
    "query-secret-value",
    "frag-secret",
    "next=",
    "?",
    "#",
    "person@example.test",
    "response-access-token",
    "cookie-secret",
    "api.example.test",
];

describe("safeLogError", () => {
    let errorSpy;

    beforeEach(() => {
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        errorSpy.mockRestore();
    });

    test("logs context, method, path, status and codes only", () => {
        safeLogError("Login failed", secretLadenAxiosError());

        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy.mock.calls[0]).toHaveLength(1);
        expect(errorSpy.mock.calls[0][0]).toBe(
            "Login failed: POST /api/login/, status 401, code ERR_BAD_REQUEST, server code INVALID_CREDENTIALS",
        );
    });

    test("never logs a password, token, Authorization header, query string or host", () => {
        safeLogError("Login failed", secretLadenAxiosError());

        const logged = JSON.stringify(errorSpy.mock.calls);
        for (const secret of SECRETS) {
            expect(logged).not.toContain(secret);
        }
    });

    test("an error without a response (network failure) logs method, path and code", () => {
        safeLogError("Request failed", {
            code: "ERR_NETWORK",
            config: { method: "get", url: "https://api.example.test/api/validate-session/?x=1" },
        });

        expect(errorSpy.mock.calls[0][0]).toBe("Request failed: GET /api/validate-session/, code ERR_NETWORK");
    });

    test("a non-HTTP error logs only its class name, never its message", () => {
        safeLogError("Login failed", new TypeError("cannot read password hunter2-password"));

        expect(errorSpy.mock.calls[0][0]).toBe("Login failed: TypeError");
    });

    test("nothing usable still logs the context, and never throws", () => {
        expect(() => safeLogError("Logout failed", undefined)).not.toThrow();
        expect(() => safeLogError("Logout failed", "a string with a token")).not.toThrow();
        expect(errorSpy.mock.calls.map((call) => call[0])).toEqual(["Logout failed", "Logout failed"]);
    });
});

describe("summarizeError", () => {
    test("a server code that is not a plain identifier is dropped", () => {
        const summary = summarizeError({
            config: { method: "post", url: "/x/" },
            response: { status: 400, data: { code: "free text with a secret" } },
        });

        expect(summary).toEqual({ method: "POST", path: "/x/", status: 400 });
    });

    test("an odd method value is dropped", () => {
        expect(summarizeError({ config: { method: "post token=abc", url: "/x/" } })).toEqual({ path: "/x/" });
    });
});

describe("safeRequestPath", () => {
    test("joins the base path and strips query and fragment", () => {
        expect(safeRequestPath({ baseURL: "https://h.test/api/", url: "/login/?a=b#c" })).toBe("/api/login/");
    });

    test("an absolute URL keeps only its path", () => {
        expect(safeRequestPath({ url: "https://user:pw@h.test/api/x/?token=t" })).toBe("/api/x/");
    });

    test("long token-shaped path segments are redacted", () => {
        expect(safeRequestPath({ url: "/organizations/acme/invites/AbCdEf0123456789_-AbCdEf0123/accept/" })).toBe(
            "/organizations/acme/invites/:redacted/accept/",
        );
    });

    test("ordinary ids and slugs are kept", () => {
        expect(safeRequestPath({ url: "/organizations/acme-co/applications/42/checks/" })).toBe(
            "/organizations/acme-co/applications/42/checks/",
        );
    });

    // GAIT-SEC-095
    test("a protocol-relative URL drops its userinfo and host", () => {
        expect(safeRequestPath({ url: "//user:pw@evil.test/api/login/?token=t" })).toBe("/api/login/");
        expect(safeRequestPath({ baseURL: "//user:pw@h.test/api", url: "/x/" })).toBe("/api/x/");
    });

    test("a segment containing @ is redacted", () => {
        expect(safeRequestPath({ url: "/users/person@example.test/" })).toBe("/users/:redacted/");
        expect(safeRequestPath({ url: "/a/@x/" })).toBe("/a/:redacted/");
    });

    test("short mixed-case or punctuated segments are redacted", () => {
        expect(safeRequestPath({ url: "/invites/AbC9/accept/" })).toBe("/invites/:redacted/accept/");
        expect(safeRequestPath({ url: "/x/a.b/y/c%20d/z/e=f/" })).toBe("/x/:redacted/y/:redacted/z/:redacted/");
    });

    test("long lowercase token-like segments are redacted, long numeric ids are kept", () => {
        expect(safeRequestPath({ url: "/reset/0123456789abcdef0123456789abcdef/" })).toBe("/reset/:redacted/");
        expect(safeRequestPath({ url: "/cases/123456789012345678901234567890/" })).toBe(
            "/cases/123456789012345678901234567890/",
        );
    });

    test("real Gait routes pass unchanged", () => {
        for (const route of [
            "/api/two-factor-login/",
            "/api/user/2fa/recovery-codes/",
            "/api/organizations/acme-co/security/findings/17/accept-risk/",
            "/api/security/tenant-signals/batch/",
            "/api/email-verification/resend/",
            "/api/auth/refresh/",
        ]) {
            expect(safeRequestPath({ url: route })).toBe(route);
        }
    });

    test("no config or no url gives no path", () => {
        expect(safeRequestPath(undefined)).toBeUndefined();
        expect(safeRequestPath({})).toBeUndefined();
    });
});

describe("formatSafeError", () => {
    test("falls back to a generic label when context is missing", () => {
        expect(formatSafeError(undefined, { response: { status: 500 } })).toBe("Error: status 500");
    });
});

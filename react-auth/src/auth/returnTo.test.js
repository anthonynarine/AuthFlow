import { DEFAULT_AFTER_SIGN_IN, INVITE_ACCEPT_PATH, afterSignIn, safeReturnTo } from "./returnTo";

describe("returnTo allowlist", () => {
    test.each([
        INVITE_ACCEPT_PATH,
        "/console",
        "/console/acme/overview",
        "/console/acme/security?env=production",
        "/console/acme/security/findings/0f8e-11aa?env=staging",
    ])("accepts in-app console destination %s", (value) => {
        expect(safeReturnTo(value)).toBe(value);
    });

    test.each([
        ["protocol-relative", "//evil.com"],
        ["backslash trick", "/\\evil.com"],
        ["backslash inside console", "/console\\..\\evil.com"],
        ["absolute URL", "https://evil.com/console/acme"],
        ["javascript URL", ["javascript", "alert(1)"].join(":")],
        ["data URL", "data:text/html,hi"],
        ["path traversal", "/console/../evil"],
        ["encoded slash", "/console/%2F%2Fevil.com"],
        ["other in-app page", "/workspace/apps"],
        ["login loop", "/login"],
        ["fragment", "/console/acme#token=x"],
        ["whitespace", " /console/acme"],
        ["empty", ""],
        ["not a string", { path: "/console" }],
        ["overlong", `/console/${"a".repeat(400)}`],
    ])("rejects %s", (_, value) => {
        expect(safeReturnTo(value)).toBeNull();
        expect(afterSignIn(value)).toBe(DEFAULT_AFTER_SIGN_IN);
    });

    test("no returnTo means the usual default", () => {
        expect(afterSignIn(undefined)).toBe("/workspace");
    });
});

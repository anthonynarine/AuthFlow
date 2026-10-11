import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { spawnSync } from "child_process";
import ConnectingYourSoftware from "./ConnectingYourSoftware";
import LocalToProduction from "./LocalToProduction";
import { VERIFY_APPLICATION } from "./snippets";

function renderSetup() {
    render(<MemoryRouter><ConnectingYourSoftware /></MemoryRouter>);
}

function section(title) {
    return screen.getByRole("heading", { name: title }).closest("section");
}

test("setup explains backend storage, framework loading, restart and the sign-in boundary", () => {
    renderSetup();
    expect(section("Configure it")).toHaveTextContent(".gitignore");
    expect(section("Configure it")).toHaveTextContent("frontend code");
    expect(section("Django configuration")).toHaveTextContent('config("GAIT_APPLICATION_CREDENTIAL")');
    expect(section("Django configuration")).toHaveTextContent("settings take precedence");
    expect(section("FastAPI configuration")).toHaveTextContent("working directory and its parents");
    expect(section("FastAPI configuration")).toHaveTextContent("before importing SDK modules");
    expect(section("FastAPI configuration")).toHaveTextContent("restart the backend");
    expect(screen.getByRole("complementary", { name: "Application identity and user sign-in are separate" }))
        .toHaveTextContent("does not sign in users or protect API routes by itself");
    expect(screen.getByRole("link", { name: "Django" })).toHaveAttribute("href", "/docs/connecting-your-software#django");
    expect(screen.getByRole("link", { name: "FastAPI" })).toHaveAttribute("href", "/docs/connecting-your-software#fastapi");
});

test("production setup uses a separate secret and checks production identity before reporting", () => {
    render(<MemoryRouter><LocalToProduction /></MemoryRouter>);
    expect(section("Add production")).toHaveTextContent("hosting secret settings");
    expect(section("Add production")).toHaveTextContent('EXPECTED_ENVIRONMENT = "production"');
    expect(section("Add production")).toHaveTextContent("same name and slug");
    expect(section("Add production")).toHaveTextContent("not a server hostname");
    expect(screen.getByRole("complementary", { name: "Never copy a key between environments" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "connection check" })).toHaveAttribute(
        "href", "/docs/connecting-your-software#verify-the-connection"
    );
});

test("clipboard rejection leaves the connection example available for manual copying", async () => {
    const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", {
        configurable: true, value: { writeText: jest.fn().mockRejectedValue(new Error("Denied")) },
    });
    try {
        renderSetup();
        const check = within(section("Verify the connection"));
        fireEvent.click(check.getByRole("button", { name: "Copy connection check" }));
        expect(await check.findByText("Couldn't copy. Select the text and copy it manually.")).toBeInTheDocument();
        expect(section("Verify the connection")).toHaveTextContent(VERIFY_APPLICATION.replace(/\s+/g, " "));
    } finally {
        if (original) Object.defineProperty(navigator, "clipboard", original);
        else delete navigator.clipboard;
    }
});

// Execute the exact copyable Python example against a fake SDK. No secrets,
// network, environment-file access or installed Python SDK are needed.
const HARNESS = `import contextlib, io, json, sys, types
data = json.load(sys.stdin)
class InvalidApplicationCredentialError(Exception): pass
class AuthServiceUnavailable(Exception): pass
async def verify_application():
    if data["outcome"] == "rejected": raise InvalidApplicationCredentialError()
    if data["outcome"] == "outage": raise AuthServiceUnavailable()
    return types.SimpleNamespace(**data["identity"])
package = types.ModuleType("gait_sdk")
application = types.ModuleType("gait_sdk.application")
application.verify_application = verify_application
exceptions = types.ModuleType("gait_sdk.exceptions")
exceptions.InvalidApplicationCredentialError = InvalidApplicationCredentialError
exceptions.AuthServiceUnavailable = AuthServiceUnavailable
sys.modules.update({"gait_sdk": package, "gait_sdk.application": application, "gait_sdk.exceptions": exceptions})
output = io.StringIO()
exit_message = None
with contextlib.redirect_stdout(output):
    try: exec(data["snippet"], {})
    except SystemExit as error: exit_message = str(error)
print(json.dumps({"stdout": output.getvalue(), "exit": exit_message}))`;

function runCheck({ outcome = "ok", identity = {}, environment = "local" } = {}) {
    const snippet = VERIFY_APPLICATION
        .replace("<your workspace slug>", "moneta")
        .replace("<your application slug>", "moneta-api")
        .replace('EXPECTED_ENVIRONMENT = "local"', `EXPECTED_ENVIRONMENT = "${environment}"`);
    const result = spawnSync("python3", ["-c", HARNESS], {
        input: JSON.stringify({ snippet, outcome, identity: {
            organization_slug: "moneta", application_slug: "moneta-api", environment: "local", ...identity,
        } }),
        encoding: "utf8", timeout: 10000,
        env: { PATH: process.env.PATH, LANG: "en_US.UTF-8" },
    });
    if (result.error) throw result.error;
    expect(result.status).toBe(0);
    return JSON.parse(result.stdout);
}

test("connection example prints success only for the expected application identity", () => {
    expect(runCheck()).toEqual({ stdout: "Connected: moneta-api · local\n", exit: null });
    expect(runCheck({ identity: { environment: "production" }, environment: "production" }))
        .toEqual({ stdout: "Connected: moneta-api · production\n", exit: null });
});

test.each([
    { organization_slug: "another-workspace" },
    { application_slug: "another-app" },
    { environment: "production" },
])("connection example denies a mismatched identity: %j", (identity) => {
    expect(runCheck({ identity })).toEqual({
        stdout: "", exit: "Connection failed: wrong workspace, app or environment.",
    });
});

test.each([
    ["rejected", "Connection failed: key missing or rejected."],
    ["outage", "Connection failed: check API URL and connectivity."],
])("connection example denies %s without a fallback identity", (outcome, exit) => {
    expect(runCheck({ outcome })).toEqual({ stdout: "", exit });
});

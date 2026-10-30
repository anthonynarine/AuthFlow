import { spawnSync } from "child_process";
import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, act } from "@testing-library/react";
import { IssueKeyDialog } from "./ApplicationDialogs";
import { buildVerification, buildSetupSteps } from "../../../components/workspace/onboarding/sdkInstructions";

const application = { name: "Moneta", slug: "moneta", environment: "production" };
const secret = "test-only-secret";
function setup(issue = jest.fn().mockResolvedValue({ raw_secret: secret })) {
    const onClose = jest.fn();
    const onIssued = jest.fn();
    const view = render(<IssueKeyDialog organizationSlug="moneta-org" application={application} deploymentMode="production"
        issue={issue} onIssued={onIssued} onClose={onClose} />);
    return { ...view, issue, onClose, onIssued };
}
async function issueKey() {
    fireEvent.click(screen.getByRole("button", { name: "Issue key" }));
    await screen.findByRole("textbox", { name: "Connection key" });
}

test("framework choice changes complete setup without issuing again or embedding the secret", async () => {
    const { issue } = setup();
    await issueKey();
    expect(screen.getByText('pip install "gait-sdk[django]==0.5.4"')).toBeInTheDocument();
    expect(screen.getByText(/from decouple import config/)).toBeInTheDocument();
    expect(screen.getByText(/EXPECTED_WORKSPACE = "moneta-org"/)).toHaveTextContent('EXPECTED_ENVIRONMENT = "production"');
    fireEvent.click(screen.getByRole("button", { name: "FastAPI" }));
    expect(screen.getByText('pip install "gait-sdk[fastapi]==0.5.4"')).toBeInTheDocument();
    expect(screen.getByText(/process working directory/)).toBeInTheDocument();
    expect(screen.queryByText(/from decouple import config/)).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Backend setup" })).not.toHaveTextContent(secret);
    expect(issue).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Done" })).toBeDisabled();
});

test("clipboard rejection selects the key and setup snippet for manual copy", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: jest.fn().mockRejectedValue(new Error("denied")) } });
    setup();
    await issueKey();
    fireEvent.click(screen.getByRole("button", { name: "Copy key" }));
    await screen.findByText("Couldn't copy. The key is selected: copy it manually.");
    const key = screen.getByRole("textbox", { name: "Connection key" });
    expect(key.selectionEnd - key.selectionStart).toBe(secret.length);
    fireEvent.click(screen.getByRole("button", { name: "Copy 1. Install the Gait SDK" }));
    await screen.findByText("Clipboard unavailable. The snippet is selected: copy it manually.");
    expect(window.getSelection().toString()).toContain("gait-sdk[django]");
});

test("denied issuance displays no secret or setup", async () => {
    setup(jest.fn().mockRejectedValue({ response: { status: 403 } }));
    fireEvent.click(screen.getByRole("button", { name: "Issue key" }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("region", { name: "Backend setup" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Connection key" })).not.toBeInTheDocument();
});

test("dismissal before issuance resolves discards result and notification", async () => {
    let resolve;
    const { onClose, onIssued } = setup(jest.fn(() => new Promise((done) => { resolve = done; })));
    fireEvent.click(screen.getByRole("button", { name: "Issue key" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await act(async () => resolve({ raw_secret: secret }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onIssued).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Connection key" })).not.toBeInTheDocument();
});

test("verification escapes identity and existing key instructions retain a placeholder", () => {
    expect(buildVerification({ organizationSlug: 'quoted"workspace', application })).toContain('EXPECTED_WORKSPACE = "quoted\\"workspace"');
    const steps = buildSetupSteps({ frameworkKey: "django", connectionKey: secret, application });
    expect(steps.map((step) => step.code).join("\n")).not.toContain(secret);
    expect(steps[1].code).toContain("<your connection key>");
});

const PYTHON_HARNESS = `import json, sys, types
payload = json.load(sys.stdin)
class InvalidApplicationCredentialError(Exception): pass
class AuthServiceUnavailable(Exception): pass
async def verify_application():
    if payload["denied"]: raise InvalidApplicationCredentialError()
    return types.SimpleNamespace(**payload["identity"])
sdk = types.ModuleType("gait_sdk")
app = types.ModuleType("gait_sdk.application")
app.verify_application = verify_application
exceptions = types.ModuleType("gait_sdk.exceptions")
exceptions.InvalidApplicationCredentialError = InvalidApplicationCredentialError
exceptions.AuthServiceUnavailable = AuthServiceUnavailable
sys.modules.update({"gait_sdk": sdk, "gait_sdk.application": app, "gait_sdk.exceptions": exceptions})
exec(payload["snippet"], {})`;

test.each([
    ["production", false, 0, "Connected: moneta · production"],
    ["local", false, 1, "wrong workspace, app or environment"],
    ["production", true, 1, "key missing or rejected"],
])("generated production check executes and denies wrong identity or rejection (%s, %s)", (environment, denied, status, text) => {
    const result = spawnSync("python3", ["-c", PYTHON_HARNESS], {
        input: JSON.stringify({ snippet: buildVerification({ organizationSlug: "moneta-org", application }),
            denied, identity: { organization_slug: "moneta-org", application_slug: "moneta", environment } }),
        encoding: "utf8", timeout: 10000,
        env: { PATH: process.env.PATH, LANG: "en_US.UTF-8" },
    });
    expect(result.status).toBe(status);
    expect(result.stdout + result.stderr).toContain(text);
    expect(result.stdout).toBe(status ? "" : "Connected: moneta · production\n");
});

test("local key dialog does not export static production connection instructions", async () => {
    render(<IssueKeyDialog organizationSlug="dev-org" application={{ ...application, environment: "local" }} issue={jest.fn().mockResolvedValue({ raw_secret: secret })} onIssued={jest.fn()} onClose={jest.fn()} />);
    await issueKey();
    expect(screen.queryByRole("region", { name: "Backend setup" })).not.toBeInTheDocument();
    expect(screen.getByText(/server-authorized setup card/)).toBeInTheDocument();
});

test.each(["hosted-development", undefined])("production-labelled app cannot export production pins without confirmed production deployment (%s)", async (deploymentMode) => {
    render(<IssueKeyDialog organizationSlug="dev-org" application={application} deploymentMode={deploymentMode}
        issue={jest.fn().mockResolvedValue({ raw_secret: secret })} onIssued={jest.fn()} onClose={jest.fn()} />);
    await issueKey();
    expect(screen.queryByText(/pip install/)).not.toBeInTheDocument();
    expect(screen.queryByText(/api.gaitobservatory.com/)).not.toBeInTheDocument();
    expect(screen.getByText(/Deployment-specific connection instructions are unavailable/)).toBeInTheDocument();
});

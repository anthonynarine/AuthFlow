import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HostedEnrollment } from "./HostedEnrollment";
import { fetchHostedEnrollment, configureHostedEnrollment, revokeHostedEnrollment } from "../../api/consoleApi";
jest.mock("../../api/consoleApi");
const application = { id: "a1", name: "Moneta dev", environment: "local", status: "ACTIVE" };
const props = { application, organizationSlug: "moneta", canManage: true };
const capability = { application_id: "a1", environment: "local", deployment_mode: "hosted-development", local_enrollment_available: true, proof_method: "local_owner", public_ownership_verified: false, enrollment_status: "unconfigured", origins: [], can_configure: true, can_revoke: false, version: 1 };
const pins = { issuer: "https://dev-auth.example.test", api_base_url: "https://dev-api.example.test/api", jwks_uri: "https://dev-api.example.test/.well-known/jwks.json", audience: "urn:gait:dev:a1" };
let client;
function view(values = props) { return <MemoryRouter><QueryClientProvider client={client}><HostedEnrollment {...values} /></QueryClientProvider></MemoryRouter>; }
async function setup() { const utils = render(view()); await screen.findByLabelText("Exact local browser origins, one per line"); return utils; }
beforeEach(() => { jest.clearAllMocks(); client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); fetchHostedEnrollment.mockResolvedValue(capability); });
test("server deployment is separate from app environment and explicit owner authorization is required", async () => {
 await setup(); expect(screen.getByText("Deployment: Hosted development")).toBeInTheDocument(); expect(fetchHostedEnrollment).toHaveBeenCalledWith("moneta", "a1");
 fireEvent.change(screen.getByLabelText("Exact local browser origins, one per line"), { target: { value: "http://localhost:3000\nhttp://127.0.0.1:5173" } });
 const configure = screen.getByRole("button", { name: "Configure local development" }); expect(configure).toBeDisabled();
 fireEvent.click(screen.getByRole("checkbox", { name: /I authorize/ })); fireEvent.click(configure);
 await waitFor(() => expect(configureHostedEnrollment).toHaveBeenCalledWith("moneta", "a1", ["http://localhost:3000", "http://127.0.0.1:5173"], undefined));
 expect(screen.queryByText(/Local development configured/)).not.toBeInTheDocument();
});
test.each([{ deployment_mode: "production" }, { local_enrollment_available: false }, { proof_method: "https-well-known" }])("closed capability has no local instructions or copied configuration (%j)", async (overrides) => {
 fetchHostedEnrollment.mockResolvedValue({ ...capability, ...pins, ...overrides, enrollment_status: "active" }); render(view());
 await screen.findByText(/Local enrollment is not available/);
 expect(screen.queryByRole("button", { name: "Configure local development" })).not.toBeInTheDocument();
 expect(screen.queryByText(/GAIT_AUTH_URL=/)).not.toBeInTheDocument();
});
test("stale application data and API failure do not imply configured success", async () => {
 fetchHostedEnrollment.mockResolvedValue({ ...capability, application_id: "different", enrollment_status: "active" }); render(view());
 await screen.findByRole("alert"); expect(screen.queryByText(/Local development configured/)).not.toBeInTheDocument();
 fetchHostedEnrollment.mockRejectedValue({ response: { status: 503 } }); fireEvent.click(screen.getByRole("button", { name: "Retry server capabilities" }));
 await screen.findByRole("alert"); expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});
test("active server enrollment copies public pins only and never claims login tested", async () => {
 fetchHostedEnrollment.mockResolvedValue({ ...capability, ...pins, enrollment_status: "active", origins: ["http://localhost:3000"], mfa_policy: "optional" });
 Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: jest.fn().mockResolvedValue() } });
 await setup(); expect(screen.getByText(/Local development configured/)).toHaveTextContent("Login: not tested");
 fireEvent.click(screen.getByRole("checkbox", { name: "Developer / AI handoff" })); fireEvent.click(screen.getByRole("button", { name: "Copy development configuration" }));
 await screen.findByText("Copied non-secret development configuration.");
 expect(navigator.clipboard.writeText.mock.calls[0][0]).toContain(`GAIT_AUTH_URL=${pins.api_base_url}`);
 expect(navigator.clipboard.writeText.mock.calls[0][0]).not.toMatch(/GAIT_APPLICATION_CREDENTIAL=/);
 expect(navigator.clipboard.writeText.mock.calls[0][0]).toContain("/application-auth/a1/{login,mfa,refresh,logout,status,activity}/");
 expect(navigator.clipboard.writeText.mock.calls[0][0]).toContain("Gait-Application-Credential");
 expect(navigator.clipboard.writeText.mock.calls[0][0]).toContain("Never send or forward browser Origin, Cookie or Authorization");
 expect(navigator.clipboard.writeText.mock.calls[0][0]).toContain("opaque application cookie");
 expect(navigator.clipboard.writeText.mock.calls[0][0]).toContain("0.5.4 does not establish support");
 expect(navigator.clipboard.writeText.mock.calls[0][0]).toContain('MFA policy: "optional"');
 expect(navigator.clipboard.writeText.mock.calls[0][0]).toContain("Optional policy still enforces an account's enabled second factor");
 expect(navigator.clipboard.writeText.mock.calls[0][0]).toContain("password-only sign-in is never MFA assurance");
});
test("server refusal preserves form and does not retry; revoke needs confirmation", async () => {
 fetchHostedEnrollment.mockResolvedValue({ ...capability, ...pins, enrollment_status: "active", origins: ["http://localhost:3000"], can_revoke: true });
 revokeHostedEnrollment.mockRejectedValue({ response: { status: 403, data: { code: "reauthentication_required" } } });
 await setup(); const button = screen.getByRole("button", { name: "Revoke local enrollment" }); expect(button).toBeDisabled();
 fireEvent.click(screen.getByRole("checkbox", { name: /I understand revocation/ })); fireEvent.click(button);
 await screen.findByText(/Sign in again with your password/); expect(revokeHostedEnrollment).toHaveBeenCalledTimes(1);
 expect(screen.getByLabelText("Exact local browser origins, one per line")).toHaveValue("http://localhost:3000");
});
test("read only user never fetches privileged capabilities", () => { render(view({ ...props, canManage: false })); expect(fetchHostedEnrollment).not.toHaveBeenCalled(); expect(screen.queryByRole("textbox")).not.toBeInTheDocument(); });
test("scope switch discards draft origins before a different app can submit", async () => {
 const { rerender } = await setup(); fireEvent.change(screen.getByRole("textbox"), { target: { value: "http://localhost:9999" } });
 fetchHostedEnrollment.mockResolvedValue({ ...capability, application_id: "b2" }); rerender(view({ ...props, application: { ...application, id: "b2" } }));
 await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue("")); expect(configureHostedEnrollment).not.toHaveBeenCalled();
});

test("optional MFA comes from the server and still explains enrolled account enforcement", async () => {
 fetchHostedEnrollment.mockResolvedValue({ ...capability, mfa_policy: "optional" });
 await setup();
 expect(screen.getByLabelText("Multi-factor authentication (MFA)")).toHaveValue("optional");
 expect(screen.getByText(/Users can sign in with a password/)).toHaveTextContent("must still complete it");
 expect(configureHostedEnrollment).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText("Exact local browser origins, one per line"), { target: { value: "http://localhost:5173" } });
 fireEvent.change(screen.getByLabelText("Multi-factor authentication (MFA)"), { target: { value: "required" } });
 expect(screen.getByRole("button", { name: "Configure local development" })).toBeDisabled();
 fireEvent.click(screen.getByRole("checkbox", { name: /I authorize/ }));
 fireEvent.click(screen.getByRole("button", { name: "Configure local development" }));
 await waitFor(() => expect(configureHostedEnrollment).toHaveBeenCalledWith("moneta", "a1", ["http://localhost:5173"], "required"));
});

test.each([undefined, "unknown", false])("unsupported policy never offers or submits an optional downgrade (%s)", async (mfa_policy) => {
 fetchHostedEnrollment.mockResolvedValue({ ...capability, mfa_policy });
 await setup();
 expect(screen.queryByLabelText("Multi-factor authentication (MFA)")).not.toBeInTheDocument();
 expect(screen.getByText(/MFA policy is unavailable/)).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText("Exact local browser origins, one per line"), { target: { value: "http://localhost:5173" } });
 fireEvent.click(screen.getByRole("checkbox", { name: /I authorize/ }));
 fireEvent.click(screen.getByRole("button", { name: "Configure local development" }));
 await waitFor(() => expect(configureHostedEnrollment).toHaveBeenCalledWith("moneta", "a1", ["http://localhost:5173"], undefined));
});

test("policy drafts cannot cross application scope", async () => {
 fetchHostedEnrollment.mockResolvedValue({ ...capability, mfa_policy: "required" });
 const { rerender } = await setup();
 fireEvent.change(screen.getByLabelText("Multi-factor authentication (MFA)"), { target: { value: "optional" } });
 fetchHostedEnrollment.mockResolvedValue({ ...capability, application_id: "b2", mfa_policy: "required" });
 rerender(view({ ...props, application: { ...application, id: "b2" } }));
 await waitFor(() => expect(screen.getByLabelText("Multi-factor authentication (MFA)")).toHaveValue("required"));
 expect(configureHostedEnrollment).not.toHaveBeenCalled();
});

test("a previously acknowledged configuration cannot silently lower Required MFA", async () => {
 fetchHostedEnrollment.mockResolvedValue({ ...capability, mfa_policy: "required", origins: ["http://localhost:5173"] });
 await setup();
 fireEvent.click(screen.getByRole("checkbox", { name: /I authorize/ }));
 fireEvent.change(screen.getByLabelText("Multi-factor authentication (MFA)"), { target: { value: "optional" } });
 expect(screen.getByRole("checkbox", { name: /Changing Required to Optional/ })).not.toBeChecked();
 const save = screen.getByRole("button", { name: "Configure local development" });
 expect(save).toBeDisabled();
 fireEvent.submit(screen.getByRole("form", { name: "Local development sign-in settings" }));
 expect(configureHostedEnrollment).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole("checkbox", { name: /Changing Required to Optional/ }));
 fireEvent.click(save);
 await waitFor(() => expect(configureHostedEnrollment).toHaveBeenCalledWith("moneta", "a1", ["http://localhost:5173"], "optional"));
});

test("a pending policy change cannot submit a second enrollment mutation", async () => {
 let finish;
 configureHostedEnrollment.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
 fetchHostedEnrollment.mockResolvedValue({ ...capability, mfa_policy: "optional", origins: ["http://localhost:5173"] });
 await setup();
 fireEvent.click(screen.getByRole("checkbox", { name: /I authorize/ }));
 fireEvent.click(screen.getByRole("button", { name: "Configure local development" }));
 await screen.findByRole("button", { name: "Applying change…" });
 fireEvent.submit(screen.getByRole("form", { name: "Local development sign-in settings" }));
 expect(configureHostedEnrollment).toHaveBeenCalledTimes(1);
 finish({});
 await screen.findByRole("button", { name: "Configure local development" });
});

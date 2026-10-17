import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginRegistration } from "./LoginRegistration";
import { fetchLoginRegistration, saveLoginRegistration, challengeLoginRegistration, verifyLoginRegistration, revokeLoginRegistration, changeLoginRegistrationTransport } from "../../api/consoleApi";
jest.mock("../../api/consoleApi");
const application = { id: "app1", name: "Moneta", environment: "production", status: "ACTIVE" };
const props = { organizationSlug: "moneta", application, canManage: true };
const pending = { status: "pending", version: 1, backend_url: "https://api.example.test", api_base_url: "https://auth.example.test/api", login_origin: "https://app.example.test", audience: "urn:gait:app1:production", issuer: "https://issuer.example.test", jwks_uri: "https://issuer.example.test/.well-known/jwks.json", ownership_challenge: { method: "https-well-known", url: "https://app.example.test/.well-known/gait-domain-verification", content: "dummy-public-challenge", expires_at: "2099-10-15T12:00:00Z" } };
let client;
function CurrentLocation() { const location = useLocation(); return <output aria-label="Current route">{JSON.stringify({ pathname: location.pathname, state: location.state })}</output>; }
function view(values = props) { return <MemoryRouter initialEntries={["/console/moneta/applications/app1?env=production"]}><QueryClientProvider client={client}><LoginRegistration {...values} /><CurrentLocation /></QueryClientProvider></MemoryRouter>; }
async function setup(expand = true) { const utils = render(view()); await screen.findByLabelText("Backend URL"); if (expand) { for (const name of ["Advanced · session transport and browser support"]) { const button = screen.queryByRole("button", { name }); if (button) fireEvent.click(button); } } if (expand) fireEvent.click(screen.getByRole("button", { name: "1. Register URLs" })); return utils; }
function stepAction(name) { const step = name === "Save pending registration" ? "1. Register URLs" : name === "Copy backend configuration" ? "3. Connect backend" : "2. Verify ownership"; fireEvent.click(screen.getByRole("button", { name: step })); return screen.getByRole("button", { name }); }
beforeEach(() => { jest.clearAllMocks(); client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); fetchLoginRegistration.mockResolvedValue(pending); });
test("scope reads server registration and keeps software identity and MFA distinct", async () => {
 await setup(); expect(fetchLoginRegistration).toHaveBeenCalledWith("moneta", "app1");
 expect(screen.getByLabelText("Frontend login origin")).toHaveValue("https://app.example.test");
 expect(screen.getByText(/This guide sets up human sign-in separately/)).toBeInTheDocument();
 expect(screen.getByText(/Registration alone is not MFA proof/)).toBeInTheDocument();
 expect(screen.queryByRole("button", { name: "Copy backend configuration" })).not.toBeInTheDocument();
 fireEvent.click(stepAction("Verify ownership with Gait"));
 await waitFor(() => expect(verifyLoginRegistration).toHaveBeenCalledWith("moneta", "app1"));
});
test("save submits only backend and frontend URL and generates challenge explicitly", async () => {
 await setup(); expect(saveLoginRegistration).not.toHaveBeenCalled();
 fireEvent.click(stepAction("Generate new ownership challenge"));
 await waitFor(() => expect(challengeLoginRegistration).toHaveBeenCalledWith("moneta", "app1"));
 fireEvent.change(screen.getByLabelText("Backend URL"), { target: { value: "https://moneta.herokuapp.com" } });
 fireEvent.click(stepAction("Save pending registration"));
 await waitFor(() => expect(saveLoginRegistration).toHaveBeenCalledWith("moneta", "app1", { backend_url: "https://moneta.herokuapp.com", login_origin: "https://app.example.test" }));
});
test("active registration copies exact trusted pins and requires revocation confirmation", async () => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active", ownership_challenge: null });
 Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: jest.fn().mockResolvedValue() } });
 await setup(); fireEvent.click(stepAction("Copy backend configuration"));
 await screen.findByText(/Copied verified registration pins/);
 expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`GAIT_TOKEN_VERIFIER=jwks\nGAIT_AUTH_URL=${pending.api_base_url}\nGAIT_JWKS_URL=${pending.jwks_uri}\nGAIT_ISSUER=${pending.issuer}\nGAIT_AUDIENCE=${pending.audience}`);
 const revoke = screen.getByRole("button", { name: "Revoke login registration" }); expect(revoke).toBeDisabled();
 fireEvent.click(screen.getByRole("checkbox", { name: /I understand revocation/ })); fireEvent.click(revoke);
 await waitFor(() => expect(revokeLoginRegistration).toHaveBeenCalledWith("moneta", "app1"));
});
test("unavailable or forbidden endpoint fails closed and offers retry", async () => {
 fetchLoginRegistration.mockRejectedValue({ response: { status: 503 } }); render(view());
 await screen.findByText(/No login readiness is confirmed/);
 expect(screen.queryByLabelText("Frontend login origin")).not.toBeInTheDocument();
 fetchLoginRegistration.mockResolvedValue(pending); fireEvent.click(screen.getByRole("button", { name: "Retry login registration" }));
 await screen.findByLabelText("Frontend login origin");
});
test("role denial does not fetch registration; scope changes discard edited URL", async () => {
 const { rerender } = await setup(); fireEvent.change(screen.getByLabelText("Frontend login origin"), { target: { value: "https://edited.test" } });
 fetchLoginRegistration.mockResolvedValue({ ...pending, login_origin: "https://other.test" });
 rerender(view({ ...props, organizationSlug: "other", application: { ...application, id: "app2" } }));
 await waitFor(() => expect(screen.getByLabelText("Frontend login origin")).toHaveValue("https://other.test"));
 rerender(view({ ...props, canManage: false }));
 expect(screen.queryByLabelText("Frontend login origin")).not.toBeInTheDocument();
 expect(screen.getByText(/Only Owners and Admins/)).toBeInTheDocument();
});
test("server conflict and fresh-TOTP refusal preserve inputs without claiming readiness", async () => {
 saveLoginRegistration.mockRejectedValue({ response: { status: 409, data: { detail: "Registration conflicts with reserved configuration." } } });
 await setup(); fireEvent.change(screen.getByLabelText("Backend URL"), { target: { value: "https://edited.example.test" } }); fireEvent.click(stepAction("Save pending registration"));
 await screen.findByText("Registration conflicts with reserved configuration.");
 saveLoginRegistration.mockRejectedValue({ response: { status: 403, data: { code: "reauthentication_required" } } });
 fireEvent.click(stepAction("Save pending registration"));
 await screen.findByText(/Sign in again with password and TOTP/);
 expect(screen.getByLabelText("Frontend login origin")).toHaveValue(pending.login_origin);
});

test("active edits need acknowledgement and unsaved changes cannot verify the saved target", async () => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active" });
 await setup();
 expect(stepAction("Save pending registration")).toBeDisabled();
 fireEvent.click(screen.getByRole("checkbox", { name: /I understand saving changes/ }));
 expect(stepAction("Save pending registration")).toBeDisabled();
 fireEvent.change(screen.getByLabelText("Backend URL"), { target: { value: "https://edited.example.test" } });
 expect(stepAction("Save pending registration")).not.toBeDisabled();
});
test("unsaved URLs block verification and rotating the saved target's challenge", async () => {
 await setup(); fireEvent.change(screen.getByLabelText("Frontend login origin"), { target: { value: "https://new.test" } });
 expect(stepAction("Verify ownership with Gait")).toBeDisabled();
 expect(stepAction("Generate new ownership challenge")).toBeDisabled();
 expect(verifyLoginRegistration).not.toHaveBeenCalled();
});
test("read-only role does not call the privileged API", () => {
 render(view({ ...props, canManage: false }));
 expect(fetchLoginRegistration).not.toHaveBeenCalled();
 expect(screen.getByText(/Only Owners and Admins/)).toBeInTheDocument();
});
test("active status without trusted pins cannot provide configuration", async () => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active", issuer: null });
 await setup(); expect(screen.queryByRole("button", { name: "Copy backend configuration" })).not.toBeInTheDocument();
 expect(screen.getByText(/Trusted server configuration unavailable/)).toBeInTheDocument();
});
test("clipboard failure preserves public configuration for manual copying", async () => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active" });
 Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: jest.fn().mockRejectedValue(new Error("denied")) } });
 await setup(); fireEvent.click(stepAction("Copy backend configuration"));
 await screen.findByText(/Clipboard unavailable/);
 expect(screen.getByText(/GAIT_ISSUER=/)).toHaveTextContent(pending.issuer);
});

test("active registration without confirmed API base cannot copy SDK configuration", async () => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active", api_base_url: null });
 await setup(); expect(screen.queryByRole("button", { name: "Copy backend configuration" })).not.toBeInTheDocument();
});

test("transport defaults to bearer and unavailable cookie never submits a change", async () => {
 await setup();
 expect(screen.getByRole("radio", { name: "Bearer (default)" })).toBeChecked();
 expect(screen.getByRole("radio", { name: "Cookie", exact: true })).toBeDisabled();
 expect(screen.getByRole("button", { name: "Save session transport" })).toBeDisabled();
 expect(screen.getByText(/Verify the exact frontend login origin/)).toBeInTheDocument();
});
test("verified cookie selection needs confirmation and sends only the transport mutation", async () => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active", session_transport: "bearer", cookie_transport_available: true, supported_session_transports: ["bearer", "cookie"] });
 await setup(); fireEvent.click(screen.getByRole("radio", { name: "Cookie", exact: true }));
 const save = screen.getByRole("button", { name: "Save session transport" });
 expect(save).toBeDisabled();
 fireEvent.click(screen.getByRole("checkbox", { name: /changing transport ends/ }));
 fireEvent.click(save);
 await waitFor(() => expect(changeLoginRegistrationTransport).toHaveBeenCalledWith("moneta", "app1", "cookie"));
 expect(saveLoginRegistration).not.toHaveBeenCalled();
 expect(screen.getByText(/Browsers can block third-party cookies/)).toBeInTheDocument();
 expect(screen.getByText(/Gait does not silently switch transports/)).toBeInTheDocument();
});
test("cookie availability must be explicit and consistent; URL edits block transport changes", async () => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active", cookie_transport_available: true, supported_session_transports: ["bearer"] });
 const { unmount } = await setup();
 expect(screen.getByRole("radio", { name: "Cookie", exact: true })).toBeDisabled();
 unmount(); client.clear();
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active", cookie_transport_available: true, supported_session_transports: ["bearer", "cookie"] });
 await setup();
 fireEvent.change(screen.getByLabelText("Frontend login origin"), { target: { value: "https://edited.example.test" } });
 expect(screen.getByRole("radio", { name: "Cookie", exact: true })).toBeDisabled();
 expect(changeLoginRegistrationTransport).not.toHaveBeenCalled();
});
test("disabled rollout permits an explicit bearer rollback without claiming cookie readiness", async () => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active", session_transport: "cookie", cookie_transport_available: false, supported_session_transports: ["bearer"] });
 await setup(); fireEvent.click(screen.getByRole("radio", { name: "Bearer (default)" }));
 fireEvent.click(screen.getByRole("checkbox", { name: /changing transport ends/ }));
 fireEvent.click(screen.getByRole("button", { name: "Save session transport" }));
 await waitFor(() => expect(changeLoginRegistrationTransport).toHaveBeenCalledWith("moneta", "app1", "bearer"));
 expect(screen.getByText(/Cookie transport is unavailable/)).toBeInTheDocument();
});
test("transport denial preserves saved authority and explains fresh MFA", async () => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active", session_transport: "bearer", cookie_transport_available: true, supported_session_transports: ["bearer", "cookie"] });
 changeLoginRegistrationTransport.mockRejectedValue({ response: { status: 403, data: { code: "reauthentication_required" } } });
 await setup(); fireEvent.click(screen.getByRole("radio", { name: "Cookie", exact: true }));
 fireEvent.click(screen.getByRole("checkbox", { name: /changing transport ends/ }));
 fireEvent.click(screen.getByRole("button", { name: "Save session transport" }));
 await screen.findByText(/Sign in again with password and TOTP/);
 expect(screen.getByText(/Saved transport:/)).toHaveTextContent("Bearer (default)");
});


test("path and query in frontend URL are corrected only by explicit confirmation", async () => {
 await setup();
 const origin = screen.getByLabelText("Frontend login origin");
 fireEvent.change(origin, { target: { value: "https://app.example.test/login?next=home" } });
 expect(origin).toHaveValue("https://app.example.test/login?next=home");
 expect(stepAction("Save pending registration")).toBeDisabled();
 expect(saveLoginRegistration).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole("button", { name: "Use this origin" }));
 expect(origin).toHaveValue("https://app.example.test");
 expect(stepAction("Save pending registration")).toBeDisabled();
 expect(saveLoginRegistration).not.toHaveBeenCalled();
});

test("challenge denial appears beside the action, focuses the alert and offers sign-in without replay", async () => {
 challengeLoginRegistration.mockRejectedValue({ response: { status: 403, data: { code: "reauthentication_required", detail: "private-server-details" } } });
 await setup();
 fireEvent.click(stepAction("Generate new ownership challenge"));
 const alert = await screen.findByRole("alert");
 expect(screen.getByRole("region", { name: "Registration action feedback" })).toContainElement(alert);
 expect(alert).toHaveFocus();
 expect(alert).toHaveTextContent("Gait has not retried it automatically");
 expect(alert).not.toHaveTextContent("private-server-details");
 fireEvent.click(screen.getByRole("button", { name: "Sign in again and return here" }));
 expect(screen.getByLabelText("Current route")).toHaveTextContent('"pathname":"/login"');
 expect(screen.getByLabelText("Current route")).toHaveTextContent('"returnTo":"/console/moneta/applications/app1?env=production"');
 expect(challengeLoginRegistration).toHaveBeenCalledTimes(1);
});

test("challenge shows pending feedback, explicit success and a manual retry after generic refusal", async () => {
 let resolve;
 challengeLoginRegistration.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
 await setup();
 const challenge = stepAction("Generate new ownership challenge");
 fireEvent.click(challenge);
 expect(await screen.findByText("Generating a new ownership challenge…")).toBeInTheDocument();
 expect(challenge).toBeDisabled();
 resolve({ status: "pending" });
 await screen.findByText("New ownership challenge generated. Publish the current proof before it expires.");
 challengeLoginRegistration.mockRejectedValueOnce({ response: { status: 403, data: { detail: "sensitive-detail" } } });
 fireEvent.click(challenge);
 expect(await screen.findByRole("alert")).toHaveTextContent("Gait refused this action");
 expect(screen.getByRole("alert")).not.toHaveTextContent("sensitive-detail");
 challengeLoginRegistration.mockResolvedValueOnce({ status: "pending" });
 fireEvent.click(challenge);
 await screen.findByText("New ownership challenge generated. Publish the current proof before it expires.");
 expect(challengeLoginRegistration).toHaveBeenCalledTimes(3);
});

test("save and verify each report their own pending and failed action without claiming readiness", async () => {
 saveLoginRegistration.mockRejectedValueOnce({ response: { status: 403, data: { code: "reauthentication_required" } } });
 verifyLoginRegistration.mockRejectedValueOnce({ response: { status: 403, data: { detail: "private-detail" } } });
 await setup();
 fireEvent.change(screen.getByLabelText("Backend URL"), { target: { value: "https://edited.example.test" } });
 fireEvent.click(stepAction("Save pending registration"));
 const saveAlert = await screen.findByRole("alert");
 expect(saveAlert).toHaveTextContent("Sign in again with password and TOTP");
 fireEvent.change(screen.getByLabelText("Backend URL"), { target: { value: pending.backend_url } });
 fireEvent.click(stepAction("Verify ownership with Gait"));
 await screen.findByText(/Gait refused this action/);
 expect(screen.getByRole("region", { name: "Registration action feedback" })).toContainElement(screen.getByRole("alert"));
 expect(screen.getByText("Registration: pending")).toBeInTheDocument();
 expect(verifyLoginRegistration).toHaveBeenCalledTimes(1);
});




test.each([["unconfigured", "1. Register URLs"], ["pending", "2. Verify ownership"], ["active", "3. Connect backend"]])("server %s chooses initial step %s without mutations", async (status, label) => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, status, ownership_challenge: status === "active" ? null : pending.ownership_challenge });
 await setup(false);
 expect(screen.getByRole("button", { name: label })).toHaveAttribute("aria-current", "step");
 expect(screen.getByText("Not tested", { selector: "dd" })).toBeVisible();
 expect(saveLoginRegistration).not.toHaveBeenCalled(); expect(verifyLoginRegistration).not.toHaveBeenCalled();
});

test("local navigation cannot unlock trusted configuration or mark login tested", async () => {
 await setup(false);
 fireEvent.click(screen.getByRole("button", { name: "3. Connect backend" }));
 expect(screen.queryByRole("button", { name: "Copy backend configuration" })).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole("button", { name: "4. Test login" }));
 expect(screen.getByRole("region", { name: "Test login" })).toHaveTextContent("guidance only");
 expect(screen.getByText("Not tested", { selector: "dd" })).toBeVisible();
 expect(verifyLoginRegistration).not.toHaveBeenCalled();
});

test("server verification, not a successful local click, advances pending to Connect", async () => {
 await setup(false);
 verifyLoginRegistration.mockResolvedValue({});
 fireEvent.click(screen.getByRole("button", { name: "Verify ownership with Gait" }));
 await screen.findByText(/Ownership check completed/);
 expect(screen.getByRole("button", { name: "2. Verify ownership" })).toHaveAttribute("aria-current", "step");
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active", version: 2, ownership_challenge: null });
 fireEvent.click(screen.getByRole("button", { name: "Verify ownership with Gait" }));
 await waitFor(() => expect(screen.getByRole("button", { name: "3. Connect backend" })).toHaveAttribute("aria-current", "step"));
 expect(screen.getByRole("button", { name: "Copy backend configuration" })).toBeVisible();
 expect(screen.getByText("Not tested", { selector: "dd" })).toBeVisible();
});

test("reauthentication feedback remains visible after navigation, with no replay", async () => {
 verifyLoginRegistration.mockRejectedValue({ response: { status: 403, data: { code: "reauthentication_required" } } });
 await setup(false);
 fireEvent.click(screen.getByRole("button", { name: "Verify ownership with Gait" }));
 const alert = await screen.findByRole("alert");
 fireEvent.click(screen.getByRole("button", { name: "4. Test login" }));
 expect(alert).toBeVisible();
 expect(screen.getByRole("button", { name: "Sign in again and return here" })).toBeVisible();
 expect(verifyLoginRegistration).toHaveBeenCalledTimes(1);
});


test("unsaved URL edits disable continue and verification across step navigation", async () => {
 await setup();
 fireEvent.change(screen.getByLabelText("Frontend login origin"), { target: { value: "https://edited.example.test" } });
 expect(screen.getByRole("button", { name: "Continue to ownership verification" })).toBeDisabled();
 fireEvent.click(screen.getByRole("button", { name: "2. Verify ownership" }));
 expect(screen.getByRole("button", { name: "Verify ownership with Gait" })).toBeDisabled();
 fireEvent.click(screen.getByRole("button", { name: "1. Register URLs" }));
 expect(screen.getByLabelText("Frontend login origin")).toHaveValue("https://edited.example.test");
 expect(verifyLoginRegistration).not.toHaveBeenCalled();
});

test("unconfigured URL save advances only when the server returns a saved pending registration", async () => {
 const unconfigured = { ...pending, status: "unconfigured", version: 0, ownership_challenge: null };
 fetchLoginRegistration.mockResolvedValue(unconfigured);
 saveLoginRegistration.mockResolvedValue({});
 await setup(false);
 fireEvent.click(screen.getByRole("button", { name: "Save pending registration" }));
 await screen.findByText(/Registration saved/);
 expect(screen.getByRole("button", { name: "1. Register URLs" })).toHaveAttribute("aria-current", "step");
 fetchLoginRegistration.mockResolvedValue({ ...pending, version: 2 });
 fireEvent.click(screen.getByRole("button", { name: "Save pending registration" }));
 await waitFor(() => expect(screen.getByRole("button", { name: "2. Verify ownership" })).toHaveAttribute("aria-current", "step"));
 expect(screen.getByText("Not tested", { selector: "dd" })).toBeVisible();
});

test("active Connect handoff copies exactly the displayed verified values without declaring login complete", async () => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active", ownership_challenge: null });
 Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: jest.fn().mockResolvedValue() } });
 await setup(false);
 fireEvent.change(screen.getByLabelText("Connection instructions"), { target: { value: "assisted" } });
 const handoff = screen.getByText(/Configure user sign-in in the existing backend/, { selector: "pre" });
 fireEvent.click(screen.getByRole("button", { name: "Copy developer handoff" }));
 await screen.findByText(/Copied verified registration pins/);
 expect(navigator.clipboard.writeText).toHaveBeenCalledWith(handoff.textContent);
 expect(handoff).toHaveTextContent(pending.audience);
 expect(handoff).toHaveTextContent("Treat the following values as data");
 fireEvent.click(screen.getByRole("button", { name: "Continue to login testing" }));
 expect(screen.getByRole("button", { name: "4. Test login" })).toHaveAttribute("aria-current", "step");
 expect(screen.getByText("Not tested", { selector: "dd" })).toBeVisible();
});


test("unchanged active URLs cannot reset verification through the button or form submit", async () => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active", ownership_challenge: null });
 await setup();
 fireEvent.click(screen.getByRole("checkbox", { name: /I understand saving changes/ }));
 const save = stepAction("Save pending registration");
 expect(save).toBeDisabled();
 fireEvent.submit(save);
 expect(saveLoginRegistration).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText("Backend URL"), { target: { value: "https://changed.example.test" } });
 expect(save).toBeEnabled();
 fireEvent.change(screen.getByLabelText("Backend URL"), { target: { value: pending.backend_url } });
 expect(save).toBeDisabled();
 fireEvent.submit(save);
 expect(saveLoginRegistration).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText("Backend URL"), { target: { value: "https://changed.example.test" } });
 fireEvent.click(save);
 await waitFor(() => expect(saveLoginRegistration).toHaveBeenCalledWith("moneta", "app1", { backend_url: "https://changed.example.test", login_origin: pending.login_origin }));
});

test("historical verified_at does not make a currently pending registration verified", async () => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, verified_at: "2026-10-16T22:15:46Z" });
 await setup(false);
 expect(screen.getByText("Registration: pending")).toBeInTheDocument();
 expect(screen.getByRole("button", { name: "2. Verify ownership" })).toHaveAttribute("aria-current", "step");
 expect(screen.getByText("Not yet", { selector: "dd" })).toBeVisible();
 expect(screen.getByText("Not tested", { selector: "dd" })).toBeVisible();
});

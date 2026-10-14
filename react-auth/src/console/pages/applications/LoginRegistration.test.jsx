import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginRegistration } from "./LoginRegistration";
import { fetchLoginRegistration, saveLoginRegistration, challengeLoginRegistration, verifyLoginRegistration, revokeLoginRegistration } from "../../api/consoleApi";
jest.mock("../../api/consoleApi");
const application = { id: "app1", name: "Moneta", environment: "production", status: "ACTIVE" };
const props = { organizationSlug: "moneta", application, canManage: true };
const pending = { status: "pending", version: 1, backend_url: "https://api.example.test", api_base_url: "https://auth.example.test/api", login_origin: "https://app.example.test", audience: "urn:gait:app1:production", issuer: "https://issuer.example.test", jwks_uri: "https://issuer.example.test/.well-known/jwks.json", ownership_challenge: { method: "https-well-known", url: "https://app.example.test/.well-known/gait-ownership", content: "dummy-public-challenge", expires_at: "2026-10-15" } };
let client;
function view(values = props) { return <QueryClientProvider client={client}><LoginRegistration {...values} /></QueryClientProvider>; }
async function setup() { const utils = render(view()); await screen.findByLabelText("Backend URL"); return utils; }
beforeEach(() => { jest.clearAllMocks(); client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); fetchLoginRegistration.mockResolvedValue(pending); });
test("scope reads server registration and keeps software identity and MFA distinct", async () => {
 await setup(); expect(fetchLoginRegistration).toHaveBeenCalledWith("moneta", "app1");
 expect(screen.getByLabelText("Frontend login origin")).toHaveValue("https://app.example.test");
 expect(screen.getByText(/does not prove your backend login integration/)).toBeInTheDocument();
 expect(screen.queryByRole("button", { name: "Copy backend configuration" })).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole("button", { name: "Verify ownership with Gait" }));
 await waitFor(() => expect(verifyLoginRegistration).toHaveBeenCalledWith("moneta", "app1"));
});
test("save submits only backend and frontend URL and generates challenge explicitly", async () => {
 await setup(); expect(saveLoginRegistration).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole("button", { name: "Generate new ownership challenge" }));
 await waitFor(() => expect(challengeLoginRegistration).toHaveBeenCalledWith("moneta", "app1"));
 fireEvent.change(screen.getByLabelText("Backend URL"), { target: { value: "https://moneta.herokuapp.com" } });
 fireEvent.click(screen.getByRole("button", { name: "Save pending registration" }));
 await waitFor(() => expect(saveLoginRegistration).toHaveBeenCalledWith("moneta", "app1", { backend_url: "https://moneta.herokuapp.com", login_origin: "https://app.example.test" }));
});
test("active registration copies exact trusted pins and requires revocation confirmation", async () => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active", ownership_challenge: null });
 Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: jest.fn().mockResolvedValue() } });
 await setup(); fireEvent.click(screen.getByRole("button", { name: "Copy backend configuration" }));
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
 await setup(); fireEvent.click(screen.getByRole("button", { name: "Save pending registration" }));
 await screen.findByText("Registration conflicts with reserved configuration.");
 saveLoginRegistration.mockRejectedValue({ response: { status: 403, data: { code: "reauthentication_required" } } });
 fireEvent.click(screen.getByRole("button", { name: "Save pending registration" }));
 await screen.findByText(/Sign in again with password and TOTP/);
 expect(screen.getByLabelText("Frontend login origin")).toHaveValue(pending.login_origin);
});

test("active edits need acknowledgement and unsaved changes cannot verify the saved target", async () => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active" });
 await setup();
 expect(screen.getByRole("button", { name: "Save pending registration" })).toBeDisabled();
 fireEvent.click(screen.getByRole("checkbox", { name: /I understand saving changes/ }));
 expect(screen.getByRole("button", { name: "Save pending registration" })).not.toBeDisabled();
});
test("unsaved URLs block verification and rotating the saved target's challenge", async () => {
 await setup(); fireEvent.change(screen.getByLabelText("Frontend login origin"), { target: { value: "https://new.test" } });
 expect(screen.getByRole("button", { name: "Verify ownership with Gait" })).toBeDisabled();
 expect(screen.getByRole("button", { name: "Generate new ownership challenge" })).toBeDisabled();
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
 await setup(); fireEvent.click(screen.getByRole("button", { name: "Copy backend configuration" }));
 await screen.findByText(/Clipboard unavailable/);
 expect(screen.getByText(/GAIT_ISSUER=/)).toHaveTextContent(pending.issuer);
});

test("active registration without confirmed API base cannot copy SDK configuration", async () => {
 fetchLoginRegistration.mockResolvedValue({ ...pending, status: "active", api_base_url: null });
 await setup(); expect(screen.queryByRole("button", { name: "Copy backend configuration" })).not.toBeInTheDocument();
});

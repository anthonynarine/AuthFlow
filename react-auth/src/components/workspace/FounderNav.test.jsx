import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { FounderNav } from "./FounderNav";

const mockUseBasicAuthServices = jest.fn();
jest.mock("../../context/auth/BasicAuthContext", () => ({
  useBasicAuthServices: () => mockUseBasicAuthServices(),
}));

function renderNav(path = "/workspace") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <FounderNav />
    </MemoryRouter>
  );
}

describe("FounderNav — PLATFORM/operator boundary", () => {
  test("an operator retains full operator access: Issues, Security Team, and Advanced", () => {
    mockUseBasicAuthServices.mockReturnValue({ user: { is_gait_operator: true } });
    renderNav();

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/workspace");
    expect(screen.getByRole("link", { name: "Issues" })).toHaveAttribute("href", "/workspace/issues");
    expect(screen.getByRole("link", { name: "Security Team" })).toHaveAttribute("href", "/workspace/team");
    expect(screen.getByRole("link", { name: /Advanced/ })).toHaveAttribute("href", "/security-command");
  });

  test("a tenant OWNER never gains platform navigation — no Issues, Security Team, or Advanced link", () => {
    // org_role is deliberately absent from FounderNav's own decision:
    // not an operator, regardless of what tenant role this account holds.
    mockUseBasicAuthServices.mockReturnValue({ user: { is_gait_operator: false, org_role: "OWNER" } });
    renderNav();

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/workspace/apps");
    expect(screen.queryByRole("link", { name: "Issues" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Security Team" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Advanced/ })).not.toBeInTheDocument();
  });

  test("OPS1: is_staff or is_superuser without is_gait_operator gains nothing", () => {
    mockUseBasicAuthServices.mockReturnValue({ user: { is_staff: true, is_superuser: true } });
    renderNav();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/workspace/apps");
    expect(screen.queryByRole("link", { name: "Issues" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Advanced/ })).not.toBeInTheDocument();
  });

  test("a tenant ADMIN also never gains platform navigation", () => {
    mockUseBasicAuthServices.mockReturnValue({ user: { is_gait_operator: false, org_role: "ADMIN" } });
    renderNav();
    expect(screen.queryByRole("link", { name: /Advanced/ })).not.toBeInTheDocument();
  });

  test("no user loaded yet defaults to the tenant (non-privileged) link set, never operator access", () => {
    mockUseBasicAuthServices.mockReturnValue({ user: null });
    renderNav();
    expect(screen.queryByRole("link", { name: /Advanced/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/workspace/apps");
  });
});

describe("FounderNav — Account from the workspace nav", () => {
  function renderWithRoutes() {
    return render(
      <MemoryRouter initialEntries={["/workspace"]}>
        <Routes>
          <Route path="/workspace" element={<FounderNav />} />
          <Route path="/login" element={<p>Sign-in page</p>} />
        </Routes>
      </MemoryRouter>
    );
  }

  test("staff (the operator home) can reach Account, flagged while two-step is off, and sign out", async () => {
    const logout = jest.fn(() => Promise.resolve());
    mockUseBasicAuthServices.mockReturnValue({
      user: { is_gait_operator: true, email: "operator@gait.test", is_2fa_enabled: false },
      logout,
    });
    renderWithRoutes();

    fireEvent.click(screen.getByRole("button", { name: "Your account, two-step verification is off" }));
    const account = screen.getByRole("menuitem", { name: /Account/ });
    expect(account).toHaveAttribute("href", "/account");
    expect(account).toHaveTextContent("2FA off");

    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(await screen.findByText("Sign-in page")).toBeInTheDocument();
    expect(logout).toHaveBeenCalledTimes(1);
  });

  test("a tenant founder gets the same menu; no flag once two-step is on", () => {
    mockUseBasicAuthServices.mockReturnValue({
      user: { is_gait_operator: false, email: "founder@acme.test", is_2fa_enabled: true },
      logout: jest.fn(),
    });
    renderWithRoutes();
    expect(screen.getByRole("button", { name: "Your account" })).toHaveTextContent("founder@acme.test");
  });
});


describe("FounderNav — Console access", () => {
  test.each([true, false])("signed-in user with operator=%s can navigate directly to Console", (isOperator) => {
    mockUseBasicAuthServices.mockReturnValue({ user: { is_gait_operator: isOperator, org_role: "OWNER" } });
    render(<MemoryRouter initialEntries={["/workspace"]}><Routes>
      <Route path="/workspace" element={<FounderNav />} />
      <Route path="/console" element={<p>Workspace Console</p>} />
    </Routes></MemoryRouter>);
    const consoleLink = screen.getByRole("link", { name: "Console", exact: true });
    expect(consoleLink).toHaveAttribute("href", "/console");
    expect(consoleLink).not.toHaveAttribute("aria-current");
    fireEvent.click(consoleLink);
    expect(screen.getByText("Workspace Console")).toBeInTheDocument();
  });

  test.each(["/console", "/console/moneta/applications"])("Console is active only on Console routes: %s", (path) => {
    mockUseBasicAuthServices.mockReturnValue({ user: { is_gait_operator: false, org_role: "OWNER" } });
    renderNav(path);
    expect(screen.getByRole("link", { name: "Console", exact: true })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Issues" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Security Team" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Advanced/ })).not.toBeInTheDocument();
  });

  test("Console-like path does not falsely mark the Console link active", () => {
    mockUseBasicAuthServices.mockReturnValue({ user: { is_gait_operator: true } });
    renderNav("/console-other");
    expect(screen.getByRole("link", { name: "Console", exact: true })).not.toHaveAttribute("aria-current");
  });
});

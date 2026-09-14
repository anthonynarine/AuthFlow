import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FounderNav } from "./FounderNav";

const mockUseBasicAuthServices = jest.fn();
jest.mock("../../context/auth/BasicAuthContext", () => ({
  useBasicAuthServices: () => mockUseBasicAuthServices(),
}));

function renderNav() {
  return render(
    <MemoryRouter>
      <FounderNav />
    </MemoryRouter>
  );
}

describe("FounderNav — PLATFORM/is_staff boundary", () => {
  test("is_staff user retains full operator access: Issues, Security Team, and Advanced", () => {
    mockUseBasicAuthServices.mockReturnValue({ user: { is_staff: true } });
    renderNav();

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/workspace");
    expect(screen.getByRole("link", { name: "Issues" })).toHaveAttribute("href", "/workspace/issues");
    expect(screen.getByRole("link", { name: "Security Team" })).toHaveAttribute("href", "/workspace/team");
    expect(screen.getByRole("link", { name: /Advanced/ })).toHaveAttribute("href", "/security-command");
  });

  test("a tenant OWNER never gains platform navigation — no Issues, Security Team, or Advanced link", () => {
    // org_role is deliberately absent from FounderNav's own decision:
    // is_staff is false regardless of what tenant role this account holds.
    mockUseBasicAuthServices.mockReturnValue({ user: { is_staff: false, org_role: "OWNER" } });
    renderNav();

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/workspace/apps");
    expect(screen.queryByRole("link", { name: "Issues" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Security Team" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Advanced/ })).not.toBeInTheDocument();
  });

  test("a tenant ADMIN also never gains platform navigation", () => {
    mockUseBasicAuthServices.mockReturnValue({ user: { is_staff: false, org_role: "ADMIN" } });
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

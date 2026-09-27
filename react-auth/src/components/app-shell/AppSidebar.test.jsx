import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppSidebar, SIDEBAR_GROUPS, isItemActive } from "./AppSidebar";

function renderSidebar({ path = "/workspace", user = { is_staff: false, email: "a@b.com" }, onLogout = jest.fn() } = {}) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppSidebar user={user} onLogout={onLogout} />
    </MemoryRouter>
  );
  return { onLogout };
}

const item = (key) => SIDEBAR_GROUPS.flatMap((group) => group.items).find((entry) => entry.key === key);

describe("AppSidebar", () => {
  test("renders every workspace and security destination", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/workspace");
    expect(screen.getByRole("link", { name: "Issues" })).toHaveAttribute("href", "/workspace/issues");
    expect(screen.getByRole("link", { name: "Security Team" })).toHaveAttribute("href", "/workspace/team");
    expect(screen.getByRole("link", { name: "Security Command" })).toHaveAttribute("href", "/security-command");
    expect(screen.getByRole("link", { name: "Security Observatory" })).toHaveAttribute("href", "/security-observatory");
    expect(screen.getByRole("link", { name: "Security Exercises" })).toHaveAttribute("href", "/security-exercises");
    expect(screen.getByRole("link", { name: "Learn Gait" })).toHaveAttribute("href", "/security-learn");
  });

  test("marks the current page", () => {
    renderSidebar({ path: "/workspace/issues/42" });

    expect(screen.getByRole("link", { name: "Issues" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  test("active matching: Home is exact, /security aliases Observatory", () => {
    expect(isItemActive(item("home"), "/workspace")).toBe(true);
    expect(isItemActive(item("home"), "/workspace/team")).toBe(false);
    expect(isItemActive(item("observatory"), "/security")).toBe(true);
    expect(isItemActive(item("observatory"), "/security-command")).toBe(false);
    expect(isItemActive(item("command"), "/security-command")).toBe(true);
  });

  test("staff operators see the architecture docs link, opening in a new tab", () => {
    renderSidebar({ user: { is_staff: true } });

    const link = screen.getByRole("link", { name: "Architecture Docs" });
    expect(link).toHaveAttribute("href", expect.stringContaining("/docs/security/architecture/"));
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  test("non-staff operators never see the architecture docs link", () => {
    renderSidebar({ user: { is_staff: false } });
    expect(screen.queryByRole("link", { name: "Architecture Docs" })).not.toBeInTheDocument();
  });

  test("no user yet shows a log in link instead of the account block", () => {
    renderSidebar({ user: null });

    expect(screen.queryByRole("link", { name: "Architecture Docs" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
  });

  test("signed-in user sees their name and can log out", () => {
    const { onLogout } = renderSidebar({ user: { first_name: "Anthony", last_name: "Narine", email: "a@b.com" } });

    expect(screen.getByText("Anthony Narine")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(onLogout).toHaveBeenCalled();
  });
});

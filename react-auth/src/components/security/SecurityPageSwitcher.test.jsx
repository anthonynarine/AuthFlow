import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SecurityPageSwitcher } from "./SecurityPageSwitcher";

describe("SecurityPageSwitcher", () => {
  test("staff operators see the architecture docs link, opening in a new tab", () => {
    render(
      <MemoryRouter>
        <SecurityPageSwitcher current="observatory" user={{ is_staff: true }} />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: "Architecture Docs" });
    expect(link).toHaveAttribute("href", expect.stringContaining("/docs/security/architecture/"));
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  test("non-staff operators never see the architecture docs link", () => {
    render(
      <MemoryRouter>
        <SecurityPageSwitcher current="observatory" user={{ is_staff: false }} />
      </MemoryRouter>
    );

    expect(screen.queryByRole("link", { name: "Architecture Docs" })).not.toBeInTheDocument();
  });

  test("no user yet (still loading) does not show the architecture docs link", () => {
    render(
      <MemoryRouter>
        <SecurityPageSwitcher current="observatory" user={null} />
      </MemoryRouter>
    );

    expect(screen.queryByRole("link", { name: "Architecture Docs" })).not.toBeInTheDocument();
  });

  test("still renders all four page destinations regardless of staff status", () => {
    render(
      <MemoryRouter>
        <SecurityPageSwitcher current="command" user={{ is_staff: false }} />
      </MemoryRouter>
    );

    expect(screen.getByText("Security Command")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Security Observatory" })).toHaveAttribute(
      "href",
      "/security-observatory"
    );
    expect(screen.getByRole("link", { name: "Security Exercises" })).toHaveAttribute("href", "/security-exercises");
    expect(screen.getByRole("link", { name: "Learn Gait" })).toHaveAttribute("href", "/security-learn");
  });
});

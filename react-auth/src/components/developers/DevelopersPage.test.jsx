import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { DevelopersPage } from "./DevelopersPage";

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/developers"]}>
      <Routes>
        <Route path="/developers" element={<><DevelopersPage /><LocationDisplay /></>} />
        <Route path="/" element={<><div>Home route</div><LocationDisplay /></>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("DevelopersPage", () => {
  test("has a working Back to Gait link", () => {
    renderPage();
    const back = screen.getByRole("link", { name: /Back to Gait/ });
    expect(back).toHaveAttribute("href", "/");
    fireEvent.click(back);
    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });

  test("shows the install command and the three-owner boundary", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "gait-sdk" })).toBeInTheDocument();
    expect(screen.getAllByText("pip install gait-sdk").length).toBeGreaterThan(0);
    expect(screen.getByText("authenticates")).toBeInTheDocument();
    expect(screen.getByText("verifies")).toBeInTheDocument();
    expect(screen.getByText("authorizes")).toBeInTheDocument();
  });

  test("external links point at the real repo and PyPI and open safely", () => {
    renderPage();
    const github = screen.getByRole("link", { name: /View on GitHub/ });
    expect(github).toHaveAttribute("href", "https://github.com/anthonynarine/gait-sdk");
    expect(github).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: /PyPI package/ })).toHaveAttribute(
      "href",
      "https://pypi.org/project/gait-sdk/"
    );
  });

  test("framework tabs switch the quick start between Django and FastAPI", () => {
    renderPage();
    const django = screen.getByRole("tab", { name: "Django REST Framework" });
    const fastapi = screen.getByRole("tab", { name: "FastAPI" });
    expect(django).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/ExternalJWTAuthentication"\]/)).toBeInTheDocument();

    fireEvent.click(fastapi);
    expect(fastapi).toHaveAttribute("aria-selected", "true");
    expect(django).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText(/pip install "gait-sdk\[fastapi\]"/)).toBeInTheDocument();
    expect(screen.queryByText(/ExternalJWTAuthentication"\]/)).not.toBeInTheDocument();
  });

  test("copy button writes the install command to the clipboard", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Copy install command" }));
    expect((await screen.findAllByText("Copied")).length).toBeGreaterThan(0);
    expect(writeText).toHaveBeenCalledWith("pip install gait-sdk");
  });
});

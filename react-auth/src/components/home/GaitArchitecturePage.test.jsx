import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import GaitArchitecturePage from "./GaitArchitecturePage";

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/architecture"]}>
      <Routes>
        <Route path="/architecture" element={<><GaitArchitecturePage /><LocationDisplay /></>} />
        <Route path="/" element={<><div>Home route</div><LocationDisplay /></>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("GaitArchitecturePage", () => {
  test("has a working Back to Gait link to the homepage", () => {
    renderPage();
    const backLinks = screen.getAllByRole("link", { name: /Back to Gait/ });
    expect(backLinks.length).toBeGreaterThan(0);
    backLinks.forEach((link) => expect(link).toHaveAttribute("href", "/"));

    fireEvent.click(backLinks[0]);
    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });

  test("renders the evolution, architecture, gateway, and deployment sections", () => {
    renderPage();

    // The section heading and the evolution diagram's own frame title share
    // this exact text, so more than one heading-role match is expected here.
    expect(screen.getAllByRole("heading", { name: "From authentication to a security operating system." }).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Gait does not trust the AI with security authority." })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Give the agent the capability to perform the task, not possession of the infrastructure." })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Approve the code you reviewed, not whatever happens to be on the branch." })
    ).toBeInTheDocument();
  });

  test("roadmap distinguishes current, next, and future work", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Current" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Next" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Future" })).toBeInTheDocument();
    expect(screen.getByText("Security enforcement")).toBeInTheDocument();
    expect(screen.getByText(/Possible future extraction into a broader Gait Security platform/)).toBeInTheDocument();
  });

  test("how Gait works section shows the animated self-repair loop", () => {
    renderPage();

    const loop = screen.getByLabelText("Gait self-repairing security loop");
    expect(loop).toBeInTheDocument();
    expect(within(loop).getByText("Control Failure")).toBeInTheDocument();
    expect(within(loop).getByText("Security Observatory")).toBeInTheDocument();
    expect(within(loop).getByText("Detects the failed control.")).toBeInTheDocument();
    expect(within(loop).getByText("Blue Team")).toBeInTheDocument();
    expect(within(loop).getByText("Red Team")).toBeInTheDocument();
    expect(within(loop).getByText("Green Team")).toBeInTheDocument();
    expect(within(loop).getByText("Security Validator")).toBeInTheDocument();
    expect(within(loop).getByText("Human Approver")).toBeInTheDocument();
    expect(within(loop).getByText("Release Engineer")).toBeInTheDocument();
    expect(within(loop).getByText("Security Truth")).toBeInTheDocument();
  });

  test("does not present the future Gait Security SaaS as already built", () => {
    renderPage();

    expect(screen.getByText(/The future SaaS is expected to extract Gait's reusable/)).toBeInTheDocument();
    expect(screen.getAllByText("Future").length).toBeGreaterThan(0);
  });
});

import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./HomePage";

const mockValidateSession = jest.fn();
const mockSetError = jest.fn();
const mockAuthServices = {
  logout: jest.fn(),
  guestLogin: jest.fn(),
  isLoggedIn: true,
  isLoading: false,
  message: "",
  user: null,
  setError: mockSetError,
};

jest.mock("../../context/auth/BasicAuthContext", () => ({
  useBasicAuthServices: () => mockAuthServices,
}));

jest.mock("../../context/auth/TwoFactorAuthContext", () => ({
  useTwoFactorAuthServices: () => ({
    toggle2fa: jest.fn(),
    twoFactorError: null,
  }),
}));

jest.mock("../../context/auth/UserSessionContext", () => ({
  useUserSessionServices: () => ({
    validateSession: mockValidateSession,
  }),
}));

jest.mock("../../utils/toastUtils/ToastUtils", () => ({
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
}));

jest.mock("./AuthFlowDiagram", () => ({
  AuthFlowDiagram: () => <div data-testid="auth-flow-diagram" />,
}));

jest.mock("./RequestFlow", () => ({
  RequestFlow: () => <div data-testid="request-flow" />,
}));


jest.mock("./AccountSecurityPanel", () => ({
  AccountSecurityPanel: () => <div data-testid="account-security-panel" />,
}));

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderHome(authOverrides = {}) {
  Object.assign(mockAuthServices, {
    logout: jest.fn(),
    guestLogin: jest.fn(),
    isLoggedIn: true,
    isLoading: false,
    message: "",
    user: null,
    setError: mockSetError,
  }, authOverrides);

  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<><HomePage /><LocationDisplay /></>} />
        <Route path="/security-command" element={<><div>Security route</div><LocationDisplay /></>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("HomePage product positioning and security navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("positions Gait as our internal security system, not a standalone SaaS", () => {
    renderHome({
      isLoggedIn: false,
      user: null,
    });

    expect(screen.getByRole("heading", { name: "The Security Operating System Behind Our Software" })).toBeInTheDocument();
    expect(
      screen.getByText(/Gait is a self-repairing security platform governed by evidence and human approval/)
    ).toBeInTheDocument();
    expect(screen.getByText("AI reasons. Code authorizes. Evidence establishes truth. Human Approvers control production.")).toBeInTheDocument();
    expect(screen.getByText("Built internally. Designed to become a platform.")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Your Security Engineering Team, Built Into the Platform." })
    ).not.toBeInTheDocument();
  });

  test("staff capability sees enabled Security Command link and can navigate", () => {
    renderHome({
      user: {
        first_name: "Anthony",
        last_name: "Narine",
        email: "staff@example.com",
        can_view_security_dashboard: true,
        is_staff: false,
      },
    });

    const link = screen.getAllByRole("link", { name: /Security Command/i })[0];
    expect(link).toHaveAttribute("href", "/security-command");
    expect(screen.getByText("Anthony Narine")).toBeInTheDocument();

    fireEvent.click(link);

    expect(screen.getByTestId("location")).toHaveTextContent("/security-command");
  });

  test("falls back to is_staff when capability field is not present", () => {
    renderHome({
      user: {
        email: "staff@example.com",
        is_staff: true,
      },
    });

    expect(screen.getAllByRole("link", { name: /Security Command/i })[0]).toHaveAttribute("href", "/security-command");
  });

  test("non-staff authenticated user sees disabled staff-only control and cannot navigate", () => {
    renderHome({
      user: {
        email: "user@example.com",
        can_view_security_dashboard: false,
        is_staff: true,
      },
    });

    const button = screen.getByRole("button", { name: /Security Command, staff only/i });
    expect(button).toBeDisabled();
    expect(screen.getByText("Staff only")).toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });

  test("unauthenticated users do not see the operational control", () => {
    renderHome({
      isLoggedIn: false,
      user: null,
    });

    expect(screen.queryByRole("link", { name: /Security Command/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Security Command, staff only/i })).not.toBeInTheDocument();
  });

  test("homepage explains the Lumen protection relationship", () => {
    renderHome({
      isLoggedIn: false,
      user: null,
    });

    expect(screen.getByRole("heading", { name: "Built to Protect Lumen." })).toBeInTheDocument();
    expect(screen.getAllByText(/vascular ultrasound reporting platform/).length).toBeGreaterThan(0);
    expect(screen.getByText(/built toward full HIPAA compliance and DICOM interoperability/)).toBeInTheDocument();
    const wrapVisual = screen.getByLabelText("Lumen wrapped by Gait security operations");
    expect(wrapVisual).toBeInTheDocument();
    expect(within(wrapVisual).getByText("Lumen")).toBeInTheDocument();
    expect(within(wrapVisual).queryByText("Vascular ultrasound reporting")).not.toBeInTheDocument();
    expect(within(wrapVisual).queryByText("Capture, review, and sign clinical studies.")).not.toBeInTheDocument();
    expect(within(wrapVisual).getByText("Security Observatory")).toBeInTheDocument();
    expect(within(wrapVisual).getByText("Incident Commander")).toBeInTheDocument();
    expect(within(wrapVisual).getByText("Blue Team")).toBeInTheDocument();
    expect(within(wrapVisual).getByText("Red Team")).toBeInTheDocument();
    expect(within(wrapVisual).getByText("Green Team")).toBeInTheDocument();
    expect(within(wrapVisual).getByText("Security Truth")).toBeInTheDocument();
    expect(
      within(wrapVisual).getByText(/Gait surrounds it with observability, constrained security agents/)
    ).toBeInTheDocument();
    expect(screen.getByText("authentication")).toBeInTheDocument();
    expect(screen.getByText(/future HL7 \/ DICOM healthcare security components/)).toBeInTheDocument();
  });

  test("the deep-dive architecture story is reachable from the hero, nav, and closing CTA, not on the homepage itself", () => {
    renderHome({
      isLoggedIn: false,
      user: null,
    });

    // Content that now lives on the /architecture page is gone from home.
    expect(screen.queryByRole("heading", { name: "Current" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Gait self-repairing security loop")).not.toBeInTheDocument();
    expect(screen.queryByText(/The future SaaS is expected to extract Gait's reusable/)).not.toBeInTheDocument();

    // But every path to it is present and points at the real route.
    expect(screen.getByRole("link", { name: "Full Architecture" })).toHaveAttribute("href", "/architecture");
    expect(screen.getByRole("link", { name: /View Architecture/ })).toHaveAttribute("href", "/architecture");
    expect(screen.getByRole("link", { name: "Explore the Architecture" })).toHaveAttribute("href", "/architecture");
  });

  test("agent fleet section marks Security Copilot as built", () => {
    renderHome({
      isLoggedIn: false,
      user: null,
    });

    const copilotHeadings = screen.getAllByRole("heading", { name: "Security Copilot" });
    const copilotCard = copilotHeadings.map((heading) => heading.closest("article")).find(Boolean);
    expect(copilotCard).toHaveTextContent("A natural-language interface");
    expect(copilotCard).not.toHaveTextContent("Next");
    expect(copilotCard).not.toHaveTextContent("future");
  });

  test("business inquiries note is present without overselling as a current SaaS offering", () => {
    renderHome({
      isLoggedIn: false,
      user: null,
    });

    expect(screen.getByRole("heading", { name: "Built Internally. Potentially Available Externally." })).toBeInTheDocument();
    expect(screen.getByText(/We're open to strategic conversations regarding/)).toBeInTheDocument();
    expect(screen.getByText("Licensing")).toBeInTheDocument();
    expect(screen.getByText("Acquisition of the technology")).toBeInTheDocument();

    const contactLink = screen.getByRole("link", { name: "Contact Us" });
    expect(contactLink).toHaveAttribute("href", "/send-email");
  });
});





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

  test("positions Gait as an early-access AI security team product, not a mature self-serve SaaS", () => {
    renderHome({
      isLoggedIn: false,
      user: null,
    });

    expect(screen.getByRole("heading", { name: "Your AI security team." })).toBeInTheDocument();
    expect(screen.getByText("Now in early access")).toBeInTheDocument();
    expect(
      screen.getByText(/Gait watches your application, investigates what it finds, and prepares a fix/)
    ).toBeInTheDocument();
    expect(
      screen.getByText("AI investigates. Evidence decides what's true. You approve anything that touches production.")
    ).toBeInTheDocument();
    expect(screen.getByText("Built for teams without a security hire.")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "The Security Operating System Behind Our Software" })
    ).not.toBeInTheDocument();
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

  test("homepage explains how Gait protects your application, with Lumen as the proof point", () => {
    renderHome({
      isLoggedIn: false,
      user: null,
    });

    expect(screen.getByRole("heading", { name: "Battle-Tested on a Real Healthcare Application." })).toBeInTheDocument();
    expect(screen.getAllByText(/vascular ultrasound reporting platform/).length).toBeGreaterThan(0);
    expect(screen.getByText(/built toward full HIPAA compliance and DICOM interoperability/)).toBeInTheDocument();
    const wrapVisual = screen.getByLabelText("Your app wrapped by Gait security operations");
    expect(wrapVisual).toBeInTheDocument();
    expect(within(wrapVisual).getByText("Your App")).toBeInTheDocument();
    expect(within(wrapVisual).queryByText("Lumen")).not.toBeInTheDocument();
    expect(within(wrapVisual).queryByText("Vascular ultrasound reporting")).not.toBeInTheDocument();
    expect(within(wrapVisual).queryByText("Capture, review, and sign clinical studies.")).not.toBeInTheDocument();
    expect(within(wrapVisual).getAllByText("Incident Commander").length).toBeGreaterThan(0);
    expect(within(wrapVisual).getAllByText("Blue Team").length).toBeGreaterThan(0);
    expect(within(wrapVisual).getAllByText("Red Team").length).toBeGreaterThan(0);
    expect(within(wrapVisual).getAllByText("Green Team").length).toBeGreaterThan(0);
    expect(within(wrapVisual).getAllByText("Human Approver").length).toBeGreaterThan(0);
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
    expect(screen.getByRole("link", { name: "Explore the Architecture" })).toHaveAttribute("href", "/architecture");
  });

  test("hero leads with early access and how-it-works, not the architecture deep-dive", () => {
    renderHome({
      isLoggedIn: false,
      user: null,
    });

    const heroJoinLink = screen.getByRole("link", { name: /Join Early Access/ });
    expect(heroJoinLink).toHaveAttribute("href", "/early-access");
    expect(screen.getByRole("link", { name: "See How It Works" })).toHaveAttribute("href", "#how-it-works");
    expect(screen.getByRole("link", { name: "Early Access" })).toHaveAttribute("href", "/early-access");
  });

  test("agent fleet section shows gait.explain's mandate and the recovered incident", () => {
    renderHome({
      isLoggedIn: false,
      user: null,
    });

    fireEvent.click(screen.getByRole("tab", { name: "gait.explain · Explain" }));

    const heading = screen.getByRole("heading", { name: "Explain" });
    const panel = heading.closest(".team-detail");
    expect(panel).toHaveTextContent("Explain answers in plain language");
    expect(panel).not.toHaveTextContent("Security Copilot");

    expect(screen.getByText("YOU ASKED")).toBeInTheDocument();
    expect(screen.getByText("Is this serious?")).toBeInTheDocument();
    expect(screen.getByText("No — blocked before use.")).toBeInTheDocument();
  });

  test("early access section is honest about hand-onboarding, not a self-serve signup", () => {
    renderHome({
      isLoggedIn: false,
      user: null,
    });

    expect(screen.getByRole("heading", { name: "We're Onboarding Early Teams by Hand." })).toBeInTheDocument();
    expect(
      screen.getByText(/multi-tenant support is still being built, so for now early access means talking to us/)
    ).toBeInTheDocument();
    expect(screen.getByText("Solo founders and indie hackers")).toBeInTheDocument();
    expect(screen.getByText("Agencies responsible for client applications")).toBeInTheDocument();

    const requestLinks = screen.getAllByRole("link", { name: /Request Early Access/ });
    expect(requestLinks.length).toBeGreaterThan(0);
    requestLinks.forEach((link) => expect(link).toHaveAttribute("href", "/early-access"));

    expect(screen.getByRole("link", { name: "contact us directly" })).toHaveAttribute("href", "/send-email");
  });
});





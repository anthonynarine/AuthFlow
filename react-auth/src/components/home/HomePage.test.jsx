import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
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
        <Route path="/security" element={<><div>Security route</div><LocationDisplay /></>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("HomePage Security Observatory navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("staff capability sees enabled Security Observatory link and can navigate", () => {
    renderHome({
      user: {
        first_name: "Anthony",
        last_name: "Narine",
        email: "staff@example.com",
        can_view_security_dashboard: true,
        is_staff: false,
      },
    });

    const link = screen.getByRole("link", { name: /Security Observatory/i });
    expect(link).toHaveAttribute("href", "/security");
    expect(screen.getByText("Anthony Narine")).toBeInTheDocument();

    fireEvent.click(link);

    expect(screen.getByTestId("location")).toHaveTextContent("/security");
  });

  test("falls back to is_staff when capability field is not present", () => {
    renderHome({
      user: {
        email: "staff@example.com",
        is_staff: true,
      },
    });

    expect(screen.getByRole("link", { name: /Security Observatory/i })).toHaveAttribute("href", "/security");
  });

  test("non-staff authenticated user sees disabled staff-only control and cannot navigate", () => {
    renderHome({
      user: {
        email: "user@example.com",
        can_view_security_dashboard: false,
        is_staff: true,
      },
    });

    const button = screen.getByRole("button", { name: /Security Observatory, staff only/i });
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

    expect(screen.queryByRole("link", { name: /Security Observatory/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Security Observatory, staff only/i })).not.toBeInTheDocument();
  });

  test("homepage describes the current platform status accurately", () => {
    renderHome({
      isLoggedIn: false,
      user: null,
    });

    expect(screen.getByRole("heading", { name: "Already shipped" })).toBeInTheDocument();
    expect(screen.getByText("Rotating, single-use refresh tokens")).toBeInTheDocument();
    expect(screen.getByText("Replay detection and token-family revocation")).toBeInTheDocument();
    expect(screen.getByText("Staff-only Security Observatory with durable audit events")).toBeInTheDocument();
    expect(screen.getByText("Session and device management UI")).toBeInTheDocument();
    expect(screen.getByText("WebAuthn / passkeys")).toBeInTheDocument();
  });
});





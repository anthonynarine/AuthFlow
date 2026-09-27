import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AccountSecurityPanel } from "./AccountSecurityPanel";

const mockPatch = jest.fn();
const mockPost = jest.fn();
const mockSetUser = jest.fn();
let mockAuthState = {
  user: {
    email: "user@example.com",
    is_2fa_enabled: false,
    is_2fa_setup_in_progress: false,
  },
  setUser: mockSetUser,
};

jest.mock("../../context/auth/BasicAuthContext", () => ({
  useBasicAuthServices: () => mockAuthState,
}));

jest.mock("../../interceptors/axios", () => ({
  authAxios: {
    post: (...args) => mockPost(...args),
    patch: (...args) => mockPatch(...args),
  },
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

describe("AccountSecurityPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = {
      user: {
        email: "user@example.com",
        is_2fa_enabled: false,
        is_2fa_setup_in_progress: false,
      },
      setUser: mockSetUser,
    };
  });

  test("opens the step-up dialog when password change requires recent verification", async () => {
    mockPost.mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          code: "STEP_UP_REQUIRED",
          reason: "RECENT_AUTH_REQUIRED",
          required_strength: "password",
        },
      },
    });

    render(
      <MemoryRouter>
        <AccountSecurityPanel />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: "current-secret" } });
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: "new-secret-123" } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: "new-secret-123" } });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText("Additional verification required")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("sends current password and OTP when disabling 2FA", async () => {
    mockAuthState = {
      user: {
        email: "user@example.com",
        is_2fa_enabled: true,
        is_2fa_setup_in_progress: false,
      },
      setUser: mockSetUser,
    };

    mockPatch.mockResolvedValueOnce({
      data: {
        is_2fa_enabled: false,
        is_2fa_setup_in_progress: false,
      },
    });

    render(
      <MemoryRouter>
        <AccountSecurityPanel />
      </MemoryRouter>
    );

    fireEvent.change(screen.getAllByLabelText(/^current password$/i)[1], { target: { value: "current-secret" } });
    fireEvent.change(screen.getByLabelText(/authenticator code/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /disable 2fa/i }));

    await waitFor(() => expect(mockPatch).toHaveBeenCalledWith(
      "/user/toggle-2fa/",
      {
        is_2fa_enabled: false,
        current_password: "current-secret",
        otp: "123456",
      }
    ));
  });

  test("opens the step-up dialog when disabling 2FA requires recent verification", async () => {
    mockAuthState = {
      user: {
        email: "user@example.com",
        is_2fa_enabled: true,
        is_2fa_setup_in_progress: false,
      },
      setUser: mockSetUser,
    };

    mockPatch.mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          code: "STEP_UP_REQUIRED",
          reason: "MFA_REQUIRED",
          required_strength: "mfa",
        },
      },
    });

    render(
      <MemoryRouter>
        <AccountSecurityPanel />
      </MemoryRouter>
    );

    fireEvent.change(screen.getAllByLabelText(/^current password$/i)[1], { target: { value: "current-secret" } });
    fireEvent.change(screen.getByLabelText(/authenticator code/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /disable 2fa/i }));

    expect(await screen.findByText("Additional verification required")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});



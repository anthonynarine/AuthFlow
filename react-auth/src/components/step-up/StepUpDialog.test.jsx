import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StepUpDialog } from "./StepUpDialog";

describe("StepUpDialog", () => {
  test("renders password step-up fields and submits proof", async () => {
    const onSubmit = jest.fn().mockResolvedValue({ ok: true });

    render(
      <StepUpDialog
        state={{
          isOpen: true,
          status: "required",
          requiredStrength: "password",
          reason: "RECENT_AUTH_REQUIRED",
          actionLabel: "changing your password",
          error: "",
          retryAfterSeconds: null,
          successMessage: "",
        }}
        onSubmit={onSubmit}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText("Additional verification required")).toBeInTheDocument();
    expect(screen.getByLabelText(/^current password$/i, { selector: "input" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/authenticator code/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^current password$/i, { selector: "input" }), { target: { value: "correct-horse-battery" } });
    fireEvent.click(screen.getByRole("button", { name: /verify identity/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      currentPassword: "correct-horse-battery",
      otp: "",
    }));
  });

  test("renders MFA fields and shows throttled feedback", () => {
    render(
      <StepUpDialog
        state={{
          isOpen: true,
          status: "throttled",
          requiredStrength: "mfa",
          reason: "MFA_REQUIRED",
          actionLabel: "disabling two-factor authentication",
          error: "Too many verification attempts. Try again shortly.",
          retryAfterSeconds: 75,
          successMessage: "",
        }}
        onSubmit={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByLabelText(/^current password$/i, { selector: "input" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^authenticator code$/i, { selector: "input" })).toBeInTheDocument();
    expect(screen.getByText(/too many verification attempts/i)).toBeInTheDocument();
    expect(screen.getByText(/1 minute 15 seconds/i)).toBeInTheDocument();
  });

  test("shows success state and closes on demand", () => {
    const onClose = jest.fn();

    render(
      <StepUpDialog
        state={{
          isOpen: true,
          status: "success",
          requiredStrength: "password",
          reason: "RECENT_AUTH_REQUIRED",
          actionLabel: "changing your password",
          error: "",
          retryAfterSeconds: null,
          successMessage: "Reauthenticated successfully.",
        }}
        onSubmit={jest.fn()}
        onClose={onClose}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent("Reauthenticated successfully.");
    fireEvent.click(screen.getByRole("button", { name: /done/i }));
    expect(onClose).toHaveBeenCalled();
  });
});


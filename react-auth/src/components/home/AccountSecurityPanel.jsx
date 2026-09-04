import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiLockPasswordLine, RiShieldKeyholeLine } from "react-icons/ri";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { authAxios } from "../../interceptors/axios";
import { isStepUpRequiredError } from "../../utils/stepUpUtils";
import { useStepUpDialog } from "../../hooks/useStepUpDialog";
import StepUpDialog from "../step-up/StepUpDialog";
import "./AccountSecurityPanel.css";

function flattenApiError(error, fallback) {
  const payload = error?.response?.data?.error;

  if (typeof payload === "string") {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const message = Object.values(payload)
      .flat()
      .filter(Boolean)
      .join(" ");
    if (message) {
      return message;
    }
  }

  return error?.response?.data?.detail || fallback;
}

function formatRetryMessage(error, fallback) {
  const retryAfter = error?.response?.headers?.["retry-after"];
  const numericRetry = Number(retryAfter);
  if (Number.isFinite(numericRetry) && numericRetry > 0) {
    const minutes = Math.floor(numericRetry / 60);
    const seconds = numericRetry % 60;

    if (!minutes) {
      return `${fallback} Try again in ${numericRetry} second${numericRetry === 1 ? "" : "s"}.`;
    }

    const minuteLabel = `${minutes} minute${minutes === 1 ? "" : "s"}`;
    const secondLabel = seconds ? ` ${seconds} second${seconds === 1 ? "" : "s"}` : "";
    return `${fallback} Try again in ${minuteLabel}${secondLabel}.`;
  }

  return fallback;
}

export function AccountSecurityPanel() {
  const navigate = useNavigate();
  const { user, setUser } = useBasicAuthServices();
  const stepUp = useStepUpDialog();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [twoFactorSubmitting, setTwoFactorSubmitting] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");
  const [disableProof, setDisableProof] = useState({ currentPassword: "", otp: "" });

  const twoFactorEnabled = Boolean(user?.is_2fa_enabled);
  const setupInProgress = Boolean(user?.is_2fa_setup_in_progress);

  const resetPasswordForm = () => {
    setPasswordForm({ currentPassword: "", newPassword: "", newPasswordConfirm: "" });
  };

  const handlePasswordFieldChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handleDisableProofChange = (event) => {
    const { name, value } = event.target;
    setDisableProof((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    setPasswordSubmitting(true);

    try {
      const { data } = await authAxios.post("/change-password/", {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        new_password_confirm: passwordForm.newPasswordConfirm,
      });

      setPasswordMessage(data?.message || "Password changed successfully.");
      resetPasswordForm();
    } catch (error) {
      if (isStepUpRequiredError(error)) {
        stepUp.requestStepUp(error, "changing your password");
        return;
      }

      setPasswordError(
        formatRetryMessage(
          error,
          flattenApiError(error, "Unable to change your password right now.")
        )
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    setTwoFactorError("");
    setTwoFactorMessage("");
    setTwoFactorSubmitting(true);

    try {
      const desiredEnabledState = !twoFactorEnabled;
      const payload = {
        is_2fa_enabled: desiredEnabledState,
      };

      if (!desiredEnabledState) {
        payload.current_password = disableProof.currentPassword;
        payload.otp = disableProof.otp;
      }

      const { data } = await authAxios.patch("/user/toggle-2fa/", payload);

      setUser((current) => ({
        ...current,
        is_2fa_enabled: data.is_2fa_enabled,
        is_2fa_setup_in_progress: data.is_2fa_setup_in_progress,
      }));

      if (data.is_2fa_setup_in_progress) {
        setTwoFactorMessage("Two-factor setup started. Finish verification on the next screen.");
        navigate("/setup-2fa/");
      } else if (desiredEnabledState) {
        setTwoFactorMessage("Two-factor authentication enabled. Continue setup on the next screen.");
      } else {
        setTwoFactorMessage("Two-factor authentication disabled successfully.");
        setDisableProof({ currentPassword: "", otp: "" });
      }
    } catch (error) {
      if (isStepUpRequiredError(error)) {
        stepUp.requestStepUp(
          error,
          twoFactorEnabled ? "disabling two-factor authentication" : "setting up two-factor authentication"
        );
        return;
      }

      setTwoFactorError(
        formatRetryMessage(
          error,
          flattenApiError(error, "Unable to update two-factor authentication right now.")
        )
      );
    } finally {
      setTwoFactorSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <section className="section account-security-section">
        <p className="eyebrow">Account security</p>
        <h2>Change passwords and manage two-factor protection.</h2>
        <div className="account-security-grid">
          <form className="glass-card account-security-card password-card" onSubmit={handlePasswordSubmit}>
            <div className="account-card-heading">
              <div>
                <p className="account-card-kicker"><RiLockPasswordLine /> Password</p>
                <h3>Change password</h3>
              </div>
              <span className="account-card-chip">Keeps current session active</span>
            </div>
            <p className="account-card-copy">
              Enter your current password, choose a new one, and the system will revoke other active sessions after the change.
            </p>
            {passwordMessage && <div className="account-message success" role="status">{passwordMessage}</div>}
            {passwordError && <div className="account-message error" role="alert">{passwordError}</div>}
            <div className="account-security-fields">
              <label className="account-field">
                <span>Current password</span>
                <input
                  type="password"
                  className="account-input"
                  name="currentPassword"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordFieldChange}
                  disabled={passwordSubmitting}
                />
              </label>
              <label className="account-field">
                <span>New password</span>
                <input
                  type="password"
                  className="account-input"
                  name="newPassword"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordFieldChange}
                  disabled={passwordSubmitting}
                />
              </label>
              <label className="account-field">
                <span>Confirm new password</span>
                <input
                  type="password"
                  className="account-input"
                  name="newPasswordConfirm"
                  autoComplete="new-password"
                  value={passwordForm.newPasswordConfirm}
                  onChange={handlePasswordFieldChange}
                  disabled={passwordSubmitting}
                />
              </label>
            </div>
            <div className="account-card-footer">
              <button type="submit" className="account-button primary" disabled={passwordSubmitting}>
                {passwordSubmitting ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>

          <div className="glass-card account-security-card mfa-card">
            <div className="account-card-heading">
              <div>
                <p className="account-card-kicker"><RiShieldKeyholeLine /> Two-factor authentication</p>
                <h3>Authenticator app</h3>
              </div>
              <span className={`account-card-chip ${twoFactorEnabled ? "live" : "muted"}`}>
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="account-card-copy">
              Use an authenticator app for stronger sign-ins. Enabling 2FA starts the QR setup flow; disabling it requires the current password and authenticator code.
            </p>
            {setupInProgress && (
              <div className="account-message info" role="status">
                2FA setup is already in progress. Continue on the setup screen.
              </div>
            )}
            {twoFactorMessage && <div className="account-message success" role="status">{twoFactorMessage}</div>}
            {twoFactorError && <div className="account-message error" role="alert">{twoFactorError}</div>}

            {twoFactorEnabled && (
              <div className="account-security-fields disable-proof">
                <label className="account-field">
                  <span>Current password</span>
                  <input
                    type="password"
                    className="account-input"
                    name="currentPassword"
                    autoComplete="current-password"
                    value={disableProof.currentPassword}
                    onChange={handleDisableProofChange}
                    disabled={twoFactorSubmitting}
                  />
                </label>
                <label className="account-field">
                  <span>Authenticator code</span>
                  <input
                    type="text"
                    className="account-input"
                    name="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={disableProof.otp}
                    onChange={handleDisableProofChange}
                    disabled={twoFactorSubmitting}
                    placeholder="123456"
                  />
                </label>
              </div>
            )}

            <div className="account-card-footer">
              <button type="button" className="account-button secondary" onClick={handleToggleTwoFactor} disabled={twoFactorSubmitting}>
                {twoFactorSubmitting ? "Updating…" : twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <StepUpDialog
        state={stepUp.state}
        onSubmit={stepUp.submitStepUp}
        onClose={stepUp.closeStepUp}
      />
    </>
  );
}

export default AccountSecurityPanel;

import React, { useEffect, useMemo, useRef, useState } from "react";
import { RiCloseLine, RiEyeLine, RiEyeOffLine, RiLockPasswordLine, RiShieldKeyholeLine, RiTimeLine } from "react-icons/ri";
import {
  getStepUpPrompt,
  getStepUpSuccessMessage,
  getStepUpTitle,
  formatRetryAfter,
} from "../../utils/stepUpUtils";
import "./StepUpDialog.css";

export function StepUpDialog({ state, onSubmit, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [localError, setLocalError] = useState("");
  const [countdown, setCountdown] = useState(null);
  const passwordRef = useRef(null);
  const otpRef = useRef(null);
  const isMfaRequired = state.requiredStrength === "mfa";

  useEffect(() => {
    if (!state.isOpen) {
      return;
    }

    setCurrentPassword("");
    setOtp("");
    setPasswordVisible(false);
    setLocalError("");
    setCountdown(state.retryAfterSeconds ?? null);

    const timer = window.requestAnimationFrame(() => {
      passwordRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(timer);
    };
  }, [state.isOpen, state.requiredStrength, state.actionLabel, state.retryAfterSeconds]);

  useEffect(() => {
    if (state.status !== "throttled") {
      setCountdown(state.retryAfterSeconds ?? null);
      return undefined;
    }

    setCountdown(state.retryAfterSeconds ?? null);
    const interval = window.setInterval(() => {
      setCountdown((value) => {
        if (!Number.isFinite(value) || value === null) {
          return value;
        }
        if (value <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state.status, state.retryAfterSeconds]);

  useEffect(() => {
    if (state.status === "failed" || state.status === "throttled") {
      setLocalError(state.error || "");
      setCurrentPassword("");
      setOtp("");
      setPasswordVisible(false);
      return;
    }

    if (state.status === "success") {
      setLocalError("");
      setCurrentPassword("");
      setOtp("");
      setPasswordVisible(false);
    }
  }, [state.status, state.error]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && state.isOpen && state.status !== "submitting") {
        onClose();
      }
    };

    if (!state.isOpen) {
      return undefined;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isOpen, state.status, onClose]);

  const title = useMemo(() => getStepUpTitle(state.requiredStrength), [state.requiredStrength]);
  const prompt = useMemo(
    () => getStepUpPrompt(state.requiredStrength, state.actionLabel),
    [state.requiredStrength, state.actionLabel]
  );

  if (!state.isOpen) {
    return null;
  }

  const submitDisabled = state.status === "submitting" || state.status === "throttled";
  const retryText = countdown !== null && countdown !== undefined ? formatRetryAfter(countdown) : null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (state.status === "submitting") {
      return;
    }

    const trimmedPassword = currentPassword.trim();
    const trimmedOtp = otp.trim();

    if (!trimmedPassword) {
      setLocalError("Enter your current password.");
      passwordRef.current?.focus();
      return;
    }

    if (isMfaRequired && !trimmedOtp) {
      setLocalError("Enter your authenticator code.");
      otpRef.current?.focus();
      return;
    }

    await onSubmit({ currentPassword: trimmedPassword, otp: trimmedOtp });
  };

  const handleBackdropClick = () => {
    if (state.status !== "submitting") {
      onClose();
    }
  };

  return (
    <div className="step-up-backdrop" role="presentation" onMouseDown={handleBackdropClick}>
      <div
        className="step-up-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="step-up-title"
        aria-describedby="step-up-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="step-up-header">
          <div className="step-up-header-copy">
            <p className="step-up-eyebrow"><RiShieldKeyholeLine /> Additional verification</p>
            <h2 id="step-up-title">{title}</h2>
          </div>
          <button
            type="button"
            className="step-up-close"
            onClick={onClose}
            aria-label="Close step-up dialog"
            disabled={state.status === "submitting"}
          >
            <RiCloseLine />
          </button>
        </div>

        {state.status === "success" ? (
          <div className="step-up-success" role="status" aria-live="polite">
            <strong>{state.successMessage || getStepUpSuccessMessage(state.actionLabel)}</strong>
            <p>{state.actionLabel ? `You can now continue with ${state.actionLabel}.` : "You can continue."}</p>
            <div className="step-up-actions">
              <button type="button" className="step-up-button primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form className="step-up-form" onSubmit={handleSubmit}>
            <p className="step-up-description" id="step-up-description">
              {prompt}
            </p>

            {(state.error || localError) && (
              <div className={`step-up-alert${state.status === "throttled" ? " throttled" : ""}`} role="alert">
                {state.status === "throttled" ? <RiTimeLine aria-hidden="true" /> : <RiLockPasswordLine aria-hidden="true" />}
                <span>{state.error || localError}</span>
                {retryText && state.status === "throttled" && <strong>{retryText}</strong>}
              </div>
            )}

            <div className="step-up-fields">
              <label className="step-up-field">
                <span>Current password</span>
                <div className="step-up-input-row">
                  <input
                    ref={passwordRef}
                    type={passwordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="step-up-input"
                    disabled={submitDisabled}
                  />
                  <button
                    type="button"
                    className="step-up-icon-button"
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    aria-label={passwordVisible ? "Hide current password" : "Show current password"}
                    disabled={submitDisabled}
                  >
                    {passwordVisible ? <RiEyeOffLine /> : <RiEyeLine />}
                  </button>
                </div>
              </label>

              {isMfaRequired && (
                <label className="step-up-field">
                  <span>Authenticator code</span>
                  <input
                    ref={otpRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\s+/g, ""))}
                    className="step-up-input"
                    disabled={submitDisabled}
                    placeholder="123456"
                    maxLength={8}
                  />
                </label>
              )}
            </div>

            <div className="step-up-footer">
              <button type="button" className="step-up-button secondary" onClick={onClose} disabled={state.status === "submitting"}>
                Cancel
              </button>
              <button type="submit" className="step-up-button primary" disabled={submitDisabled}>
                {state.status === "submitting" ? "Verifying…" : "Verify identity"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default StepUpDialog;

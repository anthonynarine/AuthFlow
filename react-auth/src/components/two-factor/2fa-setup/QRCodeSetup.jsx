import React, { useState } from "react";
import { RiArrowGoBackLine } from 'react-icons/ri';
import { useNavigate } from "react-router-dom";
import OTPModal from "../../login/OTPModal";
import "../../login/OTPModal.css";
import { useBasicAuthServices } from "../../../context/auth/BasicAuthContext";
import { authAxios } from "../../../interceptors/axios";
import { persistAuthTokens } from "../../../interceptors/tokenStorage";
import { useStepUpDialog } from "../../../hooks/useStepUpDialog";
import StepUpDialog from "../../step-up/StepUpDialog";
import "./QRCodeSetup.css";

async function extractErrorPayload(error) {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  return data || null;
}

export const QRCodeSetup = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useBasicAuthServices();
  const stepUp = useStepUpDialog();
  const [qrCode, setQrCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");

  const loadQRCode = async () => {
    setIsLoading(true);
    setTwoFactorError("");

    try {
      const { data } = await authAxios.get("/generate-qr/", { responseType: "blob" });
      const url = URL.createObjectURL(data);
      setQrCode(url);
    } catch (error) {
      const payload = await extractErrorPayload(error);
      if (error.response?.status === 403 && payload?.code === "STEP_UP_REQUIRED") {
        stepUp.requestStepUp({ response: { data: payload } }, "loading your 2FA setup QR code");
        return;
      }

      setTwoFactorError("Failed to load the QR code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmOtp = async () => {
    setIsLoading(true);
    setTwoFactorError("");

    try {
      const { data } = await authAxios.post("/verify-otp/", { otp: otpValue });
      persistAuthTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      setIsLoggedIn(true);
      setOtpModalOpen(false);
      setOtpValue("");
      navigate("/");
    } catch (error) {
      const payload = error?.response?.data;
      if (error.response?.status === 403 && payload?.code === "STEP_UP_REQUIRED") {
        stepUp.requestStepUp({ response: { data: payload } }, "completing two-factor setup");
        return;
      }

      const errorMessage = error.response?.data?.error
        ? Object.values(error.response.data.error).flat().join(" ")
        : "An error occurred while verifying the authenticator code. Please try again.";
      setTwoFactorError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="qr-container">
      <button className="nav-button" onClick={() => navigate("/")} title="Go back to homepage">
        <RiArrowGoBackLine size="1.5em" />
      </button>
      <div className="setup-instructions">
        <h6>Set up two-factor authentication with your authenticator app.</h6>
        <p>
          Load the QR code, scan it with your authenticator app, then confirm the 6-digit code below.
        </p>
        <div className="setup-actions">
          <button className="btn-next" onClick={loadQRCode} disabled={isLoading}>
            {isLoading && !qrCode ? "Loading…" : qrCode ? "Reload QR code" : "Load QR code"}
          </button>
          {qrCode && (
            <button className="btn-next secondary" onClick={() => setOtpModalOpen(true)}>
              Enter OTP
            </button>
          )}
        </div>
      </div>
      <div className="qr-image-container">
        {qrCode ? <img src={qrCode} alt="QR Code for 2FA Setup" className="qr-image" /> : <p>Load the QR code to continue.</p>}
      </div>
      {twoFactorError && <div className="setup-error" role="alert">{twoFactorError}</div>}
      <OTPModal
        isOpen={otpModalOpen}
        onConfirm={confirmOtp}
        onCancel={() => {
          setOtpModalOpen(false);
          setOtpValue("");
        }}
        onChange={(event) => setOtpValue(event.target.value)}
        otpValue={otpValue}
        twoFactorError={twoFactorError}
      />
      <StepUpDialog
        state={stepUp.state}
        onSubmit={stepUp.submitStepUp}
        onClose={stepUp.closeStepUp}
      />
    </div>
  );
};


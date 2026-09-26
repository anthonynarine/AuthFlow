import { useState } from "react";
import { useUserSessionServices } from "../context/auth/UserSessionContext";
import { apiErrorMessage } from "../console/utils/apiErrors";
import { resendVerificationEmail } from "./emailVerificationApi";
import { retryAfterSeconds, useRetryAfter } from "./useRetryAfter";

// Gait allows one verification email a minute; the cooldown also starts
// after a successful send so the button can't be hammered.
const COOLDOWN_SECONDS = 60;

/**
 * Resend the verification email. status: idle | sending | sent | error.
 * A 429 (RESEND_COOLDOWN or RATE_LIMITED) starts the countdown from
 * Retry-After instead of showing an error. If Gait says the address is
 * already verified, the session is refreshed so every banner disappears.
 */
export function useResendVerification() {
    const { validateSession } = useUserSessionServices();
    const cooldown = useRetryAfter();
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState(null);

    const resend = async () => {
        if (cooldown.waiting || status === "sending") return;
        setStatus("sending");
        setError(null);
        try {
            const data = await resendVerificationEmail();
            if (data.email_verified) {
                setStatus("idle");
                await Promise.resolve(validateSession()).catch(() => {});
                return;
            }
            setStatus("sent");
            cooldown.start(COOLDOWN_SECONDS);
        } catch (resendError) {
            if (resendError?.response?.status === 429) {
                setStatus("idle");
                cooldown.start(retryAfterSeconds(resendError, COOLDOWN_SECONDS));
                return;
            }
            setStatus("error");
            setError(apiErrorMessage(resendError));
        }
    };

    return { resend, status, error, cooldown };
}

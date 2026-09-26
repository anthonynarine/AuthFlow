import React from "react";
import { useResendVerification } from "./useResendVerification";
import "./emailVerification.css";

/** "Resend" with the cooldown shown on the button and the outcome announced. */
export function ResendVerificationButton({ className = "gc-button gc-button--ghost" }) {
    const { resend, status, error, cooldown } = useResendVerification();
    const label = status === "sending"
        ? "Sending…"
        : cooldown.waiting
            ? `Resend in ${cooldown.remaining}s`
            : "Resend link";
    return (
        <span className="gv-resend">
            <button type="button" className={className} onClick={resend} disabled={status === "sending" || cooldown.waiting}>
                {label}
            </button>
            <span role="status" aria-live="polite" className={status === "error" ? "gv-resend-error" : "gv-resend-note"}>
                {status === "sent" ? "Sent. Check your inbox (and spam)." : status === "error" ? error : ""}
            </span>
        </span>
    );
}

export default ResendVerificationButton;

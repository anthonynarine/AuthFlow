import React from "react";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";
import { ResendVerificationButton } from "./ResendVerificationButton";
import "./emailVerification.css";

/**
 * Persistent reminder for a signed-in account whose email isn't confirmed.
 * Shown only when Gait says `email_verified: false` -- a session from a
 * Gait without E1 (no field) shows nothing.
 */
export function EmailVerificationBanner() {
    const { user } = useBasicAuthServices();
    if (!user || user.email_verified !== false) return null;
    return (
        <div className="gv-banner" role="region" aria-label="Confirm your email">
            <p className="gv-banner-text">
                <strong>Confirm {user.email}.</strong> We sent you a link. You'll need it to create a workspace or join
                one.
            </p>
            <ResendVerificationButton />
        </div>
    );
}

export default EmailVerificationBanner;

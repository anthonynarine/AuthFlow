import React, { useEffect, useRef } from "react";
import { apiErrorMessage } from "../../utils/apiErrors";

const COPY = {
    save: ["Saving registration…", "Registration saved. Publish the current proof, then ask Gait to verify."],
    challenge: ["Generating a new ownership challenge…", "New ownership challenge generated. Publish the current proof before it expires."],
    verify: ["Gait is checking ownership…", "Ownership check completed. The registration status above is Gait’s current result."],
    transport: ["Saving session transport…", "Session transport saved. Sign in again before testing the integration."],
    revoke: ["Revoking login registration…", "Login registration revoked."],
};

export function RegistrationActionFeedback({ action, feedback, onSignIn }) {
    const ref = useRef(null);
    const error = feedback?.error;
    const failed = feedback?.status === "error";
    useEffect(() => {
        if (!failed) return;
        ref.current?.focus();
        ref.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    }, [failed, error]);
    if (!feedback || feedback.status === "idle") return null;
    if (feedback.status === "pending") return <p role="status" aria-live="polite">{COPY[action][0]}</p>;
    if (!failed) return <p role="status" aria-live="polite">{COPY[action][1]}</p>;
    const reauth = error?.response?.status === 403 && (error.response?.data?.code === "reauthentication_required" || error.response?.data?.detail === "reauthentication_required");
    const message = reauth ? "Sign in again with password and TOTP from your authenticator before changing login registration. Return to this application and choose the action again. Gait has not retried it automatically."
        : error?.response?.status === 403 ? "Gait refused this action. Check that you are an Owner or Admin with a recent password and authenticator-code sign-in, then try again. No change is confirmed."
        : apiErrorMessage(error);
    return <div ref={ref} role="alert" tabIndex={-1} className="gc-form-error gc-registration-action-error">
        <p>{message}</p>
        {reauth ? <><button type="button" className="gc-button gc-button--primary" onClick={onSignIn}>Sign in again and return here</button><p>Unsaved form edits are not retained when you leave this page.</p></> : null}
    </div>;
}

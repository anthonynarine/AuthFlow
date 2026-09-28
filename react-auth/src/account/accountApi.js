import { authAxios, SESSION_TRANSPORT } from "../interceptors/axios";
import { persistAuthTokens } from "../interceptors/tokenStorage";

/*
 * The person's own account (the console Account page), against Gait's user
 * endpoints. Password change, 2FA setup, 2FA disable and new recovery codes
 * need a recent sign-in and answer 403 STEP_UP_REQUIRED otherwise (see
 * useStepUpRetry). Turning 2FA off and making new codes use up the step-up,
 * so the next sensitive change asks again.
 */

/** TanStack Query key for the recovery-code count (never the codes). */
export const recoveryCodesKey = ["account", "recovery-codes"];

/** {message, sessions_revoked}: other devices are signed out, this one stays. */
export async function changePassword({ currentPassword, newPassword, newPasswordConfirm }) {
    const { data } = await authAxios.post("/change-password/", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
    });
    return data;
}

/**
 * Starts setup (needs a recent sign-in): Gait makes a new secret and returns
 * {is_2fa_setup_in_progress: true, manual_key}. The key is shown, never kept.
 */
export async function startTwoFactorSetup() {
    const { data } = await authAxios.patch("/user/toggle-2fa/", { is_2fa_enabled: true });
    return data;
}

/** The QR code as an object URL (the caller revokes it). */
export async function fetchTwoFactorQrCode() {
    const { data } = await authAxios.get("/generate-qr/", { responseType: "blob" });
    return URL.createObjectURL(data);
}

/**
 * Confirms the first code. Cookie session (E3): Gait starts a fresh two-step
 * session, puts its refresh token only in the HttpOnly cookie, and returns the
 * new access token, which replaces the old one in memory, plus the ten
 * recovery codes, shown once.
 */
export async function confirmTwoFactorSetup(otp) {
    const { data } = await authAxios.post("/verify-otp/", { otp, ...SESSION_TRANSPORT }, { withCredentials: true });
    if (data?.access_token) persistAuthTokens({ accessToken: data.access_token });
    return data;
}

/**
 * {is_2fa_setup_in_progress, sessions_revoked}. The proof is a fresh step-up
 * (password plus a code or a recovery code), so nothing else goes in the body.
 */
export async function disableTwoFactor() {
    const { data } = await authAxios.patch("/user/toggle-2fa/", { is_2fa_enabled: false });
    return data;
}

/** {enabled, recovery_codes_remaining, generated_at}. */
export async function fetchRecoveryCodeStatus() {
    const { data } = await authAxios.get("/user/2fa/recovery-codes/");
    return data;
}

/** Ten new codes; every older one stops working. Needs a fresh step-up. */
export async function regenerateRecoveryCodes() {
    const { data } = await authAxios.post("/user/2fa/recovery-codes/", {});
    return Array.isArray(data?.recovery_codes) ? data.recovery_codes : [];
}

/** Revokes every session, including this one. */
export async function signOutEverywhere() {
    const { data } = await authAxios.post("/logout-all/");
    return data;
}

/** Gait's error text, flattened ({error: "..."} or {error: {field: "..."}}). */
export function accountErrorMessage(error, fallback) {
    const payload = error?.response?.data?.error ?? error?.response?.data?.detail;
    if (typeof payload === "string") return payload;
    if (payload && typeof payload === "object") {
        const text = Object.values(payload).flat().filter(Boolean).join(" ");
        if (text) return text;
    }
    if (!error?.response) return "We couldn't reach Gait. Check your connection and try again.";
    return fallback;
}

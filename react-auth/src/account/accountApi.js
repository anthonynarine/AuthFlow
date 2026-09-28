import { authAxios, SESSION_TRANSPORT } from "../interceptors/axios";
import { persistAuthTokens } from "../interceptors/tokenStorage";

/*
 * The person's own account (the console Account page), against Gait's user
 * endpoints. Password change and 2FA setup need a recent sign-in and answer
 * 403 STEP_UP_REQUIRED otherwise (see useStepUpRetry). Turning 2FA off and
 * making new recovery codes are different (H6): they carry their own proof
 * (password + code or recovery code) in the request, every time, and answer
 * 403 PROOF_REQUIRED without it (see ProofDialog).
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
 * recovery codes, shown once, and sessions_revoked: every other session is
 * signed out (H6).
 */
export async function confirmTwoFactorSetup(otp) {
    const { data } = await authAxios.post("/verify-otp/", { otp, ...SESSION_TRANSPORT }, { withCredentials: true });
    if (data?.access_token) persistAuthTokens({ accessToken: data.access_token });
    return data;
}

/**
 * {is_2fa_setup_in_progress, sessions_revoked}. `proof` is {current_password,
 * otp} or {current_password, recovery_code}, sent in this same request.
 */
export async function disableTwoFactor(proof) {
    const { data } = await authAxios.patch("/user/toggle-2fa/", { is_2fa_enabled: false, ...proof });
    return data;
}

/** {enabled, recovery_codes_remaining, generated_at}. */
export async function fetchRecoveryCodeStatus() {
    const { data } = await authAxios.get("/user/2fa/recovery-codes/");
    return data;
}

/** Ten new codes; every older one stops working. `proof` as for disableTwoFactor. */
export async function regenerateRecoveryCodes(proof) {
    const { data } = await authAxios.post("/user/2fa/recovery-codes/", { ...proof });
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

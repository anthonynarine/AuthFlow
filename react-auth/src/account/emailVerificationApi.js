import { authAxios, publicAxios } from "../interceptors/axios";

/**
 * Email verification (Gait E1). Mounted at /api/email-verification/ -- not
 * under /api/auth/, so the refresh cookie is never sent with these.
 *
 * verify: no login needed (links open in whatever browser the mail app
 *   uses). 200 {email_verified: true, email} | 400 VERIFICATION_INVALID
 *   (invalid, used, expired or superseded -- never which) | 429
 *   RATE_LIMITED + Retry-After.
 * resend: signed in. 200 {email_verified, sent} | 429 RESEND_COOLDOWN or
 *   RATE_LIMITED + Retry-After.
 */
export async function verifyEmailToken(token) {
    const { data } = await publicAxios.post("/email-verification/verify/", { token });
    return data;
}

export async function resendVerificationEmail() {
    const { data } = await authAxios.post("/email-verification/resend/");
    return data;
}

/**
 * Access-token store (Gait console F0 -- secure session transport).
 *
 * The access token lives in JavaScript memory ONLY:
 *   - never localStorage / sessionStorage / a JS-readable cookie
 *   - lost on reload by design; the app re-obtains one from Gait's HttpOnly
 *     refresh cookie (see refreshCoordinator.js)
 *
 * The refresh token is never visible to JavaScript at all: Gait sets it as
 * an HttpOnly cookie scoped to its own /api/auth/ path, and only
 * /api/auth/refresh/ and /api/auth/logout/ ever receive it.
 */
import Cookies from "js-cookie";

let accessToken = null;

/** Current in-memory access token, or null when signed out / not yet restored. */
export function getAccessToken() {
    return accessToken;
}

/**
 * Store a freshly issued access token. `refreshToken` is accepted only so
 * old call sites stay harmless: it is ignored, because with cookie transport
 * Gait never sends one to JavaScript.
 */
export function persistAuthTokens({ accessToken: token } = {}) {
    if (token) {
        accessToken = token;
    }
}

/** Forget the in-memory access token (logout / failed refresh). */
export function clearAuthTokens() {
    accessToken = null;
}

/**
 * One-time cleanup of the previous storage model, which kept access and
 * refresh tokens in JS-readable cookies. Safe to call on every boot;
 * nothing reads these cookies any more.
 */
export function purgeLegacyTokenCookies() {
    for (const name of ["access_token", "refresh_token"]) {
        Cookies.remove(name);
        Cookies.remove(name, { path: "/" });
    }
}

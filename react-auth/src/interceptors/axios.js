import axios from "axios";
import Cookies from "js-cookie";
import { refreshWithBrowserCoordination } from "./refreshCoordinator";
import { clearAuthTokens, getAccessToken, persistAuthTokens } from "./tokenStorage";
import { SESSION_ENDED_EVENT, broadcastSignedOut } from "./sessionEvents";
import { safeLogError } from "../utils/safeLog";

/**
 * Gait HTTP clients (Gait console F0 -- secure session transport).
 *
 * Session model:
 *   - access token: JS memory only (tokenStorage.js), sent as
 *     `Authorization: Bearer` by authAxios
 *   - refresh token: Gait's HttpOnly cookie on /api/auth/, never visible here
 *   - login / 2FA login / guest login ask for `session_transport: "cookie"`
 *   - /api/auth/refresh/ restores or renews the access token;
 *     /api/auth/logout/ revokes the session server-side
 *
 * Every request carries `X-Gait-Auth`, which Gait requires on cookie-flow
 * requests (an HTML form cannot set it, and a cross-origin script can only
 * set it after passing CORS) -- see django_auth user/refresh_cookie.py.
 */

const baseURL = process.env.REACT_APP_USE_PRODUCTION_API === "true"
    ? process.env.REACT_APP_PRODUCTION_URL
    : process.env.NODE_ENV === "development"
        ? process.env.REACT_APP_DEV_URL
        : process.env.REACT_APP_PRODUCTION_URL;

const isSecureOrigin = typeof window !== "undefined" && window.location?.protocol === "https:";

export const SESSION_TRANSPORT = { session_transport: "cookie" };
export { SESSION_ENDED_EVENT };

// Never logs the error object: it carries the request body, the Authorization
// header and the full URL (GAIT-SEC-035/036). See utils/safeLog.js.
const logError = (error) => {
    safeLogError("Request failed", error);
    return Promise.reject(error);
};

function attachCommonHeaders(config) {
    config.headers = config.headers || {};
    config.headers["X-Gait-Auth"] = "1";
    const csrfToken = Cookies.get("csrftoken");
    if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
    }
    return config;
}

function rememberCsrfToken(response) {
    const newCsrfToken = response.headers?.["x-csrftoken"];
    if (newCsrfToken) {
        Cookies.set("csrftoken", newCsrfToken, { secure: isSecureOrigin, sameSite: "Lax" });
    }
}

function announceSessionEnded() {
    clearAuthTokens();
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
    }
}

// Session endpoints only (refresh/logout): no interceptors that could recurse.
const sessionAxios = axios.create({ baseURL, withCredentials: true });
sessionAxios.interceptors.request.use(attachCommonHeaders);

/** Obtain a new access token from the HttpOnly refresh cookie. Rejects if there is no live session. */
export function refreshSession() {
    return refreshWithBrowserCoordination(async () => {
        const { data } = await sessionAxios.post("/auth/refresh/", {});
        if (!data?.access_token) {
            throw new Error("Refresh response did not include an access token.");
        }
        persistAuthTokens({ accessToken: data.access_token });
        return data.access_token;
    });
}

/** Revoke the session server-side and forget the access token locally. */
export async function logoutSession() {
    try {
        await sessionAxios.post("/auth/logout/", {});
    } finally {
        clearAuthTokens();
        broadcastSignedOut();
    }
}

// Public (unauthenticated) requests: login, register, password reset, ...
const publicAxios = axios.create({ baseURL, withCredentials: true });

publicAxios.interceptors.request.use(attachCommonHeaders, logError);
publicAxios.interceptors.response.use((response) => {
    rememberCsrfToken(response);
    persistAuthTokens({ accessToken: response.data?.access_token });
    return response;
}, logError);

// Authenticated requests.
const authAxios = axios.create({ baseURL, withCredentials: true });

authAxios.interceptors.request.use(async (config) => {
    attachCommonHeaders(config);
    // After a reload the in-memory token is gone: restore it from the refresh
    // cookie before the first authenticated call instead of failing it.
    if (!getAccessToken() && !config.skipAuthRefresh) {
        try {
            await refreshSession();
        } catch {
            // No live session: send the request unauthenticated and let the
            // caller see the 401 (without a second refresh attempt).
            config._retry = true;
        }
    }
    const accessToken = getAccessToken();
    if (accessToken && !config.headers["Authorization"]) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
}, logError);

authAxios.interceptors.response.use(
    (response) => {
        rememberCsrfToken(response);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.skipAuthRefresh) {
            originalRequest._retry = true;
            try {
                const newAccessToken = await refreshSession();
                originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
                return authAxios(originalRequest);
            } catch (refreshError) {
                announceSessionEnded();
                return Promise.reject(refreshError);
            }
        }
        return logError(error);
    }
);

export { authAxios, publicAxios, sessionAxios };

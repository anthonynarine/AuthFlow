import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logoutSession, publicAxios, SESSION_TRANSPORT } from "../interceptors/axios";
import { queryClient } from "../app/queryClient";
import { afterSignIn } from "../auth/returnTo";
import { handleSignedOut, keepThroughNextSignOut } from "../console/invites/pendingInvite";
import { safeLogError } from "../utils/safeLog";

const COOKIE_LOGIN_ERRORS = {
    COOKIE_ORIGIN_REQUIRED: "Sign-in could not identify this page’s origin. Open the app in a regular browser tab and try again.",
    COOKIE_ORIGIN_NOT_ALLOWED: "This page is not enabled for cookie sign-in. For Gait Console, open https://gaitobservatory.com. For another app, ask its owner to check the verified frontend login origin in Gait Console.",
    COOKIE_HEADER_REQUIRED: "The sign-in request is missing a required security header. Reload the page. If this continues, ask the app owner to check its Gait integration.",
};

export function loginErrorMessage(error) {
    const status = error.response?.status;
    if (status === 403) {
        const code = error.response?.data?.code;
        return Object.prototype.hasOwnProperty.call(COOKIE_LOGIN_ERRORS, code)
            ? COOKIE_LOGIN_ERRORS[code]
            : "Sign-in is not permitted from this page. Open the app’s supported sign-in page or contact its owner.";
    }
    if (status === 429) return "Too many sign-in attempts. Wait a moment and try again.";
    if (!error.response) return "Could not reach Gait. Check your connection and try again.";
    return error.response?.data?.error || "Sign-in failed. Please try again.";
}

export const useBasicAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [error, setError] = useState("");
    const [is2FARequired, setIs2FARequired] = useState(false);
    const [emailFor2FA, setEmailFor2FA] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    // `returnTo` (allowlisted by afterSignIn) brings someone back to where
    // they were, e.g. the invite they were accepting.
    const login = useCallback(async ({ email, password }, { returnTo } = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            await publicAxios.post("/login/", { email, password, ...SESSION_TRANSPORT });
            setIsLoggedIn(true);
            setIs2FARequired(false);
            navigate(afterSignIn(returnTo));
        } catch (error) {
            if (error.response?.status === 401 && error.response.data?.["2fa_required"]) {
                setIs2FARequired(true);
            } else {
                setError(loginErrorMessage(error));
                safeLogError("Login failed", error);
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    // "Use a different account" from the sign-in code step: back to step 1.
    const cancelTwoFactor = useCallback(() => {
        setIs2FARequired(false);
        setError(null);
    }, []);

    const guestLogin = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await publicAxios.post("/guest-login/", { ...SESSION_TRANSPORT });
            setIsLoggedIn(true);
            setIs2FARequired(false);
            navigate("/workspace");
        } catch (error) {
            setError("Guest login is unavailable right now. Please try again shortly.");
            safeLogError("Guest login failed", error);
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    // keepInvite: "Switch account" on the invite page keeps the pending
    // invite through this one sign-out; every other sign-out forgets it.
    const logout = useCallback(async ({ keepInvite = false } = {}) => {
        setIsLoading(true);
        setMessage("");
        if (keepInvite) keepThroughNextSignOut();
        try {
            // Revokes the session server-side and clears the HttpOnly cookie.
            await logoutSession();
            setUser(null);
            setMessage("You are logged out");
            setIsLoggedIn(false);
        } catch (error) {
            safeLogError("Logout failed", error);
        } finally {
            // Whatever happened server-side, nothing cached for this session
            // (or any organization it could see) may survive locally.
            queryClient.clear();
            handleSignedOut();
            // A finished two-step sign-in must not leave the next visit to
            // /login on the code step.
            setIs2FARequired(false);
            setIsLoading(false);
        }
    }, []);

    const forgotPassword = useCallback(async (email) => {
        setIsLoading(true);
        setMessage("");
        setError("");
        try {
            const { data } = await publicAxios.post("/forgot-password/", { email });
            setMessage(data.message || "If your email is registered, you will receive a password reset link shortly.");
        } catch (error) {
            safeLogError("Forgot password request failed", error);
            setError("An error occurred while attempting to reset the password. Try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        login,
        guestLogin,
        logout,
        user,
        setUser,
        isLoggedIn,
        setIsLoggedIn,
        is2FARequired,
        cancelTwoFactor,
        emailFor2FA,
        setEmailFor2FA,
        error,
        setError,
        isLoading,
        setIsLoading,
        message,
        setMessage,
        forgotPassword,
    };
};

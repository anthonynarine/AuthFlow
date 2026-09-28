import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logoutSession, publicAxios, SESSION_TRANSPORT } from "../interceptors/axios";
import { queryClient } from "../app/queryClient";
import { afterSignIn } from "../auth/returnTo";
import { handleSignedOut, keepThroughNextSignOut } from "../console/invites/pendingInvite";

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
                setError(error.response?.data?.error || "An error occurred during login.");
                console.error("Login error:", error);
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
            console.error("Guest login error:", error);
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
            console.error("Logout error", error);
        } finally {
            // Whatever happened server-side, nothing cached for this session
            // (or any organization it could see) may survive locally.
            queryClient.clear();
            handleSignedOut();
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
            console.error("Forgot Password error", error);
            setError("An error occurred while attempting to reset the password. Try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resetPassword = useCallback(async ({ password, confirmPassword, uidb64, token }) => {
        setIsLoading(true);
        setMessage('');
        setError('');
        try {
            // Formulate the payload as per Django View expectations
            const payload = {
                password,
                password_confirm: confirmPassword,
                uidb64,
                token
            };
            const { data } = await publicAxios.post("/reset-password/", payload);
            setMessage(data.message || "Your password has been successfully reset.");
            navigate("/login/");
        } catch (error) {
            console.error("Reset Password error", error);
            setError(error.response?.data?.error || "An error occurred while attempting to reset the password. Try again.");
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

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
        resetPassword,
    };
};

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { afterSignIn } from "../auth/returnTo";
import { authAxios, publicAxios, SESSION_TRANSPORT } from "../interceptors/axios";
import { persistAuthTokens } from "../interceptors/tokenStorage";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";

export const useTwoFactorAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [twoFactorError, setTwoFactorError] = useState(null);
    const [qrCode, setQrCode] = useState("");
    const [isInitialSetup, setIsInitialSetup] = useState(false);

    const { setUser, setIsLoggedIn } = useBasicAuthServices();
    const navigate = useNavigate();

    // Function to toggle 2FA state
    const toggle2fa = useCallback(async (is2FAEnabled) => {
        setIsLoading(true);
        setTwoFactorError(null);

        try {
            const { data } = await authAxios.patch("/user/toggle-2fa/", { is_2fa_enabled: is2FAEnabled });
            setUser(prevState => ({
                ...prevState,
                is_2fa_enabled: data.is_2fa_enabled,
                is_2fa_setup_in_progress: data.is_2fa_setup_in_progress
            }));


            if (data.is_2fa_setup_in_progress) {
                setIsInitialSetup(true) // Enabling 2FA, start initial setup
                navigate("/setup-2fa/"); // Direct user to to setup page
            } else {
                setIsInitialSetup(false) // Disabling 2FS, clear setup flag
            }
        } catch (error) {
            console.error("Error toggling 2FA", error);
            setTwoFactorError(error.response && error.response.data.error ? error.response.data.error : "An error occurred while toggling 2FA. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [navigate, setUser]);

    // Function to fetch QR code for two-factor authentication
    const fetchQRCode = useCallback(async () => {
        setIsLoading(true);
        setTwoFactorError(null);
        try {
            const { data } = await authAxios.get("/generate-qr/", { responseType: "blob" });
            const url = URL.createObjectURL(data);
            setQrCode(url);
            setIsInitialSetup(true);
        } catch (error) {
            console.error("Error fetching QR code.", error);
            setTwoFactorError("Failed to fetch QR code. Please check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Function to verify two-factor authentication OTP
    // returnTo survives the one-time-code step (two-factor login only).
    const verify2FA = useCallback(async (otp, { returnTo } = {}) => {
        setIsLoading(true);
        setTwoFactorError(null);

        // Choose the endpoint based on whether it's an initial setup or a regular login.
        const endpoint = isInitialSetup ? "/verify-otp/" : "/two-factor-login/";
        try {
            // Both ask for the refresh token as an HttpOnly cookie (Gait E3 for
            // setup); the body only ever carries the access token.
            const body = { otp, ...SESSION_TRANSPORT };
            const client = isInitialSetup ? authAxios : publicAxios;
            const { data, status } = await client.post(endpoint, body, { withCredentials: true });
            if (status === 200) {
                persistAuthTokens({ accessToken: data.access_token });
                setIsLoggedIn(true);
                navigate(isInitialSetup ? "/workspace" : afterSignIn(returnTo));

                // Reset the initial state if it was part of the initial setup
                if (isInitialSetup) {
                    setIsInitialSetup(false);
                }
            }
        } catch (error) {
            // Gait refuses a wrong or expired code with 400/401/403 and says
            // little; say what to do instead of "an error occurred".
            const status = error.response?.status;
            if (status === 429) {
                setTwoFactorError("Too many attempts. Wait a minute, then enter the code showing now.");
            } else if (status && status < 500) {
                setTwoFactorError("That code didn't work. Codes change every 30 seconds; enter the one showing now.");
            } else {
                setTwoFactorError("We couldn't check that code just now. Try again in a moment.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigate, setIsLoggedIn, isInitialSetup]);

    return {
        toggle2fa,
        isLoading,
        twoFactorError,
        qrCode,
        verify2FA,
        fetchQRCode,
        isInitialSetup,
    };
}

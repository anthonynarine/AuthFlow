import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAxios } from "../interceptors/axios";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";
import Cookies from "js-cookie";

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
    const verify2FA = useCallback(async (otp) => {
        setIsLoading(true);
        setTwoFactorError(null);

        // Choose the endpoint based on whether it's an initial setup or a regular login.
        const endpoint = isInitialSetup ? "/verify-otp/" : "/two-factor-login/";
        try {
            const { data, status } = await authAxios.post(endpoint, { otp });
            if (status === 200) {
                Cookies.set("access_token", data.access_token, { expires: 7, secure: true, sameSite: 'Strict'});
                setIsLoggedIn(true);
                navigate("/");

                // Reset the initial state if it was part of the initial setup
                if (isInitialSetup) {
                    setIsInitialSetup(false);
                }
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error;
            const parsedError = errorMsg ? Object.values(errorMsg).join("") : "An error occurred during 2FA login";
            setTwoFactorError(parsedError)
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

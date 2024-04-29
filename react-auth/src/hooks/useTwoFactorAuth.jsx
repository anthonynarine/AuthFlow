import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAxios } from "../interceptors/axios";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";
import Cookies from "js-cookie";

export const useTwoFactorAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [twoFactorError, setTwoFactorError] = useState(null);
    const [qrCode, setQrCode] = useState("");


    const { setUser, setIsLoggedIn } = useBasicAuthServices();
    const navigate = useNavigate();

    // Log state changes
    useEffect(() => {
        console.log("isLoading updated to:", isLoading);
        console.log("twoFactorError updated to:", twoFactorError);
        console.log("qrCode updated to:", qrCode);
    }, [isLoading, twoFactorError, qrCode,]);

    // Function to toggle 2FA state
    const toggle2fa = useCallback(async (is2FAEnabled) => {
        setIsLoading(true);
        setTwoFactorError(null);

        try {
            const { data } = await authAxios.patch("/user/toggle-2fa/", { is_2fa_enabled: is2FAEnabled });
            setUser(prevState => ({ ...prevState, is_2fa_enabled: data.is_2fa_enabled }));

            if (data.is_2fa_enabled) {
                navigate("/setup-2fa/");
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
        try {
            const { data, status } = await authAxios.post("/verify-otp/", { otp });
            if (status === 200) {
                Cookies.set("accessToken", data.access_token, { expires: 7 });
                setIsLoggedIn(true);
                navigate("/");
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error;
            const parsedError = errorMsg ? Object.values(errorMsg).join(", ") : "An error occurred during 2FA login";
            setTwoFactorError(parsedError)
            console.log("testing Parsed 2faError:", parsedError);
        } finally {
            setIsLoading(false);
        }
    }, [navigate, setIsLoggedIn]);

    return {
        toggle2fa,
        isLoading,
        twoFactorError,
        qrCode,
        verify2FA,
        fetchQRCode,
    };
}

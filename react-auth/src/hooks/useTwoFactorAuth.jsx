
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { publicAxios, authAxios } from "../interceptors/axios";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";
import { FaSadCry } from "react-icons/fa";
import Cookies from "js-cookie";

export const useTwoFactorAuth = () => {

    const [isLoading, setIsLoading] = useState(false);
    const [twoFactorError, setTwoFactorError] = useState(null);
    const [qrCode, setQrCode] = useState("");

    const { setUser, setIsLoggedIn, } = useBasicAuthServices(); // state managed in useBaiscAuth
    const navigate = useNavigate();

    // Function to toggle 2FA state
    const toggle2fa = useCallback(async(is2FAEnabled) => {
        setIsLoading(true);
        setTwoFactorError(null);

        try {
            const { data } = await authAxios.patch("/user/toggle-2fa/", {is_2fa_enabled: is2FAEnabled});
            setUser(prevState => ({...prevState, is_2fa_enabled: data.is_2fa_enabled}));

            if (data.is_2fa_enabled) {
                navigate("/setup-2fa/")
            }          
        } catch (error) {
            console.error("Error togglign 2FA", error)
            setTwoFactorError(error.response && error.response.data.error ?  error.response.data.error : "An error occurred while toggling 2FA. Please try again.")
        } finally {
            setIsLoading(false);
        }
    }, [navigate, setUser])

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

    // Function to verify two-factor authentication OTP.
    const verify2FA = useCallback(async (otp) => {
        setIsLoading(true);
        setTwoFactorError(null);
        try {
            const { data, status } = await authAxios.post("/verify-otp", { otp});
            if (status === 200) {
                Cookies.set("accessToken", data.access_token, { expires: 7});
                setIsLoggedIn(true);
                navigate("/");
            } else {
                setTwoFactorError("Invalid OTP. Please try again.");
            }      
        } catch (error) {
            console.error("2FA login error", error);
            setTwoFactorError(error.response?.data?.error || "An error occurred during 2FA login"); 
        } finally {
            setIsLoading(false);
        }
    }, [navigate, setIsLoggedIn, setIsLoading, setTwoFactorError])

    return {
        toggle2fa,
        isLoading,
        twoFactorError,
        qrCode,
        verify2FA,
    };

}
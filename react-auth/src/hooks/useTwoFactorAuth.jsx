
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { publicAxios, authAxios } from "../interceptors/axios";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";
import { FaSadCry } from "react-icons/fa";

export const useTwoFactorAuth = () => {

    const [isLoading, setIsloading] = useState(false);
    const [twoFactorError, setTwoFactorError] = useState(null);
    const [qrCode, setQrCode] = useState("");

    const { setUser, setUserIsLoggedIn, } = useBasicAuthServices(); // state managed in useBaiscAuth
    const navigate = useNavigate();

    const toggle2fa = useCallback(async(is2FAEnabled) => {
        setIsloading(true);
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
            setIsloading(false);
        }
    }, [navigate, setUser])


    const fetchQRCode = useCallback(async () => {
        setIsloading(true);
        setTwoFactorError(null);
        try {
            const { data } = await authAxios.get("/generate-qr/", { responseType: "blob" });
            const url = URL.createObjectURL(data);
            setQrCode(url);
        } catch (error) {
            console.error("Error fetching QR code.", error);
            setTwoFactorError("Failed to fetch QR code. Please check your connection and try again.");  
        } finally {
            setIsloading(false);
        }
    }, [])

    return {
        toggle2fa,
        isLoading,
        twoFactorError,
        qrCode,
    };

}
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { publicAxios, authAxios } from "../interceptors/axios";
import { useCallback, useState } from "react";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";


export const useAuth = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [error, setError] = useState("");
    const [user, setUser] = useState(null);
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [is2FARequired, setIs2FARequired] = useState(false);
    const [qrCode, setQrCode] = useState("")
    
    const navigate = useNavigate();

    const verify2FA = useCallback(async ({ otp }) => {
        setIsLoading(true);
        setMessage("");
        try {
            const { data } = await authAxios.post("/verify-otp/", {  otp }, { withCredentials: true});
            if (data.success) {
                Cookies.set("accessToken", data.access_token, { expires: 7 });
                setIsLoggedIn(true);
                setMessage("2FA verification successful");
                navigate("/")
            } else {
                setMessage(data.error || "Invalid OTP. Please try again");
            }
        } catch (error) {
            console.error("2FA verification error:", error);
            setMessage(error.response?.data?.error || "An error occurred during 2FA verification")
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    const fetchQRCode = useCallback(async () => {
        try {
            const { data } = await authAxios.get("/generate-qr/", { responseType: "blob" });
            const url = URL.createObjectURL(data);
            setQrCode(url); 
        } catch (error) {
            console.error("Error fetching QR code:", error)
        }
    }, []);


    return {
        error,
        user,
        message,
        verify2FA, 
        is2FARequired,
        setIs2FARequired,
        isLoggedIn, 
        isLoading,
        fetchQRCode, 
        qrCode,
    };

};
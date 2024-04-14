// useBasicAuth.jsx
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { publicAxios, authAxios } from "../../interceptors/axios";


export const useBasicAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [error, setError] = useState("");
    const [is2FARequired, setIs2FARequired] = useState(false);
    const [emailFor2FA, setEmailFor2FA] = useState("")
    const navigate = useNavigate();

    const login = useCallback(async ({ email, password}) => {
        setIsLoading(true);
        try {
            const { data } = await publicAxios.post("/login/", { email, password }, { withCredentials: true })
            console.log("login data", data)
            if (data?.["2fa_required"]) {
                setIs2FARequired(true); // Set flag if 2FA is needed
                setEmailFor2FA(email) // set email to be used in TwoFactorLoginAPIView
            } else {
                Cookies.set("accessToken", data.access_token, { expires: 7 });
                setIsLoggedIn(true)
                navigate("/")
            }
        } catch (error) {
            setError(error.response?.data?.error || "An error occured during login. ")
            console.error("Login error:", error)
            console.log(error.response || error);
            
        } finally {
            setIsLoading(false);
        }
    }, [navigate])

    return {
        login,
        user,
        isLoggedIn,
        is2FARequired,
        emailFor2FA, 
        setEmailFor2FA,
        error,
        isLoading,
    };
}
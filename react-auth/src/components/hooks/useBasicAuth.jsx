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
    const [message, setMessage] = useState("")
    const navigate = useNavigate();

    const login = useCallback(async ({ email, password}) => {
        setIsLoading(true);
        setError(null)
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
            setError(error.response.data.error ||  "An error occured during login. ")
            console.error("Login error:", error)
            console.log(error.response || error);
            
        } finally {
            setIsLoading(false);
        }
    }, [navigate])

    const logout = useCallback(async ()=> {
        setIsLoading(true);
        setMessage("");
        try {
            await publicAxios.post("/logout/");
            Cookies.remove("accessToken");
            Cookies.remove("csrftoken");
            setUser(null);
            setMessage("You are logged out");
            setIsLoggedIn(false)
        } catch (error) {
            console.error("Logout error", error);
            
        } finally {
            setIsLoading(false)
        }
    }, []);


    return {
        login,
        logout,
        user,
        setUser,
        isLoggedIn,
        setIsLoggedIn,
        is2FARequired,
        emailFor2FA, 
        setEmailFor2FA,
        error,
        setError,
        isLoading,
        setIsLoading,
        message,
        setMessage, 
    };
}
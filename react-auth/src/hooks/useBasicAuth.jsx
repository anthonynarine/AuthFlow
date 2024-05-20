// useBasicAuth.jsx
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { publicAxios, authAxios } from "../interceptors/axios";


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
            const { data } = await publicAxios.post("/login/", { email, password });
            console.log("login data", data)

            // This block will not be reached if 2FA is required since th 401 error will be thrown 
            Cookies.set("accessToken", data.access_token, { expires: 7, secure: true, sameSite: 'Strict' });
            setIsLoggedIn(true)
            setIs2FARequired(false)
            navigate("/")
            
        } catch (error) {
            if (error.response?.status === 401 && error.response.data?.["2fa_required"]) {
                setIs2FARequired(true);
                console.log("2FA required, setting state to true in catch block");
            } else {
                setError(error.response?.data?.error ||  "An error occured during login. ")
                console.error("Login error:", error)
                console.log(error.response || error);
            }
            
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

    const forgotPassword = useCallback(async(email) => {
        setIsLoading(true);
        setMessage("");
        setError("");
        try {
            const { data } = await publicAxios.post("/forgot-password/", { email });
            setMessage(data.message || "If your email is registered, you will receive a password reset link shortly. ") 
        } catch (error) {
            console.error("Forgot Password error", error);
            setError("An error occurred while attempting to reset the password. Try again.")      
        } finally {
            setIsLoading(false);
        }
    }, [])

    const resetPassword = useCallback(async({ password, confirmPassword, uidb64, token}) => {
        setIsLoading(true);
        setMessage('');
        setError('');
        try {
            // Formulate the playload as per Dango View expectations
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
            setError(error.response?.data?.error || "An error occurred while attempting to reset the password. Try again ") 
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);


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
        forgotPassword,
        resetPassword,
    };
}
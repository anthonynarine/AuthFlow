import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axiosAPIinterceptor from "../../interceptors/axios";
import { useCallback, useState } from "react";
import axios from "axios";

export const useAuth = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [is2FARequired, setIs2FARequired] = useState(false);
    const [emailFor2FA, setEmailFor2FA] = useState("");

    const login = useCallback(async ({ email, password}) => {
        try {
            const { data } = await axiosAPIinterceptor.post("/login/", { email, password }, { withCredentials: true })
            console.log("login data", data)
            if (data?.["2fa_required"]) {
                console.log("Does data have 2fa_required?", data?.["2fa_required"]);
                setIs2FARequired(true); // Set flag if 2FA is needed
                setEmailFor2FA(email)
            } else {
                Cookies.set("accessToken", data.access_token, { expires: 7 });
                console.log("Setting isLoggedIn to true");
                setIsLoggedIn(true)
                navigate("/")
            }
        } catch (error) {
            console.error("Login error:", error)
            setMessage(error.response?.data?.error || "An error occured during login. ")
            
        }
    }, [navigate])

    const fetchQRCode = useCallback(async () => {
        try {
            const { data } = await axiosAPIinterceptor.get("/generate/qr/");
           
            
        } catch (error) {
            
        }
    })

    const verify2FA = useCallback(async ({ otp }) => {
        try {
            const { data } = await axiosAPIinterceptor.post("/two-factor-login/", { email: emailFor2FA, otp }, { withCredentials: true});
            Cookies.set("accessToken", data.access_token, { expires: 7});
            setIs2FARequired(false); // Reset 2FA req
            setEmailFor2FA("") // Clear stored email after verification
            setIsLoggedIn(true);
            navigate("/");
        } catch (error) {
            console.error("2FA verification error:", error);
            setMessage(error.response?.data?.error || "An error occurred during 2FA verification")
        }
    }, [navigate, emailFor2FA, setIs2FARequired]);

    const logout = useCallback(async ()=> {
        try {
            await axiosAPIinterceptor.post("/logout/", {}, { withCredentials: true});
            Cookies.remove("accessToken");
            setUser(null);
            setMessage("You are logged out");
            setIsLoggedIn(false);
            navigate("/login")
        } catch (error) {
            console.error("Logout error", error);
            
        }
    }, [navigate]);

    const forgotPassword = useCallback(async(email) => {
        try {
            const { data } = await axiosAPIinterceptor.post("/forgot-password/", {email}, {withCredentials: true})
            setMessage(data?.message); 
        } catch (error) {
            console.error("Forgot Password error", error);
            setMessage(error.response?.data?.error || "An unknow error occurred");
        }
    },[]);

    const resetPassword = useCallback(async({ password, confirmPassword, uidb64, token }) =>{
        try {
            const payload = {
                password,
                password_confirm: confirmPassword,
                uidb64,
                token
            };
            const { data } = await axios.post("http://localhost:8000/api/reset-password/", payload, { withCredentials: true });
            setMessage(data?.message);
            navigate("/login");  
        } catch (error) {
            console.error("Reset Password error", error);
            setMessage(error.response?.data?.error || "An unknown error occurred");  
        }
    }, [navigate]);

    const validateSession = useCallback(async()=> {
        try {
            setIsLoading(true);
            const { data } = await axiosAPIinterceptor.get("/validate-session/");
                console.log("User Data", data)
                setUser(data)
                setIsLoggedIn(true)
                setMessage(`Hi ${data.first_name}`)
        } catch (error) {
            console.error("Error fetching user data", error);
            setUser(null);
            setIsLoggedIn(false);
            setIsLoading(false) ;
            setMessage("Login or Register to test this app"); 
        }
    },[]);

    return {
        logout,
        validateSession,
        fetchQRCode,
        user,
        message,
        forgotPassword,
        resetPassword,
        login,
        verify2FA, 
        is2FARequired,
        setIs2FARequired,
        isLoggedIn, 
        isLoading,
    };

};
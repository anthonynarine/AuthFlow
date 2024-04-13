import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { authAxios, publicAxios } from "../../interceptors/axios"
import { useCallback, useState } from "react";


export const useAuth = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [error, setError] = useState("");
    const [user, setUser] = useState(null);
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [is2FARequired, setIs2FARequired] = useState(false);
    const [emailFor2FA, setEmailFor2FA] = useState("");
    const [qrCode, setQrCode] = useState("")
    
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

    const logout = useCallback(async ()=> {
        setIsLoading(true);
        setMessage("");
        try {
            await authAxios.post("/logout/", {}, { withCredentials: true});
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
        try {
            const { data } = await publicAxios.post("/forgot-password/", {email}, {withCredentials: true})
            setMessage(data?.message); 
        } catch (error) {
            console.error("Forgot Password error", error);
            setMessage(error.response?.data?.error || "An unknow error occurred");
        }
    }, []);

    const resetPassword = useCallback(async({ password, confirmPassword, uidb64, token }) =>{
        try {
            const payload = {
                password,
                password_confirm: confirmPassword,
                uidb64,
                token
            };
            //  #ADD UPDATE THIS URL TO USE DEV OR PROD URL SET IN INTERCEPTOR. 
            const { data } = await publicAxios.post("/reset-password/", payload, { withCredentials: true });
            setMessage(data?.message);
            navigate("/login");  
        } catch (error) {
            console.error("Reset Password error", error);
            setMessage(error.response?.data?.error || "An unknown error occurred");  
        }
    }, [navigate]);

    /**
     * Validates the current user session by making an API call.
     * This function checks if there is a valid user session. If the session is valid,
     * it updates the user state and authentication status accordingly.
     * In case of an error (e.g., session is not valid), it sets the user state to null,
     * updates the authentication status to false, and sets an appropriate message.
     * It uses the useCallback hook to avoid unnecessary re-creations of the function
     * unless its dependencies change (in this case, there are no dependencies).
     */
    const validateSession = useCallback(async() => {
        try {
            setIsLoading(true); // Start loading state
            setMessage(""); // Clear any existing messages

            // Attempt to get session validation data from the API
            const { data } = await authAxios.get("/validate-session/");
            console.log("User Data", data); // Log user data for debugging

            setUser(data); // Update user state with the received data
            setIsLoggedIn(true); // Update authentication status to true
            setMessage(`Hi ${data.first_name}`); // Personalized welcome message
        } catch (error) {
            console.error("Error fetching user data", error); // Log error for debugging
            setUser(null); // Reset user state to indicate no user is logged in
            setIsLoggedIn(false); // Update authentication status to false
            setMessage("Login or Register to test this app"); // Set message prompting to login or register
        } finally {
            setIsLoading(false); // End loading state
        }
    }, []); // Dependency array is empty, indicating this callback does not depend on any props or state

    const toggle2fa = useCallback(async(is2FAEnabled) => {
        setIsLoading(true);
        setMessage("") //  Clear any previous messages
        try {
            // is2FAEnabled  is a bool indicating the desired 2fa state.
            const { data } = await authAxios.patch("/user/toggle-2fa/", {
                is_2fa_enabled: is2FAEnabled
            }, { withCredentials: true });

            // Update  the local state with the new 2FA stats from the server
            setUser(prevState => ({...prevState, is_2fa_enabled: data.is_2fa_enabled}));

            // Inform the user that the 2FA has been successfully enabled or disabled.
            setMessage(`2FA has been ${is2FAEnabled ? "enabled" : "disabled"}`)

            if (data.is_2fa_enabled) {
                navigate("/setup-2fa/");
            }
        } catch (error) {
            console.error("Error toggling 2FA:", error);
            setMessage(error.response?.data?.error || "An error occurred while toggling 2FA. Please try again.")
        } finally {
            setIsLoading(false);
        }    
    }, [navigate])



    return {
        logout,
        error,
        validateSession,
        user,
        message,
        forgotPassword,
        resetPassword,
        login,
        verify2FA, 
        is2FARequired,
        setIs2FARequired,
        isLoggedIn, 
        toggle2fa,
        isLoading,
        fetchQRCode, 
        qrCode,
    };

};

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAxios, publicAxios } from "../../interceptors/axios";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";

export const useTwoFactorAuth = () => {

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState("")
    const { setUser } = useBasicAuthServices();
    const navigate = useNavigate();

    const toggle2fa = useCallback(async(is2FAEnabled) => {
        setIsLoading(true);
        setError(null);
        setMessage("");
        try {
            const { data } = await authAxios.patch("/user/toggle-2fa/", {is_2fa_enabled: is2FAEnabled});
            setUser(prevState => ({...prevState, is_2fa_enabled: data.is_2fa_enabled}));
            setMessage(`2FA has been ${is2FAEnabled ? "enabled" : "disabled"} successfully.`); 
            if (data.is_2fa_enabled) {
                navigate("/setup-2fa/")
            }          
        } catch (error) {
            console.error("Error togglign 2FA", error)
            setError (error.response && error.response.data.error ?  error.response.data.error : "An error occurred while toggling 2FA. Please try again.")
        } finally {
            setIsLoading(false);
        }
    }, [navigate, setUser])

    return {
        toggle2fa,
    };

}
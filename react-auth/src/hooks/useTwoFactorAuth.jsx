
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { publicAxios, authAxios } from "../interceptors/axios";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";
import { FaSadCry } from "react-icons/fa";

export const useTwoFactorAuth = () => {

    const [isLoading, setIsloading] = useState(false);
    const [twoFactorError, setIsTwoFactorError] = useState(null);

    const { setUser } = useBasicAuthServices();
    const navigate = useNavigate();

    const toggle2fa = useCallback(async(is2FAEnabled) => {
        setIsloading(true);
        setIsTwoFactorError(null);

        try {
            const { data } = await authAxios.patch("/user/toggle-2fa/", {is_2fa_enabled: is2FAEnabled});
            setUser(prevState => ({...prevState, is_2fa_enabled: data.is_2fa_enabled}));

            if (data.is_2fa_enabled) {
                navigate("/setup-2fa/")
            }          
        } catch (error) {
            console.error("Error togglign 2FA", error)
            setIsTwoFactorError(error.response && error.response.data.error ?  error.response.data.error : "An error occurred while toggling 2FA. Please try again.")
        } finally {
            setIsloading(false);
        }
    }, [navigate, setUser])

    return {
        toggle2fa, isLoading, twoFactorError
    };

}
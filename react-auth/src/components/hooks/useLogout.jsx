import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axiosAPIinterceptor from "../../interceptors/axios";

export const useLogout = (onLogoutSuccess) => {
    const navigate = useNavigate();

    const logout = async () => {
        try {
            await axiosAPIinterceptor.post("/logout/", {}, { withCredentials: true });
            Cookies.remove("accessToken");
            onLogoutSuccess();
            navigate("/");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return logout;
};

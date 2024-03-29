import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axiosAPIinterceptor from "../../interceptors/axios";
import { useCallback, useState } from "react";
import axios from "axios";

export const useAuth = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [message, setMessage] = useState("")

    const logout = useCallback(async ()=> {
        try {
            await axiosAPIinterceptor.post("/logout/", {}, { withCredentials: true});
            Cookies.remove("accessToken");
            setUser(null)
            setMessage("You are logged out")
            navigate("/")
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

    const getUser = useCallback(async()=> {
        try {
            const { data } = await axiosAPIinterceptor.get("/user/");
            console.log("User Data", data)
            setUser(data)
            setMessage(`Hi ${data.first_name}`)
        } catch (error) {
            console.error("Error fetching user data", error);
            setUser(null)
            setMessage("Login or Register to test this app");  
        }
    },[]);

    return {
        logout,
        getUser,
        user,
        message,
        forgotPassword,
        resetPassword,
    }

};
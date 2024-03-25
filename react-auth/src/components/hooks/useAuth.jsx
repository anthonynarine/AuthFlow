import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axiosAPIinterceptor from "../../interceptors/axios";
import { useCallback, useState } from "react";

export const useAuth = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [message, setMessage] = useState("")

    const logout = useCallback(async ()=> {
        try {
            await axiosAPIinterceptor.post("/logout/", {}, { withCredentials: true});
            Cookies.remove("accessToken");
            setUser(null)
            setMessage("You are logged off")
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

    return { logout, getUser, user, message, forgotPassword }

};
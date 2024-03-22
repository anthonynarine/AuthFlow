import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axiosAPIinterceptor from "../../interceptors/axios";
import { useCallback, useState } from "react";

export const useAuth = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [message, setMessage] = useState("You are not logged out")

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


    return { logout, getUser, user, message}



}
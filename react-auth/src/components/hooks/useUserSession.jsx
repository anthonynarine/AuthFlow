

import { useCallback } from "react";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { authAxios } from "../../interceptors/axios";



export const useUserSession = () => {
    const { setUser, setIsLoggedIn, setError, setIsLoading, setMessage } = useBasicAuthServices();

    const validateSession = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setMessage("");
        try {
            const { data } = await authAxios.get("/validate-session/");
            if (data) {  // Check if data is not null or undefined
                setUser(data); // Data here is the user object
                setIsLoggedIn(true)
                setMessage(`Welcome ${data.first_name}`)
            } else {
                // Handle the case where no user data is returned
                setUser(null);
                setIsLoggedIn(false);
                setMessage("Please log in.")
            }
            
        } catch (error) {
            console.error("Session validation error", error);
            setIsLoggedIn(false);
            setUser(null);
            if (error.response) {
                const { status, data } = error.response;
                if (status === 401) {
                    setError("Session expired. Please log in again.")
                } else {
                    setError(data.detail || "An unexpected error occuredd. Please try again")
                }
            } else {
                setError("Netword error. Please check your connection and try again.");    
            }
        } finally {
            setIsLoading(false);
        }
    }, [setUser, setIsLoggedIn, setError, setIsLoading, setMessage])

    return { validateSession }
}
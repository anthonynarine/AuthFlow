import { useState, useCallback } from "react";
import axios from "axios";
import { useUserSessionServices } from "../context/auth/UserSessionContext";

const useGptRequest = () => {
    const [gptResponse, setGptResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useUserSessionServices();
    const [chatHistory, setChatHistory] = useState([]); 


    const requestToGpt = useCallback(async (prompt) => {
        const sender = user ? user.first_name : "user" 
        const userEntry = { sender, message: prompt };
        setChatHistory([...chatHistory, userEntry]) // Update chat history with user entry

        setLoading(true);
        setError(null);

        try {
            const { data } = await axios.post('https://gait-gpt.herokuapp.com/api/gpt/', { prompt });
            const aiEntry = { sender: "ai", message: data};
            setChatHistory(prevHistory => [...prevHistory, aiEntry]); // Update chat history with ai entry
            setGptResponse(data);        
        } catch (error) {
            setError(error.response ? error.response.data : error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    return { gptResponse, loading, error, chatHistory, requestToGpt}
};

export default useGptRequest
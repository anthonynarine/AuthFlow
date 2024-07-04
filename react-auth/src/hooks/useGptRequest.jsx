import { useState, useCallback } from "react";
import axios from "axios";
import { useUserSessionServices } from "../context/auth/UserSessionContext"; // Importing the user session context

const useGptRequest = () => {
    // State variables to manage the GPT response, loading state, and errors
    const [gptResponse, setGptResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useUserSessionServices(); // Getting user information from the context
    const [chatHistory, setChatHistory] = useState([]); // State to manage chat history

    // Function to make a request to the GPT API
    const requestToGpt = useCallback(async (prompt) => {
        // Set the sender to the logged-in user's first name or default to "user"
        const sender = user ? user.first_name : "user";
        // Create an entry for the user's message
        const userEntry = { sender, message: prompt };
        // Update the chat history with the user's message
        setChatHistory([...chatHistory, userEntry]);

        // Set loading state to true and clear any previous errors
        setLoading(true);
        setError(null);

        try {
            // Make a POST request to the GPT API
            const { data } = await axios.post('https://gait-ai-b0b55b4bd581.herokuapp.com/api/gpt/', { prompt }, {
                withCredentials: true,
                headders: {
                    "Content-Type": "application/json",
                }
            });
            // Create an entry for the AI's response
            const aiEntry = { sender: "", message: data };
            // Update the chat history with the AI's response
            setChatHistory(prevHistory => [...prevHistory, aiEntry]);
            // Set the GPT response
            setGptResponse(data);
        } catch (error) {
            // Set the error message
            setError(error.response ? error.response.data : error.message);
        } finally {
            // Set loading state to false
            setLoading(false);
        }
    }, [chatHistory, user]); // Include chatHistory and user as dependencies

    // Return the state variables and the request function
    return { gptResponse, loading, error, chatHistory, requestToGpt };
};

export default useGptRequest;

import { useState, useCallback } from "react";
import axios from "axios";

const useGptRequest = () => {
    const [gptResponse, setGptResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const requestToGpt = useCallback(async (prompt) => {
        setLoading(true);
        setError(null);

        try {
            const { data } = await axios.post('https://gait-gpt.herokuapp.com/api/gpt/', { prompt });
            setGptResponse(data);        
        } catch (error) {
            setError(error.response ? error.response.data : error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    return { gptResponse, loading, error, requestToGpt}
};

export default useGptRequest
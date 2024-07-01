import {useState, useEffect } from "react";
import useGptRequest from "../../hooks/useGptRequest";
import { useUserSessionServices } from "../../context/auth/UserSessionContext";

const ChatComponent = () => {
    const [prompt, setPrompt] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const { gptResponse, loading, error, requestToGpt } = useGptRequest();
    const { user } = useUserSessionServices();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const userEntry = { sender: "user", message: prompt};
    }
}
import {useState } from "react";
import useGptRequest from "../../hooks/useGptRequest";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { RiArrowGoBackLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import "./ChatComponent.css"


const ChatComponent = () => {
    const { loading, error, chatHistory, requestToGpt } = useGptRequest();
    const [prompt, setPrompt] = useState("");
    let navigate = useNavigate()

    const handleSend = () => {
        requestToGpt(prompt);
        setPrompt("");
    };

    const handleBack = () => {
        navigate("/")
    }

    return (
        <div className="chat-container">

                <div className="back-button-container">
                    <button className="back-button" onClick={handleBack}>
                        <RiArrowGoBackLine size="1.5em" className="back-icon" />
                    </button>
                    <h1 className="chat-title">Gait' Ai Assistant</h1>
                </div>

            <div className="chat-history">
                {chatHistory.map((entry, index) => (
                    <div key={index} className={`chat-entry ${entry.sender}`}>
                    {entry.message}
                    </div>
                ))}
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask about the App..."
                />
                <button onClick={handleSend} disabled={loading}>
                    Send
                </button>
            </div>
            {loading && <AiOutlineLoading3Quarters className="loading-icon" />}
            {error && <p>Error: {error}</p>}
        </div>
    );
};

export default ChatComponent;
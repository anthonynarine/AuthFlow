import {useState } from "react";
import useGptRequest from "../../hooks/useGptRequest";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import "./ChatComponent.css"

const ChatComponent = () => {
    const { loading, error, chatHistory, requestToGpt } = useGptRequest();
    const [prompt, setPrompt] = useState("");

    const handleSend = () => {
        requestToGpt(prompt);
        setPrompt("");
    };

    return (
        <div className="chat-container">
            <div className="chat-history">
                {chatHistory.map((entry, index) => (
                    <div key={index} className={`chat-entry ${entry.sender}`}>
                        <strong>{entry.sender}:</strong> {entry.message}
                    </div>
                ))}
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type your message..."
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
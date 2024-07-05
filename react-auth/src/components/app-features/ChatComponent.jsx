import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGptRequest from "../../hooks/useGptRequest";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { RiArrowGoBackLine, RiSendPlane2Fill } from "react-icons/ri"; // Import the arrow icon
import "./ChatComponent.css";

const ChatComponent = () => {
    const { loading, error, chatHistory, requestToGpt } = useGptRequest();
    const [prompt, setPrompt] = useState("");
    let navigate = useNavigate();

    const handleSend = () => {
        if (prompt.trim() === "") return; // Prevent sending empty messages
        requestToGpt(prompt);
        setPrompt("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    const handleBack = () => {
        navigate("/"); // Navigate to the home page
    };

    return (
        <div className="chat-container">
            <div className="back-button-container">
                <button className="back-button" onClick={handleBack}>
                    <RiArrowGoBackLine size="1.5em" className="back-icon" />
                </button>
                <h1 className="chat-title">Gait's Assistant</h1>
            </div>
            <div className="chat-history">
                {chatHistory.map((entry, index) => (
                    <div key={index} className={`chat-entry ${entry.sender}`}>
                        {entry.message}
                    </div>
                ))}
            </div>
            <div className="chat-input-wrapper">
                <div className="chat-input">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown} // Add the keypress event handler
                        placeholder="Ask about the API..."
                    />
                    <button className="send-arrow" onClick={handleSend}>
                        <RiSendPlane2Fill size="1.5em" />
                    </button>
                </div>
            </div>
            {loading && <AiOutlineLoading3Quarters className="loading-icon" />}
            {error && <p>Error: {error}</p>}
        </div>
    );
};

export default ChatComponent;

import React, { useState } from "react";
import "./SendEmail.css"; // Make sure this path is correct
import { useNavigate } from "react-router-dom";
import { RiArrowGoBackLine } from 'react-icons/ri';
import { publicAxios } from "../../interceptors/axios";

export const SendEmail = () => {
    const [emailDetails, setEmailDetails] = useState({
        reply_to: '',
        subject: "",
        content: "",
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setEmailDetails({
            ...emailDetails,
            [name]: value,
        });
    };

    const sendEmail = async (event) => {
        event.preventDefault();
        try {
            await publicAxios.post("/mail/send-email/", emailDetails);
            alert("Email sent successfully");
        } catch (error) {
            console.error("Failed to send email:", error.response);
        }
    };

    let navigate = useNavigate();

    function handleHomeClick() {
        navigate("/");
    }

    return (
        <>
            <div className="nav-buttons">
                <button onClick={handleHomeClick} className="nav-button" title="Go to homepage">
                    <RiArrowGoBackLine size="1.5em" />
                </button>
            </div>
            <div className="email-invite">
                <p>Have questions or need more information? Feel free to reach out anytime at <a href="mailto:anthonynarine@anjin.org">anthonynarine@anjin.org</a></p>
            </div>
            <form onSubmit={sendEmail} className="form">
                <h6 className="from-h6">New Message</h6>
                <input
                    className="form-input"
                    type="email"
                    name="reply_to"
                    value={emailDetails.reply_to}
                    placeholder="Your email"
                    onChange={handleChange}
                    required
                />
                <input
                    className="form-input"
                    type="text"
                    name="subject"
                    value={emailDetails.subject}
                    placeholder="Subject"
                    onChange={handleChange}
                    required
                />
                <textarea
                    className="form-textarea"
                    name="content"
                    value={emailDetails.content}
                    onChange={handleChange}
                    required
                />
                <button type="submit" className="form-button">Send</button>
            </form>
        </>
    );
};

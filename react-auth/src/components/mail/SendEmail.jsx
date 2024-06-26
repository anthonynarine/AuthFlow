import React, { useState } from "react";
import axios from "axios";
import "./SendEmail.css"; // Make sure this path is correct
import { useNavigate } from "react-router-dom";
import { RiArrowGoBackLine } from 'react-icons/ri';

// Development and production base URLs
// const DEV_URL = "http://localhost:8000/mail/send-email/";
const PRODUCTION_URL = "https://ant-django-auth-62cf01255868.herokuapp.com/mail/send-email/";

export const SendEmail = () => {
    const [emailDetails, setEmailDetails] = useState({
        from_email: 'anthonynarine@anjin.org', // Verified Sender Email
        to_email: '',
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
            const response = await axios.post(PRODUCTION_URL, emailDetails);
            alert("Email sent successfully");
        } catch (error) {
            console.error("Failed to send email:", error.response);
        }
    };

    let navigate = useNavigate();

    function handleClick () {
      navigate("/");
    };

    return (
        <>
            <div className="nav-button">
            <button onClick={handleClick} className="nav-button" title="Go back to homepage">
                <RiArrowGoBackLine size="1.5em" />
            </button>
            </div>
            <div className="email-invite">
                <p>Looking for more details? Reach out anytime. <a href="mailto:anthonynarine@anjin.org">anthonynarine@anjin.org</a></p>    
            </div>
            <form onSubmit={sendEmail} className="form">
                <h6 className="from-h6">New Message</h6>
                <input
                    className="form-input"
                    type="email"
                    name="to_email"
                    value={emailDetails.to_email}
                    placeholder="To"
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

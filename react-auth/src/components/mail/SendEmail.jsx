import React, { useState } from "react";
import "./SendEmail.css"; // Make sure this path is correct
import { useNavigate } from "react-router-dom";
import { RiArrowGoBackLine } from 'react-icons/ri';
import { publicAxios } from "../../interceptors/axios";
import { CONTACT_LIMITS, blankFields, contactErrorMessage } from "./contactForm";

const EMPTY = { reply_to: "", subject: "", content: "" };
const LABELS = { reply_to: "Your email", subject: "Subject", content: "Message" };
const REQUIRED = ["reply_to", "subject", "content"];

export const SendEmail = () => {
    const [emailDetails, setEmailDetails] = useState(EMPTY);
    // idle | sending | sent | error
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;
        setEmailDetails({
            ...emailDetails,
            [name]: value,
        });
    };

    const sendEmail = async (event) => {
        event.preventDefault();
        // The browser's "required" check lets a field of only spaces through; this doesn't.
        const blank = blankFields(emailDetails, REQUIRED);
        if (blank.length) {
            setStatus("error");
            setMessage(`Please fill in: ${blank.map((name) => LABELS[name]).join(", ")}.`);
            event.target.elements.namedItem(blank[0])?.focus();
            return;
        }
        setStatus("sending");
        setMessage("");
        try {
            await publicAxios.post("/mail/send-email/", {
                reply_to: emailDetails.reply_to.trim(),
                subject: emailDetails.subject.trim(),
                content: emailDetails.content.trim(),
            });
            setEmailDetails(EMPTY);
            setStatus("sent");
            setMessage("Thanks, your message was sent. We'll reply by email.");
        } catch (error) {
            setStatus("error");
            setMessage(contactErrorMessage(error, LABELS));
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
                <p className="form-hint">All fields are required.</p>
                <input
                    className="form-input"
                    type="email"
                    name="reply_to"
                    aria-label={LABELS.reply_to}
                    value={emailDetails.reply_to}
                    placeholder="Your email"
                    onChange={handleChange}
                    maxLength={CONTACT_LIMITS.reply_to}
                    required
                />
                <input
                    className="form-input"
                    type="text"
                    name="subject"
                    aria-label={LABELS.subject}
                    value={emailDetails.subject}
                    placeholder="Subject"
                    onChange={handleChange}
                    maxLength={CONTACT_LIMITS.subject}
                    required
                />
                <textarea
                    className="form-textarea"
                    name="content"
                    aria-label={LABELS.content}
                    value={emailDetails.content}
                    placeholder="Message"
                    onChange={handleChange}
                    maxLength={CONTACT_LIMITS.content}
                    required
                />
                {status === "sent" && (
                    <p className="form-status" role="status">
                        {message}
                    </p>
                )}
                {status === "error" && (
                    <p className="form-error" role="alert">
                        {message}
                    </p>
                )}
                <button type="submit" className="form-button" disabled={status === "sending"}>
                    {status === "sending" ? "Sending..." : "Send"}
                </button>
            </form>
        </>
    );
};

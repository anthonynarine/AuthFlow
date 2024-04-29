import React, { useEffect, useRef, useState } from "react";
import { showErrorToast } from "../../utils/toastUtils/ToastUtils";
import { useTwoFactorAuth } from "../../hooks/useTwoFactorAuth";
import "./OTPModal.css";

const OTPModal = ({ isOpen, onConfirm, onCancel, onChange, otpValue, twoFactorError }) => {
    const inputRefs = useRef(Array.from({ length: 6 }, () => React.createRef()));
    const [focusedIndex, setFocusedIndex] = useState(null);
    // const { twoFactorError, otpError } = useTwoFactorAuth();

    useEffect(() => {
        console.log("Two-factor authentication error:",twoFactorError); // Check if twoFactorError is not null
        if (twoFactorError) {
            console.log("testing 2fa error from  OTPModal:", twoFactorError)
        }
    }, [twoFactorError]);

    console.log("test", twoFactorError)
    

    if (!isOpen) return null;

    const handleInputChange = (e, index) => {
        const { value } = e.target;
        const newOTPValue = otpValue.substring(0, index) + value + otpValue.substring(index + 1);

        // Call the parent onChange function with the updated OTP value
        onChange({ target: { value: newOTPValue } });

        // Move focus to the next input field if the value is not empty
        if (value && index < 5) {
            inputRefs.current[index + 1].current.focus();
        }
    };

    const handleInputFocus = (index) => {
        setFocusedIndex(index);
    };

    const handleInputBlur = () => {
        setFocusedIndex(null);
    };

    const handleEnterKeyDown = (e, index) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Prevent the default behavior (e.g., form submission)
            onConfirm(); // Call the onConfirm function when the Enter key is pressed
        }
    };

    const handleBackspaceKeyDown = (e, index) => {
        // Move focus to the previous input field on Backspace press if the current input is empty
        if (e.key === "Backspace" && index > 0 && !otpValue[index]) {
            inputRefs.current[index - 1].current.focus();
        }
    };

    return (
        <div className="modal-container">
            <div className="modal-content">
                <div className="modal-header">
                    <h6 className="modal-title">Enter the Password from your authenticator app</h6>
                </div>
                <div className="modal-body">
                    {twoFactorError && (
                            <div className="alert alert-danger">
                                {twoFactorError}
                            </div>
                        )}
                    {/* Render six input fields as squares for each digit */}
                    <div className="otp-input-container">
                        {[...Array(6)].map((_, index) => (
                            <input
                                key={index}
                                type="text"
                                className="otp-input"
                                value={otpValue[index] || ""}
                                onChange={(e) => handleInputChange(e, index)}
                                onKeyDown={(e) => {
                                    handleBackspaceKeyDown(e, index); // Use handleBackspaceKeyDown for Backspace key
                                    handleEnterKeyDown(e, index); // Use handleEnterKeyDown for Enter key
                                }}
                                onFocus={() => handleInputFocus(index)}
                                onBlur={handleInputBlur}
                                maxLength={1} // Limit input to one character
                                placeholder={focusedIndex === index ? "" : "0"}
                                // Placeholder to guide the user
                                ref={inputRefs.current[index]}
                            />
                        ))}
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={onConfirm}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OTPModal;

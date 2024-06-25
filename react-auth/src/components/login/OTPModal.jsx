import React, { useEffect, useRef, useState } from "react";
import "./OTPModal.css";

const OTPModal = ({ isOpen, onConfirm, onCancel, onChange, otpValue, twoFactorError }) => {
    const inputRefs = useRef(Array.from({ length: 6 }, () => React.createRef()));
    const [focusedIndex, setFocusedIndex] = useState(null);

    useEffect(() => {
        console.log("Two-factor authentication error:", twoFactorError);
        if (twoFactorError) {
            console.log("Testing 2FA error from OTPModal:", twoFactorError);
        }
    }, [twoFactorError]);

    if (!isOpen) return null;

    const handleInputChange = (e, index) => {
        const { value } = e.target;
        const newOTPValue = otpValue.substring(0, index) + value + otpValue.substring(index + 1);
        onChange({ target: { value: newOTPValue } });

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

    const handleEnterKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onConfirm();
        }
    };

    const handleBackspaceKeyDown = (e, index) => {
        if (e.key === "Backspace" && index > 0 && !otpValue[index]) {
            inputRefs.current[index - 1].current.focus();
        }
    };

    return (
        <div className="otp-modal">
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
                        <div className="otp-input-container">
                            {[...Array(6)].map((_, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    className="otp-input"
                                    value={otpValue[index] || ""}
                                    onChange={(e) => handleInputChange(e, index)}
                                    onKeyDown={(e) => {
                                        handleBackspaceKeyDown(e, index);
                                        handleEnterKeyDown(e);
                                    }}
                                    onFocus={() => handleInputFocus(index)}
                                    onBlur={handleInputBlur}
                                    maxLength={1}
                                    placeholder={focusedIndex === index ? "" : "0"}
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
        </div>
    );
};

export default OTPModal;


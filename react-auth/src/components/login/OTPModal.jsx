import React from "react";
import { RiCloseLine } from "react-icons/ri"; // Importing React Icons
import "./OTPModal.css";

const OTPModal = ({ isOpen, onConfirm, onCancel, onChange, otpValue }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-container">
            <div className="modal-content">
                <div className="modal-header">
                    <h6 className="modal-title">Enter the Password from your authenticator app</h6>

                </div>
                <div className="modal-body">
                    {/* <p>Enter the One-Time Password from your authenticator app.</p> */}
                    <input
                        type="text"
                        className="otp-input"
                        value={otpValue}
                        onChange={onChange}
                        placeholder="One-Time Password"
                    />
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


import React, { useEffect, useState } from "react";
import { useTwoFactorAuth } from "../../../hooks/useTwoFactorAuth";
import "./QRCodeSetup.css";
import { RiArrowGoBackLine } from 'react-icons/ri';
import { useNavigate } from "react-router-dom"
import  OTPModal  from "../../login/OTPModal";

export const QRCodeSetup = () => {
    const { fetchQRCode, qrCode, verify2FA,} = useTwoFactorAuth();
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otpValue, setOtpValue] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        fetchQRCode();
    }, [fetchQRCode]);

    const toggleModal = () => {
        setOtpModalOpen(!otpModalOpen);
    };

    const handleOtpChange = (event) => {
        setOtpValue(event.target.value);
    };

    const confirmOtp = () => {
        verify2FA(otpValue)
        
    };


    return (
        <div className="qr-container">
            <button  className="nav-button" onClick={()=> navigate("/")} title="Go back to homepage">
                <RiArrowGoBackLine size="1.5em" />
            </button>
            <div className="setup-instructions">
                <h6>Scan the QR code with your authenticator app to obtain a OTP</h6>
                <button className="btn-next" onClick={toggleModal}>Enter OTP</button>
            </div>
            <div className="qr-image-container">
                {qrCode && <img src={qrCode} alt="QR Code for 2FA Setup" className="qr-image" />}
            </div>
            <OTPModal
                isOpen={otpModalOpen}
                onConfirm={confirmOtp}
                onCancel={toggleModal}
                onChange={handleOtpChange}
                otpValue={otpValue}
            />
        </div>
    );
};

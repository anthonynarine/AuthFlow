import React, { useEffect, useState } from "react";
import { useAuthServices } from "../../../context/auth/AuthContext";
import "./QRCodeSetup.css";
import { RiArrowGoBackLine } from 'react-icons/ri';
import { useNavigate } from "react-router-dom"

export const QRCodeSetup = () => {
    const { fetchQRCode, qrCode } = useAuthServices();
    const [step, setStep] = useState(1);

    const navigate = useNavigate();

    useEffect(() => {
        fetchQRCode();
    }, [fetchQRCode]);

    const nextStep = () => {
        setStep(step + 1);
    };


    return (
        <div className="qr-container">
            <button  className="nav-button" onClick={()=> navigate("/")} title="Go back to homepage">
                <RiArrowGoBackLine size="1.5em" />
            </button>
            <div className="setup-instructions">
                <p>Scan the QR code with your authenticator app to obtain an OTP</p>
                <button className="btn-next" onClick={nextStep}>Enter OTP</button>
            </div>
            <div className="qr-image-container">
                {qrCode && <img src={qrCode} alt="QR Code for 2FA Setup" className="qr-image" />}
            </div>
        </div>
    );
};

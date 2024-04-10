import React, { useEffect} from "react"
import { useAuthServices } from "../../../context/auth/AuthContext"
import "./QRCodeSetup.css"

export const QRCodeSetup = () => {

    const {fetchQRCode,qrCode,} = useAuthServices();  

    useEffect(()=>{
        fetchQRCode();
    }, [fetchQRCode]);

    return(
        <div className="qr-container">
            <h2 className="qr-title">Scan this QR Code with your Authenticator App</h2>
            {qrCode && <img src={qrCode} alt="QR Code for 2FA Setup" className="qr-image" />}
        </div>
    )
}
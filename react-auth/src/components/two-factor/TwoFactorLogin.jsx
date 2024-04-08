import React from "react";
import { useLocation } from "react-router-dom"
import { useAuthServices } from "../../context/auth/AuthContext";

const TwoFactorLogin = () => {
    const location = useLocation();
    const email = location.state.email;
    const { verify } = useAuthServices();
}
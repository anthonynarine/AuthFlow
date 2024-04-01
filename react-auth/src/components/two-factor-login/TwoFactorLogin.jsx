import React from "react";
import { useLocation } from "react-router-dom"
import { useAuth } from "../hooks/useAuth";

const TwoFactorLogin = () => {
    const location = useLocation();
    const email = location.state.email;
    const { verify } = useAuth();
}
import "./Login.css";
import authAppImage from "../../assets/auth-app.jpg";
import { Link, useNavigate } from "react-router-dom";
import { RiArrowGoBackLine, RiMailLine, RiLockPasswordLine } from "react-icons/ri";
import { useState, useEffect } from "react";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useTwoFactorAuth } from "../../hooks/useTwoFactorAuth";
import OTPModal from "./OTPModal";
import "./OTPModal.css"


export const LoginPage = () => {

    const [email , setEmail] = useState('')
    const [password , setPassword] = useState('')
    const [otpValue, setOtpValue] = useState("");
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const {  verify2FA, twoFactorError } = useTwoFactorAuth();
    const { login, is2FARequired, error, isLoading } = useBasicAuthServices();
    const navigate = useNavigate();

    // Effect to check if 2FA is required and show OTP modal
    useEffect(() => {
        if(is2FARequired) {
            setOtpModalOpen(is2FARequired);
        }
    }, [is2FARequired])

    // Handler for form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!is2FARequired) {
            await login({ email, password })
        }
    };

    const handleOtpSubmit = async () => {
        await verify2FA(otpValue);
        setOtpModalOpen(false);
    }

    const navigateHome = () => {
        navigate("/");
    };

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };


    return (
        <div className="login-page">
            <div className="login-container">
                <button onClick={navigateHome} className="back-button" title="Go back to homepage">
                    <RiArrowGoBackLine size="1.25em" />
                </button>
                <main className="form-signin">
                    <div className="logo-container">
                        <img src={authAppImage} alt="Auth App" className="login-logo" />
                    </div>
                    <h1 className="login-title">Login</h1>
                    <p className="login-subtitle">Sign in to continue to your account</p>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        {/* Email Input */}
                        <div className="field">
                            <label htmlFor="floatingEmail">Email address</label>
                            <div className="input-wrap">
                                <RiMailLine className="field-icon" aria-hidden="true" />
                                <input
                                    value={email}
                                    type="email"
                                    className="text-input"
                                    id="floatingEmail"
                                    placeholder="name@example.com"
                                    name="email"
                                    autoComplete="email"
                                    onChange={event => setEmail(event.target.value)}
                                />
                            </div>
                        </div>
                        {/* Password Input */}
                        <div className="field">
                            <label htmlFor="floatingPassword">Password</label>
                            <div className="input-wrap">
                                <RiLockPasswordLine className="field-icon" aria-hidden="true" />
                                <input
                                    value={password}
                                    type={passwordVisible ? "text" : "password"}
                                    className="text-input"
                                    id="floatingPassword"
                                    placeholder="Password"
                                    name="password"
                                    autoComplete="current-password"
                                    onChange={event=> setPassword(event.target.value)}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-button"
                                    onClick={togglePasswordVisibility}
                                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                                    >
                                    {passwordVisible ? <RiEyeOffLine /> : <RiEyeLine />}
                                </button>
                            </div>
                        </div>
                        <button className="btn-signin" type="submit" disabled={isLoading}>
                            {isLoading ? "Signing in…" : "Sign in"}
                        </button>
                    </form>
                    <div className="forgot-password-link">
                        <Link to="/forgot-password/">Forgot password?</Link>
                    </div>
                </main>
            </div>
            {is2FARequired && (
                    <OTPModal
                        isOpen={otpModalOpen}
                        onConfirm={handleOtpSubmit}
                        otpValue={otpValue}
                        onCancel={()=> setOtpModalOpen(false)}
                        onChange={(e) => setOtpValue(e.target.value)}
                        twoFactorError={twoFactorError}
                        type="text"
                        className="form-control"
                        id="floatingOTP"
                        placeholder="One-Time Password"
                        name="otp"
                    />
            )}

        </div>
    );
};

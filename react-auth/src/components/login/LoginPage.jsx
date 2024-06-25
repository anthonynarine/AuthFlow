import "./Login.css";
import authAppImage from "../../assets/auth-app.jpg";
import { Link, useNavigate } from "react-router-dom";
import { RiArrowGoBackLine } from "react-icons/ri";
import { useState, useEffect } from "react";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useTwoFactorAuth } from "../../hooks/useTwoFactorAuth";
import OTPModal from "./OTPModal";
import "./OTPModal.css"


export const LoginPage = () => {

    useEffect(() => {
        console.log("🚀 This was my second request to an api I built and deployed 🛠️");
    }, []);

    
    const [email , setEmail] = useState('')
    const [password , setPassword] = useState('')
    const [otpValue, setOtpValue] = useState("");
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const {  verify2FA, twoFactorError } = useTwoFactorAuth();
    const { login, is2FARequired, error, isLoading} = useBasicAuthServices();
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
        <div className="login-container">
            <button onClick={navigateHome} style={{ position: 'absolute', top: 0, left: 0, margin: '20px', background: 'none', color: "#D3D3D3", border: 'none', cursor: 'pointer' }}
                    title="Go back to homepage">
                <RiArrowGoBackLine size="1.5em" />
            </button>
            <main className="form-signin w-100 m-auto">
                <form onSubmit={handleSubmit}>
                    <div className="logo-container">
                        <img src={authAppImage} alt="Auth App" className="login-logo" />
                    </div>
                    <h1 className="h3 mb-4 fw-normal">Login</h1>
                    {error && <div className="alert alert-danger">{error}</div>}
                    {/* Email Input */}
                    <div className="form-floating mb-3">
                        <input value={email} type="email" className="form-control" id="floatingEmail" placeholder="name@example.com" name="email"
                            onChange={event => setEmail(event.target.value)}
                        />
                        <label htmlFor="floatingEmail">Email address</label>
                    </div>
                    {/* Password Input */}
                    <div className="form-floating mb-4">
                        <input value={password}  type={passwordVisible ? "text" : "password"} className="form-control" id="floatingPassword" placeholder="Password" name="password"
                            onChange={event=> setPassword(event.target.value)}
                        />
                        <label htmlFor="floatingPassword">Password</label>
                        <button
                            type="button"
                            className="password-toggle-button"
                            onClick={togglePasswordVisibility}
                            style={{ border: 'none', background: 'transparent' }}
                            aria-label={passwordVisible ? "Hide password" : "Show password"}  // Accessibility improvement
                            >
                            {passwordVisible ? <RiEyeOffLine /> : <RiEyeLine />}
                        </button>
                    </div>
                    <div><button className="btn btn-signin w-100" type="submit">Submit</button></div>
                </form>
                <div className="forgot-password-link">
                    <Link style={{  color: "#30815e"}} to="/forgot-password/">Forgot password</Link>
                </div>
            </main>
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

import "./Login.css";
import authAppImage from "../../assets/auth-app.jpg";
import { Link, useNavigate } from "react-router-dom";
import { RiArrowGoBackLine } from "react-icons/ri";
// import API from "../../interceptors/axios";
import { useState, useEffect } from "react";
import axios from "axios";
// import API from "../../interceptors/axios";
import Cookies from "js-cookie";
import axiosAPIinterceptor from "../../interceptors/axios";
import { useAuth } from "../hooks/useAuth";


export const LoginPage = () => {
    useEffect(() => {
        console.log("🚀 This was my second request to an api I built and deployed 🛠️");
    }, []);

    
    const [email , setEmail] = useState('')
    const [password , setPassword] = useState('')
    const [otp, setOtp] = useState("");

    const { login, verify2FA, is2FARequired, setIs2FARequired } = useAuth();
    const navigate = useNavigate();

    // Handler for form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!is2FARequired) {
            login({ email, password })
        } else {
            verify2FA({ otp })
        }  
    };

    const navigateHome = () => {
        navigate("/");
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
                    {/* Email Input */}
                    <div className="form-floating mb-3">
                        <input value={email} type="email" className="form-control" id="floatingEmail" placeholder="name@example.com" name="email"
                            onChange={event => setEmail(event.target.value)}
                        />
                        <label htmlFor="floatingEmail">Email address</label>
                    </div>
                    {/* Password Input */}
                    <div className="form-floating mb-4">
                        <input value={password}  type="password" className="form-control" id="floatingPassword" placeholder="Password" name="password"
                            onChange={event=> setPassword(event.target.value)}
                        />
                        <label htmlFor="floatingPassword">Password</label>
                    </div>
                    <button className="btn btn-signin w-100" type="submit">Submit</button>
                </form>
                <div className="forgot-password-link">
                    <Link style={{  color: "#30815e"}} to="/forgot-password/">Forgot password</Link>
                </div>
            </main>
            {is2FARequired && (
                <div className="form-floating mb-4">
                    <input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        type="text"
                        className="form-control"
                        id="floatingOTP"
                        placeholder="One-Time Password"
                        name="otp"
                    />
                    <label htmlFor="floatingOTP">One-Time Password</label>
            </div>
            )}
            
        </div>
    );
};

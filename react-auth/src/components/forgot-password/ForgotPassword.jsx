import "../login/Login.css";
import authAppImage from "../../assets/auth-app.jpg";
import { Link, useNavigate } from "react-router-dom";
import { RiArrowGoBackLine } from "react-icons/ri";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";


export const ForgotPassword = () => {

    const [email , setEmail] = useState('')
    const { forgotPassword, message } =useAuth()
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        await forgotPassword(email);
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
                    <h1 className="h3 mb-4 fw-normal">Reset Password</h1>
                    {/* Email Input */}
                    <div className="form-floating mb-3">
                        <input value={email} type="email" className="form-control" id="floatingEmail" placeholder="name@example.com" name="email"
                            onChange={event => setEmail(event.target.value)}
                        />
                        <label htmlFor="floatingEmail">Email address</label>
                    </div>
                    <button className="btn btn-signin w-100" type="submit">Submit</button>
                </form>
                {message}
            </main>
        </div>
    );
};

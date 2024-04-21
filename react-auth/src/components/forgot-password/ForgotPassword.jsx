import "../login/Login.css";
import authAppImage from "../../assets/auth-app.jpg";
import { useNavigate } from "react-router-dom";
import { RiArrowGoBackLine } from "react-icons/ri";
import { useState } from "react";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./ForgotPassword.css"


export const ForgotPassword = () => {

    const [email , setEmail] = useState('')
    const { forgotPassword } =useBasicAuthServices()
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            await forgotPassword(email);
            toast.success('Check your email for the password reset link.', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } catch (error) {
            toast.error('Failed to send password reset email.', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
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
                    <div className="password-reset-heading">
                        <h1 className="h3 mb-4 fw-normal">Forgot Password?</h1>
                        <p className="reset-instructions">Enter your email below to reset your password.</p>
                    </div>
                    {/* Email Input */}
                    <div className="form-floating mb-3">
                        <input value={email} type="email" className="form-control" id="floatingEmail" placeholder="name@example.com" name="email"
                            onChange={event => setEmail(event.target.value)}
                        />
                        <label htmlFor="floatingEmail">Email address</label>
                    </div>
                    <button className="btn btn-signin w-100" type="submit">Submit</button>
                </form>
                <ToastContainer />
            </main>
        </div>
    );
};

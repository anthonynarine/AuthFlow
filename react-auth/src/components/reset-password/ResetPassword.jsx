import "../login/Login.css";
import authAppImage from "../../assets/auth-app.jpg";
import { useNavigate, useParams } from "react-router-dom";
import { RiArrowGoBackLine, RiLockPasswordLine } from "react-icons/ri";
import { useState } from "react";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext"
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils/ToastUtils";

export const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [validationError, setValidationError] = useState("");
    const navigate = useNavigate();
    const { uidb64, token } = useParams();
    const { resetPassword } = useBasicAuthServices(); // Assume markAsSubmitted's logic is handled within resetPassword


    const handleSubmit = async (event) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            setValidationError("Passwords don't match.");
            return;
        }
        try {
            await resetPassword({ password, confirmPassword, uidb64, token });
            showSuccessToast('Password reset successful!');
            setTimeout(() => navigate("/login"), 2000); // Redirect after showing success message
        } catch (error) {
            showErrorToast("Failed to reset password. Please try again.");
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <button onClick={() => navigate("/")} className="back-button" title="Go back to homepage">
                    <RiArrowGoBackLine size="1.25em" />
                </button>
                <main className="form-signin">
                    <div className="logo-container">
                        <img src={authAppImage} alt="Auth App" className="login-logo" />
                    </div>
                    <h1 className="login-title">Reset Password</h1>
                    <p className="login-subtitle">Choose a new password for your account</p>
                    {validationError && <div className="alert alert-danger">{validationError}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="field">
                            <label htmlFor="newPassword">New Password</label>
                            <div className="input-wrap">
                                <RiLockPasswordLine className="field-icon" aria-hidden="true" />
                                <input
                                    type="password"
                                    value={password}
                                    className="text-input"
                                    id="newPassword"
                                    autoComplete="new-password"
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="field">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="input-wrap">
                                <RiLockPasswordLine className="field-icon" aria-hidden="true" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    className="text-input"
                                    id="confirmPassword"
                                    autoComplete="new-password"
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <button className="btn-signin" type="submit">Submit</button>
                    </form>
                </main>
            </div>
            <ToastContainer />
        </div>
    );
};



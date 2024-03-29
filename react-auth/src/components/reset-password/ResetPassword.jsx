import "../login/Login.css";
import authAppImage from "../../assets/auth-app.jpg";
import { useNavigate, useParams } from "react-router-dom";
import { RiArrowGoBackLine } from "react-icons/ri";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [validationError, setValidationError] = useState("");
    const navigate = useNavigate();
    const { uidb64, token } = useParams();
    const { resetPassword } = useAuth(); // Assume markAsSubmitted's logic is handled within resetPassword

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            setValidationError("Passwords don't match.");
            return;
        }

        try {
            await resetPassword({ password, confirmPassword, uidb64, token });
            toast.success('Password reset successful!', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setTimeout(() => navigate("/login"), 3000); // Redirect after showing success message
        } catch (error) {
            toast.error("Failed to reset password. Please try again.");
        }
    };

    return (
        <div className="login-container">
        <button onClick={()=> navigate("/")} style={{ position: 'absolute', top: 20, left: 0, margin: '20px', background: 'none', color: "white", border: 'none', cursor: 'pointer' }}
              title="Go back to homepage">
        <RiArrowGoBackLine size="1.5em" style={{ color: "white"}} />
      </button>
            <main className="form-signin w-100 m-auto">
                <form onSubmit={handleSubmit}>
                    <div className="logo-container">
                        <img src={authAppImage} alt="Auth App" className="login-logo" />
                    </div>
                    <h1 className="h3 mb-4 fw-normal">Reset Password</h1>
                    <div className="form-floating mb-3">
                        <input type="password" value={password} className="form-control" id="newPassword" 
                            onChange={e => setPassword(e.target.value)} required />
                        <label htmlFor="newPassword">New Password</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input type="password" value={confirmPassword} className="form-control" id="confirmPassword" 
                            onChange={e => setConfirmPassword(e.target.value)} required />
                        <label htmlFor="confirmPassword">Confirm Password</label>
                    </div>
                    {validationError && <div className="alert alert-danger" role="alert">{validationError}</div>}
                    <button className="btn btn-signin w-100" type="submit">Submit</button>
                </form>
            </main>
            <ToastContainer />
        </div>
    );
};

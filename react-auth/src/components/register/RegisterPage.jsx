import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../login/Login.css";
import authAppImage from "../../assets/auth-app.jpg";
import { RiArrowGoBackLine, RiEyeLine, RiEyeOffLine } from "react-icons/ri";

export const RegisterPage = () => {
    const [formFields, setFormFields] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("🚀 First request to an API I built and deployed 🛠️");
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormFields(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            await axios.post("http://localhost:8000/api/register/", {
                first_name: formFields.firstName,
                last_name: formFields.lastName,
                email: formFields.email,
                password: formFields.password,
                password_confirm: formFields.confirmPassword,
            });
            navigate("/login");
        } catch (error) {
            const message = error.response ? error.response.data.error : "Registration failed. Please try again later";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const toggleConfirmPasswordVisibility = () => {
        setConfirmPasswordVisible(!confirmPasswordVisible);
    };

    return (
        <div className="login-container">
            {/* Navigation button to home */}
            <button onClick={() => navigate("/")} 
                    style={{ position: 'absolute', top: 0, left: 0, margin: '20px', background: 'none', color: "#fff", border: 'none', cursor: 'pointer' }}
                    title="Go back to homepage">
                <RiArrowGoBackLine size="1.5em" />
            </button>
            {/* Main form container */}
            <main className="form-signin w-100 m-auto">
                <form onSubmit={handleSubmit}>
                    {/* Logo display */}
                    <div className="logo-container">
                        <img src={authAppImage} alt="Auth App" className="login-logo" />
                    </div>
                    <h1 className="h3 mb-4 fw-normal">Register</h1>
                    {/* Error display section */}
                    {error && <div className="alert alert-danger" role="alert">{error}</div>}
                    {/* Conditional loading message */}
                    {isLoading && <div>Loading...</div>}
                    {/* Form fields */}
                    <div className="form-floating mb-3">
                        <input type="text" className="form-control" id="floatingFirstName" placeholder="First Name" name="firstName" value={formFields.firstName} onChange={handleChange} />
                        <label htmlFor="floatingFirstName">First Name</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input type="text" className="form-control" id="floatingLastName" placeholder="Last Name" name="lastName" value={formFields.lastName} onChange={handleChange} />
                        <label htmlFor="floatingLastName">Last Name</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input type="email" className="form-control" id="floatingEmail" placeholder="name@example.com" name="email" value={formFields.email} onChange={handleChange} />
                        <label for="floatingEmail">Email</label>
                    </div>
                    <div className="form-floating mb-4">
                        <input type={passwordVisible ? "text" : "password"} className="form-control" id="floatingPassword" placeholder="Password" name="password" value={formFields.password} onChange={handleChange} />
                        <label htmlFor="floatingPassword">Password</label>
                        <button type="button" onClick={togglePasswordVisibility} className="password-toggle-button" aria-label={passwordVisible ? "Hide password" : "Show password"} style={{ border: 'none', background: 'transparent' }}>
                            {passwordVisible ? <RiEyeOffLine /> : <RiEyeLine />}
                        </button>
                    </div>
                    <div className="form-floating mb-4">
                        <input type={confirmPasswordVisible ? "text" : "password"} className="form-control" id="floatingConfirmPassword" placeholder="Confirm Password" name="confirmPassword" value={formFields.confirmPassword} onChange={handleChange} />
                        <label htmlFor="floatingConfirmPassword">Confirm Password</label>
                        <button type="button" onClick={toggleConfirmPasswordVisibility} className="password-toggle-button" aria-label={confirmPasswordVisible ? "Hide password" : "Show password"} style={{ border: 'none', background: 'transparent' }}>
                            {confirmPasswordVisible ? <RiEyeOffLine /> : <RiEyeLine />}
                        </button>
                    </div>
                    {/* Submit button */}
                    <button type="submit" disabled={isLoading} className="btn btn-signin w-100">
                        {isLoading ? 'Registering...' : 'Register'}
                    </button>
                </form>
            </main>
        </div>
    );
};

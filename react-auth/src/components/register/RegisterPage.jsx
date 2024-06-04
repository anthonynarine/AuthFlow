import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./RegisterPage.css"
import authAppImage from "../../assets/auth-app.jpg";
import { RiArrowGoBackLine, RiEyeLine, RiEyeOffLine } from "react-icons/ri";

// Development and production base URLs
const DEV_URL = "http://localhost:8000/api/register/";
const PRODUCTION_URL = "https://ant-django-auth-62cf01255868.herokuapp.com/api/register/";

export const RegisterPage = () => {
    const [formFields, setFormFields] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState('');
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
        setErrors("");
        setIsLoading(true);
        try {
            await axios.post(DEV_URL, {
                first_name: formFields.firstName,
                last_name: formFields.lastName,
                email: formFields.email,
                password: formFields.password,
                password_confirm: formFields.confirmPassword,
            });
            navigate("/login");
        } catch (error) {
            if (error.response && error.response.data.error){
                // errors are keyed for request sent to RegisterAPIView
                setErrors(error.response.data.error); 
            } else {
                setErrors({general: "Registration failed. Please try again later"});
            }
            console.log(error);
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
        <div className="register-container">
        {/* Navigation button to go back to the homepage */}
        <button onClick={() => navigate("/")} 
            className="nav-button" 
            style={{ position: 'absolute', top: 0, left: 0, margin: '20px', background: 'none', color: "#fff", border: 'none', cursor: 'pointer' }}
            title="Go back to homepage">
            <RiArrowGoBackLine size="1.5em" />
        </button>

        {/* Main form area */}
        <main className="form-register w-100 m-auto">
            <form onSubmit={handleSubmit}>
                {/* Logo display area */}
                <div className="logo-container">
                    <img src={authAppImage} alt="Auth App" className="register-logo" />
                </div>
                
                {/* Form header */}
                <h1 className="h3 mb-4 fw-normal">Register</h1>

                {/* Centralized error display */}
                {Object.keys(errors).length > 0 && (
                    <div className="alert alert-danger">
                        {Object.values(errors).map((value, index) => (
                            <p key={index}>{value}</p> // Use index as key since field names are not used
                        ))}
                    </div>
                )}

                {/* First Name Input Field */}
                <div className="form-floating mb-3">
                    <input type="text" className="form-control" id="floatingFirstName" placeholder="First Name" name="firstName" value={formFields.firstName} onChange={handleChange} />
                    <label htmlFor="floatingFirstName">First Name</label>
                </div>

                {/* Last Name Input Field */}
                <div className="form-floating mb-3">
                    <input type="text" className="form-control" id="floatingLastName" placeholder="Last Name" name="lastName" value={formFields.lastName} onChange={handleChange} />
                    <label htmlFor="floatingLastName">Last Name</label>
                </div>

                {/* Email Input Field */}
                <div className="form-floating mb-3">
                    <input type="email" className="form-control" id="floatingEmail" placeholder="name@example.com" name="email" value={formFields.email} onChange={handleChange} />
                    <label htmlFor="floatingEmail">Email</label>
                </div>

                {/* Password Input Field */}
                <div className="form-floating mb-3">
                    <input type={passwordVisible ? "text" : "password"} className="form-control" id="floatingPassword" placeholder="Password" name="password" value={formFields.password} onChange={handleChange} />
                    <label htmlFor="floatingPassword">Password</label>
                    <button type="button" onClick={togglePasswordVisibility} className="password-toggle-button" aria-label={passwordVisible ? "Hide password" : "Show password"}>
                        {passwordVisible ? <RiEyeOffLine /> : <RiEyeLine />}
                    </button>
                </div>

                {/* Confirm Password Input Field */}
                <div className="form-floating mb-3">
                    <input type={confirmPasswordVisible ? "text" : "password"} className="form-control" id="floatingConfirmPassword" placeholder="Confirm Password" name="confirmPassword" value={formFields.confirmPassword} onChange={handleChange} />
                    <label htmlFor="floatingConfirmPassword">Confirm Password</label>
                    <button type="button" onClick={toggleConfirmPasswordVisibility} className="password-toggle-button" aria-label={confirmPasswordVisible ? "Hide password" : "Show password"}>
                        {confirmPasswordVisible ? <RiEyeOffLine /> : <RiEyeLine />}
                    </button>
                </div>

                {/* Submit Button */}
                <button type="submit" disabled={isLoading} className="btn btn-register w-100">
                    {isLoading ? 'Registering...' : 'Register'}
                </button>
            </form>
        </main>
    </div>
    );
};

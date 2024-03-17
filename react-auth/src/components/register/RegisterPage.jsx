// Import statements
import "../login/Login.css";
import authAppImage from "../../assets/auth-app.jpg";
import { useNavigate } from "react-router-dom";
import { RiArrowGoBackLine } from "react-icons/ri";
import { useState, useEffect } from "react";
import axios from "axios";

export const RegisterPage = () => {
    useEffect(() => {
        console.log("🚀 This was my first request to an api I built and deployed 🛠️");
    }, []);
    // State to hold form fields
    const [formFields, setFormFields] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    // Hook to navigate programmatically
    const navigate = useNavigate();

    // Handler for form field changes
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormFields(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Handler for form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            // Attempt to register the user with the provided data THATS'S MY FIRST LIVE API !!!!!
            await axios.post("http://ant-django-auth-62cf01255868.herokuapp.com/api/register/", {
                first_name: formFields.firstName,
                last_name: formFields.lastName,
                email: formFields.email,
                password: formFields.password,
                password_confirm: formFields.confirmPassword,
            });
            // On success, navigate to the login page
            navigate("/login");
        } catch (error) {
            // Log any error that occurs during the registration process
            console.error("Registration error:", error);
        }
    };

    // Handler to navigate back to the homepage
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
                    <h1 className="h3 mb-4 fw-normal">Test Registration</h1>
                    {/* First Name Input */}
                    <div className="form-floating mb-3">
                        <input value={formFields.firstName} onChange={handleChange} type="text" className="form-control" id="floatingFirstName" placeholder="First Name" name="firstName" />
                        <label htmlFor="floatingFirstName">First Name</label>
                    </div>
                    {/* Last Name Input */}
                    <div className="form-floating mb-3">
                        <input value={formFields.lastName} onChange={handleChange} type="text" className="form-control" id="floatingLastName" placeholder="Last Name" name="lastName" />
                        <label htmlFor="floatingLastName">Last Name</label>
                    </div>
                    {/* Email Input */}
                    <div className="form-floating mb-3">
                        <input value={formFields.email} onChange={handleChange} type="email" className="form-control" id="floatingEmail" placeholder="name@example.com" name="email" />
                        <label htmlFor="floatingEmail">Email address</label>
                    </div>
                    {/* Password Input */}
                    <div className="form-floating mb-4">
                        <input value={formFields.password} onChange={handleChange} type="password" className="form-control" id="floatingPassword" placeholder="Password" name="password" />
                        <label htmlFor="floatingPassword">Password</label>
                    </div>
                    {/* Confirm Password Input */}
                    <div className="form-floating mb-4">
                        <input value={formFields.confirmPassword} onChange={handleChange} type="password" className="form-control" id="floatingConfirmPassword" placeholder="Confirm Password" name="confirmPassword" />
                        <label htmlFor="floatingConfirmPassword">Confirm Password</label>
                    </div>
                    <button className="btn btn-signin w-100" type="submit">Register</button>
                </form>
            </main>
        </div>
    );
};

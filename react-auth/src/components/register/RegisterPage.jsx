import "../login/Login.css";
import authAppImage from "../../assets/auth-app.jpg";
import { useNavigate } from "react-router-dom";
import { RiArrowGoBackLine } from "react-icons/ri";
import { useState, useEffect } from "react";
import axios from "axios";

export const RegisterPage = () => {
    useEffect(() => {
        console.log("🚀 This was my first request to an API I built and deployed 🛠️");
    }, []);

    const [formFields, setFormFields] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const navigate = useNavigate();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormFields(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
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
            console.error("Registration error:", error);
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
                    <h1 className="h3 mb-4 fw-normal">Test Registration</h1>
                    {/* Corrected Labels and Inputs */}
                    <div className="form-floating mb-3">
                        <input type="text" value={formFields.firstName} onChange={handleChange} className="form-control" id="floatingFirstName" placeholder="First Name" name="firstName" />
                        <label htmlFor="floatingFirstName">First Name</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input type="text" value={formFields.lastName} onChange={handleChange} className="form-control" id="floatingLastName" placeholder="Last Name" name="lastName" />
                        <label htmlFor="floatingLastName">Last Name</label>
                    </div>
                    {/* Email Input Correction */}
                    <div className="form-floating mb-3">
                        <input type="email" value={formFields.email} onChange={handleChange} className="form-control" id="floatingEmail" placeholder="name@example.com" name="email" />
                        <label htmlFor="floatingEmail">Email</label>
                    </div>
                    <div className="form-floating mb-4">
                        <input type="password" value={formFields.password} onChange={handleChange} className="form-control" id="floatingPassword" placeholder="Password" name="password" />
                        <label htmlFor="floatingPassword">Password</label>
                    </div>
                    <div className="form-floating mb-4">
                        <input type="password" value={formFields.confirmPassword} onChange={handleChange} className="form-control" id="floatingConfirmPassword" placeholder="Confirm Password" name="confirmPassword" />
                        <label htmlFor="floatingConfirmPassword">Confirm Password</label>
                    </div>
                    <button className="btn btn-signin w-100" type="submit">Register</button>
                </form>
            </main>
        </div>
    );
};

import "../login/Login.css";
import { useNavigate } from "react-router-dom";
import { RiArrowGoBackLine } from "react-icons/ri";
import { useState, useEffect } from "react";
import axios from "axios";
import { CgUserAdd } from "react-icons/cg";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";


export const RegisterPage = () => {

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    useEffect(() => {
        console.log("🚀 This was my first request to an API I built and deployed 🛠️");
    }, []);

    const [formFields, setFormFields] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const navigate = useNavigate();

    const handleChange = (event) => {
        const { name, type } = event.target;
        const value = type === "checkbox" ? event.target.checked : event.target.value
        setFormFields(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            console.log(formFields)
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


    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };
    
    const toggleConfirmPasswordVisibility = () => {
        setConfirmPasswordVisible(!confirmPasswordVisible);
    };
    

    return (
        <div className="login-container">
            <button onClick={navigateHome} style={{ position: 'absolute', top: 0, left: 0, margin: '20px', background: 'none', color: "#fff", border: 'none', cursor: 'pointer' }}
                    title="Go back to homepage">
                <RiArrowGoBackLine size="1.5em" />
            </button>
            <main className="form-signin w-100 m-auto">
                <form onSubmit={handleSubmit}>
                    <div className="logo-container">
                        {/* <img src={authAppImage} alt="Auth App" className="login-logo" /> */}
                        {/* <RiUserAddLine size={"1.5rem"} /> */}
                        {/* <GrUserAdd size={"1.5rem"} /> */}
                        <CgUserAdd size={"2.5rem"} />
                        {/* <FaPlusCircle size={"3.0rem"} /> */}
                    </div>
                    <h1 className="h3 mb-4 fw-normal">Register</h1>
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
                        <input type={passwordVisible ? "text" : "password"} value={formFields.password} onChange={handleChange} className="form-control" id="floatingPassword" placeholder="Password" name="password" />
                        <label htmlFor="floatingPassword">Password</label>
                        <button
                            type="button"
                            className="password-toggle-button"
                            onClick={togglePasswordVisibility}
                            aria-label={passwordVisible ? "Hide password" : "Show password"}
                            style={{ border: 'none', background: 'transparent' }}
                        >
                            {passwordVisible ? <RiEyeOffLine /> : <RiEyeLine />}
                        </button>
                    </div>
                    <div className="form-floating mb-4">
                        <input type={confirmPasswordVisible ? "text" : "password"} value={formFields.confirmPassword} onChange={handleChange} className="form-control" id="floatingConfirmPassword" placeholder="Confirm Password" name="confirmPassword" />
                        <label htmlFor="floatingConfirmPassword">Confirm Password</label>
                        <button
                            type="button"
                            className="password-toggle-button"
                            onClick={toggleConfirmPasswordVisibility}
                            aria-label={confirmPasswordVisible ? "Hide password" : "Show password"}
                            style={{ border: 'none', background: 'transparent' }}
                        >
                            {confirmPasswordVisible ? <RiEyeOffLine /> : <RiEyeLine />}
                        </button>
                    </div>
                    {/* <div className="form-check mb-4">
                        <input type="checkbox" className="form-check-input" id="enable2FA" name="enable2FA" checked={formFields.enable2FA} onChange={handleChange} />
                        <label className="form-check-label" htmlFor="enable2FA">Enable Two-Factor Authentication</label>
                    </div> */}
                    <button className="btn btn-signin w-100" type="submit">Submit</button>               
                </form>
            </main>
        </div>
    );
};

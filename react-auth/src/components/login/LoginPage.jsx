import "./Login.css";
import authAppImage from "../../assets/auth-app.jpg";
import { useNavigate } from "react-router-dom";
import { RiArrowGoBackLine } from "react-icons/ri";
// import API from "../../interceptors/axios";
import { useState, useEffect } from "react";
import axios from "axios";
// import API from "../../interceptors/axios";


export const LoginPage = () => {
    useEffect(() => {
        console.log("🚀 This was my second request to an api I built and deployed 🛠️");
    }, []);
    // State to hold form fields
    const [email , setEmail] = useState('')
    const [password , setPassword] = useState('')

    // Hook to navigate programmatically
    const navigate = useNavigate();

    // Handler for form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            // Attempt to register the user with the provided data THATS'S MY FIRST LIVE API !!!!!
            const { data } = await axios.post("login/", {
                email,
                password,
            }, { withCredentials: true }); // if added will allow http cookie to be stored.

            // After login, set the Authorization header for subsequent requests
            // Note: Since your API instance interceptor might already handle setting the token,
            // you may not need to do this here unless you want to perform immediate actions with the token
            axios.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;
            console.log(data)
            // On success, navigate home page
            navigate("/");
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
                    <h1 className="h3 mb-4 fw-normal">Test Login</h1>
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
                    <button className="btn btn-signin w-100" type="submit">Login</button>
                </form>
            </main>
        </div>
    );
};

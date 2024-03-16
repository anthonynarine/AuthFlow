import "./Login.css";
import authAppImage from "../../assets/auth-app.jpg";
import { useNavigate } from "react-router-dom";
import { RiArrowGoBackLine } from "react-icons/ri";

export const LoginPage = () => {
    const navigate = useNavigate();

    const navigateHome = () => {
        navigate("/");
    };

    return (
        <div className="login-container">
            <button onClick={navigateHome} style={{position: 'absolute', top: 0, left: 0, margin: '20px', background: 'none', color: "#D3D3D3", border: 'none', cursor: 'pointer'}}
                    title="Go back to homepage"> 
                <RiArrowGoBackLine size="1.5em"/> 
            </button>
            <main className="form-signin w-100 m-auto">
                <form>
                    <div className="logo-container">
                        <img src={authAppImage} alt="Auth App" className="login-logo"/>
                    </div>
                    <h1 className="h3 mb-4 fw-normal">Test Sign in</h1>

                    <div className="form-floating mb-3">
                        <input type="email" className="form-control" id="floatingInput" placeholder="name@example.com" />
                        <label htmlFor="floatingInput">Email address</label>
                    </div>
                    <div className="form-floating mb-4">
                        <input type="password" className="form-control" id="floatingPassword" placeholder="Password" />
                        <label htmlFor="floatingPassword">Password</label>
                    </div>
                    <button className="btn btn-signin w-100" type="submit">Sign in</button>
                </form>
            </main>
        </div>
    );
};

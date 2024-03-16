import React from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate()
  const handleRegister = () => {
    navigate("/Register")
  };

  const handleLogin = () => {
    navigate("/login")
  };

  const handleLogout = () => {
  };

  return (
    <div className="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
      {/* Header */}
      <header className="mb-auto">
        <div className="header-container">
          <h3 className="mb-0 white-text">Authentication</h3>
          <nav className="nav nav-masthead justify-content-center">
            <a
              className="nav-link fw-bold py-1 px-3 active white-text"
              aria-current="page"
              href="#"
            >
              Home
            </a>
            <a className="nav-link fw-bold py-1 px-3 white-text" href="#">
              Features
            </a>
            <a className="nav-link fw-bold py-1 px-3 white-text" href="#">
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-3 main-container centered-paragraph">
        <h1 className="white-text">API Overview</h1>
        <p className="lead white-text">
          This application encompasses all endpoints related to managing
          user authentication and account operations. It covers
          user registration, login processes, token refresh, user data access with a
          token, and account recovery options like password reset.
        </p>

        {/* Buttons for API testing */}
        <div className="mt-4">
        <button className="btn btn-custom-color me-2" onClick={handleRegister}>
            Register
          </button>
          <button className="btn btn-custom-color me-2" onClick={handleLogin}>
            Login
          </button>
          <button className="btn btn-custom-color me-2" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto text-white-50 footer-container">
        <p>
          <a
            href="https://documenter.getpostman.com/view/23868442/2sA2xmUqQd"
            className="text-white"
          >
            <i className="fas fa-book"></i> Postman Documentation
          </a>
        </p>
      </footer>
    </div>
  );
}

export default HomePage;

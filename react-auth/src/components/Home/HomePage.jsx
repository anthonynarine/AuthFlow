import React, { useState, useEffect, useCallback } from "react";
import "./Home.css";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Footer } from "../footer/Footer";
import { DropdownMenu } from "./dropdownMenu/DropdownMenu";

function HomePage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdownMenu = () => {
    console.log("drawer toggled")
    setIsDropdownOpen(!isDropdownOpen);
  };


  const { logout, getUser, message } = useAuth();

  useEffect(() => {
    getUser();
  }, [getUser]); // Pass `getUser` if it's guaranteed to be stable or memoized

  // useCallback for event handlers
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <div className="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
      <header className="mb-auto">
        <div className="header-container">
          <h3 className="mb-0 white-text">Authentication</h3>
          <nav className="nav nav-masthead justify-content-center">
            <Link to="/features" className="nav-link fw-bold py-1 px-3 white-text">Home</Link>
            <DropdownMenu isOpen={isDropdownOpen} toggleDropdownMenu={toggleDropdownMenu} />
            <Link to="/send-email" className="nav-link fw-bold py-1 px-3 white-text">Contact</Link>
          </nav>
        </div>
      </header>

      <main className="px-3 main-container centered-paragraph">
        <div className="intro-container">
          <h4 className="white-text">App Overview</h4>
          <p className="intro-container">
            This application is designed to provide a robust, secure, and user-friendly authentication system. Integrating backend technologies with a seamless frontend experience, it’s crafted for those who value both security and ease of use. This platform offers a comprehensive set of authentication features, including user registration, login processes, password reset capabilities, and optional two-factor authentication. Behind every feature lies a robust backend built with Django and DRF, adhering to RESTful standards and secured with PyJWT for token creation. On the frontend, Axios interceptors streamline the login process, managing authentication tokens efficiently to ensure a smooth user experience. This system is crafted for those looking to explore a full-stack project that prioritizes security without compromising on user experience. Whether you're safeguarding personal projects or seeking inspiration for reliable login systems, this platform showcase the powerful synergy between a Django backend and a React frontend.
          </p>
        </div>
        <div className="mt-4">
          <Link to="/register" className="btn btn-custom-color me-2">Register</Link>
          <Link to="/login" className="btn btn-custom-color me-2">Login</Link>
          <button className="btn btn-custom-color me-2" onClick={handleLogout}>Logout</button>
        </div>
        <div className="message">
          {message}
          <span className="blinking-dot">.</span> 
          <span className="blinking-dot">.</span>
        </div>
      </main>


    </div>
  );
}

export default HomePage;

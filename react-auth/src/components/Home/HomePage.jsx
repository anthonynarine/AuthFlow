import React, { useState, useEffect, useRef } from "react";
import "./Home.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuthServices } from "../../context/auth/AuthContext";
import { Footer } from "../footer/Footer";
import { DropdownMenu } from "./dropdownMenu/DropdownMenu";
import { FiKey } from 'react-icons/fi';
import { FaReact } from 'react-icons/fa'; // For the React icon
import { DiPython } from 'react-icons/di'; // Example using a Python icon for Django
import { FiMail } from 'react-icons/fi';
import { GiHouseKeys } from "react-icons/gi";



function HomePage() {
  // const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // const toggleDropdownMenu = () => {
  //   console.log("drawer toggled");
  //   setIsDropdownOpen(!isDropdownOpen);
  // };

  const { logout, validateSession, user, message, isLoggedIn, toggle2fa, } = useAuthServices();
  const navigate = useNavigate();
  console.log({isLoggedIn})

  useEffect(() => {
    validateSession();
  }, [validateSession]); // Pass `validateSession` if it's guaranteed to be stable or memoized

  const handleLogout = () => {
    logout();
  };

  const handleToggle2FA = async () => {
    if (!user) {
      console.log("User is not defined")
      return;
    }

    // Initially capture the current 2FA status before attempting to toggle
    const current2FAStatus = useRef(user?.is_2fa_enabled);

    try {
      // Attempt to toggele 2FA by calling the "toggle2fa" function
      // This will send the request to the server to update the user's 2FA status
      await toggle2fa(!user.is_2fa_enabled);
      // Check the new 2FA stats after the toggle operation
      if (user.is_2fa_enabled !== current2FAStatus) {
        // if the 2FA status has changed navigate accordingly
        if (user.is_2fa_enabled) {
          console.log("Navigating to /setup-2fa because 2FA was enabled");
          navigate("/setup-2fa");
        } else {
          console.log("2FA has been disabled")
        }
      }
    } catch (error) {
      console.error("Error toggling 2FA", error)
    }
  };



  return (
    <div className="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
      <header className="mb-auto">
        <div className="header-container">
          <h3 className="mb-0 white-text"><FiKey/>Gait</h3>
          <nav className="nav nav-masthead justify-content-center">
            <Link to="/react-features" className="icon react-icon"><FaReact size={24}/></Link>
            <Link to="/react-features" className="icon django-icon"><DiPython size={30}/></Link>
            <Link to="/send-email" className="icon contact-icon"><FiMail size={25}/></Link>
            {/* <DropdownMenu isOpen={isDropdownOpen} toggleDropdownMenu={toggleDropdownMenu} /> */}
          </nav>
        </div>
      </header>
      <main className="px-3 main-container centered-paragraph">
        <div className="auth-section mt-4">
          <h5 className="text-center mb-3 white-text">Explore the Authentication system</h5>
          <div className="message">
            {message}
            {/* Optionally include blinking dots here if they serve a purpose */}
          </div>
          <Link to="/register" className="btn btn-custom-color me-2">Register</Link>
          {isLoggedIn ? 
              <button className="btn btn-custom-color me-2" onClick={handleLogout}>Logout</button> :
              <Link to="/login" className="btn btn-custom-color me-2">Login</Link>
          }
          {user && (
          <button className="btn btn-custom-color me-2" onClick={handleToggle2FA}>
            {user.is_2fa_enabled ? "Disable 2FA" : "Enable 2FA"}
          </button> 
          )}
        </div>
        <div className="intro-container">
          <h4 className="white-text">App Overview</h4>
          <p className="intro-container">
            This application is designed to provide a robust, secure, and user-friendly authentication
            system. Integrating backend technologies with a seamless frontend experience, it’s crafted
            for both security and ease of use. This platform offers a comprehensive set of
            authentication features, including user registration, login processes, password
            reset capabilities, and optional two-factor authentication. Behind every feature lies
            a robust backend built with Django and DRF, adhering to RESTful standards and secured
            with PyJWT for token creation. On the frontend, Axios interceptors streamline the login
            process, managing authentication tokens efficiently to ensure a smooth user experience.
            This system is crafted for those looking to explore a full-stack project that prioritizes
            security without compromising on user experience. Whether you're safeguarding personal 
            projects or in need of reliable login systems, this platform showcases
            the powerful synergy between a Django backend with custom middleware and a React frontend.
          </p>
        </div>
      </main>
    </div>
  );
}

export default HomePage;

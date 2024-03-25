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
        <h1 className="white-text">App Overview</h1>
        <p style={{ color:" #bcb3b3"}}>
          This application encompasses all endpoints related to managing
          user authentication and account operations. It covers
          user registration, login processes, token refresh, user data access with a
          token, and account recovery options like password reset.
        </p>
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

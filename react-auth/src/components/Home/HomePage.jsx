import React from "react";
import "./Home.css";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react"
import { FaExternalLinkAlt } from 'react-icons/fa';
import axiosAPIinterceptor from "../../interceptors/axios";
import { useLogout } from "../hooks/useLogout";



function HomePage() {

  const [message, setMessage] = useState("You are not logged out")

  // Callback to be called on successful logout
  const onLogoutSuccess = () => {
    setMessage("You are logged out")
  };
  
  // Pass the callback to useLogout hook
  const logout = useLogout(onLogoutSuccess);
  const navigate = useNavigate();

  useEffect (() => {
    const GetUser = async ()=> {
      try {
        const { data } = await axiosAPIinterceptor.get("/user/")
        console.log("User Data", data)
        setMessage(`Hi ${data.first_name}`);
        console.log(data.first_name)
      } catch (error) {
        console.error("Error fetching user data:", error)
        setMessage("Start by Registering to test the app")
      }
    };
    GetUser()
  },[]);

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
            <Link to="/features" className="nav-link fw-bold py-1 px-3 white-text">Features</Link> 
            </a>
            <a className="nav-link fw-bold py-1 px-3 white-text" href="#">
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-3 main-container centered-paragraph">
        <h1 className="white-text">App Overview </h1>
        <p className="lead white-text">
          This application encompasses all endpoints related to managing
          user authentication and account operations. It covers
          user registration, login processes, token refresh, user data access with a
          token, and account recovery options like password reset.
        </p>

        {/* Buttons for API testing */}
        <div className="mt-4">
        <button className="btn btn-custom-color me-2" onClick={()=> navigate("/Register")}>
            Register
          </button>
          <button className="btn btn-custom-color me-2" onClick={()=> navigate("/Login")}>
            Login
          </button>
          <button className="btn btn-custom-color me-2" onClick={logout}>
            Logout
          </button>
        </div>
        <div className="message">
          {message}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto text-white-50 footer-container">
        <h6>
          <a href="https://documenter.getpostman.com/view/23868442/2sA2xnyAdP" className="api-link" target="_blank" rel="noopener noreferrer">
            Api Documentation <FaExternalLinkAlt />
          </a>
        </h6>
    </footer>
    </div>
  );
}

export default HomePage;

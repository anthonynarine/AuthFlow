import React from 'react';
import { FaGithub, FaLinkedin,  FaDatabase } from 'react-icons/fa';
import './Footer.css'; 

export const Footer = () => {
  return (
    <footer className="mt-auto text-white-50 footer-container">
      <div className="link-container"> {/* Add this div */}
        <a href="https://documenter.getpostman.com/view/23868442/2sA3XY6xgj" className="api-link" target="_blank" rel="noopener noreferrer">
        <FaDatabase /> Api Documentation 
        </a>
        <a href="https://github.com/anthonynarine" target="_blank" rel="noopener noreferrer" className="github-link">
          <FaGithub /> GitHub
        </a>
        <a href="https://www.linkedin.com/in/anthony-narine-9ab567245/" target="_blank" rel="noopener noreferrer" className="linkedin-link">
          <FaLinkedin /> LinkedIn
        </a>
      </div>
    </footer>
  );
};

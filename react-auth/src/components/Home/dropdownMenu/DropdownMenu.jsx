import React from 'react';
import { Link } from 'react-router-dom';
import "./DropdownMenu.css";
import { FaReact } from 'react-icons/fa'; // For the React icon
import { DiPython } from 'react-icons/di'; // Example using a Python icon for Django
import { MdArrowDropDown, MdArrowDropUp } from "react-icons/md";
export const DropdownMenu = ({ isOpen, toggleDropdownMenu }) => {
    return (
        <div className={`dropdown ${isOpen ? 'show' : ''}`}>
            <button className="inherit-color-bold-text" 
                    type="button" 
                    onClick={toggleDropdownMenu} 
                    aria-expanded={isOpen ? 'true' : 'false'}>
                Features {isOpen ? <MdArrowDropUp/> : <MdArrowDropDown/>} 
            </button>
            <ul className={`dropdown-menu ${isOpen ? 'show' : ''}`}>
                <li><Link className="dropdown-item react-link" to="/react-features">
                    <FaReact className='react-icon' /> React
                    </Link></li>
                <li><Link className="dropdown-item django-link" to="/another-action">
                    <DiPython className='django-icon' /> Django
                    </Link></li>
            </ul>
        </div>
    );
};

import React from 'react';
import { Link } from 'react-router-dom';

export const DropdownMenu = ({ isOpen, toggleDropdownMenu }) => {
    return (
        <div className={`dropdown ${isOpen ? 'show' : ''}`}>
            <button className="btn btn-secondary dropdown-toggle" 
                    type="button" 
                    onClick={toggleDropdownMenu} 
                    aria-expanded={isOpen ? 'true' : 'false'}>
                Features
            </button>
            <ul className={`dropdown-menu ${isOpen ? 'show' : ''}`} >
                <li><Link className="dropdown-item" to="/action">Action</Link></li>
                <li><Link className="dropdown-item" to="/another-action">Another action</Link></li>
            </ul>
        </div>
    );
};
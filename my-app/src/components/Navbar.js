import React, { useState } from 'react';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleMenuToggle = () => {
        setIsMenuOpen(prevState => !prevState);
    };

    return (
        <nav className="navbar">
            <div className="navbar__container">
                <a href="/" id="navbar__logo">AZTickets</a>

                {/* Hamburger menu */}
                <div 
                    className={`navbar__toggle ${isMenuOpen ? 'is-active' : ''}`}
                    onClick={handleMenuToggle}  // Toggle menu visibility on click
                >
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="bar"></span>
                </div>

                {/* Menu items */}
                <ul className={`navbar__menu ${isMenuOpen ? 'active' : ''}`}>
                    <li className="navbar__item">
                        <a href="/" className="navbar__links">Home</a>
                    </li>
                    <li className="navbar__item">
                        <a href="/tech" className="navbar__links">Tech</a>
                    </li>
                    <li className="navbar__item">
                        <a href="/products" className="navbar__links">Products</a>
                    </li>
                    <li className="navbar__btn">
                        <a href="/signup" className="button">Sign Up</a>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;

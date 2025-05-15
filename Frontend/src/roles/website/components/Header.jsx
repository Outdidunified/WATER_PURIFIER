import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Header = ({ }) => {
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <header id="header" className="header d-flex align-items-center fixed-top">
            <div className="header-container container-fluid container-xl position-relative d-flex align-items-center justify-content-between">

                <Link to="/" className="logo d-flex align-items-center me-auto me-xl-0">
                    <img src="assets/img/logo.png" alt="Logo" style={{ maxHeight: '65px' }} />
                    <h1 className="sitename">ionHive Water Purifier</h1>
                </Link>

                <nav id="navmenu" className="navmenu">
                    <ul>
                        <li>
                            <Link to="/" className={currentPath === '/' ? 'active' : ''}>Home</Link>
                        </li>
                        <li>
                            <Link to="/about" className={currentPath === '/about' ? 'active' : ''}>About</Link>
                        </li>
                        <li>
                            <Link to="/blog" className={currentPath === '/blog' ? 'active' : ''}>Blog</Link>
                        </li>
                        <li>
                            <Link to="/faqs" className={currentPath === '/faqs' ? 'active' : ''}>FAQs</Link>
                        </li>
                        <li>
                            <Link to="/contact" className={currentPath === '/contact' ? 'active' : ''}>Contact</Link>
                        </li>
                    </ul>
                    <i className="mobile-nav-toggle d-xl-none bi bi-list"></i>
                </nav>

                <a className="btn-getstarted" href="#about">Login</a>
            </div>
        </header>
    ); 
};


export default Header;
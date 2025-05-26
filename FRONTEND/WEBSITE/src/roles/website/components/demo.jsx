import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

const Header = ({ userInfo, handleLogout }) => {
    const location = useLocation();
    const currentPath = location.pathname;
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1200);

    console.log(userInfo);
    // Handle window resize for responsive switching
    useEffect(() => {
        const handleResize = () => {
            const desktop = window.innerWidth >= 1200;
            setIsDesktop(desktop);
            if (desktop) setIsNavOpen(false); // close mobile menu on desktop
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleMobileNav = () => setIsNavOpen(prev => !prev);
    const closeMobileNav = () => setIsNavOpen(false);

    // Shared styles
    const navListStyle = {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: isDesktop ? 'flex' : 'block',
        gap: isDesktop ? '1.5rem' : '0',
    };

    const navItemStyle = {
        marginBottom: isDesktop ? '0' : '1rem',
    };
    const getLinkStyle = (path) => ({
        display: 'block',
        fontWeight: 'bold',
        textDecoration: 'none',
        color: currentPath === path ? '#007bff' : '#333', // blue if active, dark otherwise
        padding: isDesktop ? '0.5rem' : '0',
    });


    const navStyle = isDesktop
        ? { display: 'flex', alignItems: 'center' }
        : {
            display: isNavOpen ? 'block' : 'none',
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            background: '#fff',
            zIndex: 999,
            padding: '1rem',
        };

    const mobileToggleStyle = {
        fontSize: '1.5rem',
        cursor: 'pointer',
        display: isDesktop ? 'none' : 'block',
        marginLeft: '1rem',
    };

    return (
        <header id="header" className="header d-flex align-items-center fixed-top">
            <div className="header-container container-fluid container-xl position-relative d-flex align-items-center justify-content-between">

                <Link to="/" className="logo d-flex align-items-center me-auto me-xl-0" onClick={closeMobileNav}>
                    <img src="assets/img/logo.png" alt="Logo" style={{ maxHeight: '65px' }} />
                    <h1 className="sitename" style={{ marginLeft: '10px', fontSize: '1.2rem' }}>ionHive Water Purifier  {userInfo?.email ? ` - ${userInfo.email}` : ''}</h1>
                </Link>

                <nav id="navmenu" style={navStyle}>
                    <ul style={navListStyle}>
                        <Link to="/" style={getLinkStyle('/')} onClick={closeMobileNav}>Home</Link>
                        <Link to="/about" style={getLinkStyle('/about')} onClick={closeMobileNav}>About</Link>
                        <Link to="/blog" style={getLinkStyle('/blog')} onClick={closeMobileNav}>Blog</Link>
                        <Link to="/faqs" style={getLinkStyle('/faqs')} onClick={closeMobileNav}>FAQs</Link>
                        <Link to="/contact" style={getLinkStyle('/contact')} onClick={closeMobileNav}>Contact</Link>
                    </ul>
                </nav>

                <i className={`bi ${isNavOpen ? 'bi-x' : 'bi-list'}`} onClick={toggleMobileNav} style={mobileToggleStyle}></i>

                {/* Login / Logout button */}
                {userInfo?.email ? (
                    <button onClick={() => { handleLogout(); closeMobileNav(); }} className="btn-getstarted">Logout</button>
                ) : (
                    <Link className="btn-getstarted" to="/auth" onClick={closeMobileNav}>Login</Link>
                )}
            </div>
        </header>
    );
};

export default Header;

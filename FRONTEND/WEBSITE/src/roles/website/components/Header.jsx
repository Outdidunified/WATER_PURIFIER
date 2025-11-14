import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

const Header = ({ userInfo, handleLogout }) => {
    const location = useLocation();
    const currentPath = location.pathname;
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1200);

    useEffect(() => {
        console.log(userInfo, 'User info from Header');
    }, [userInfo]);

    useEffect(() => {
        const handleResize = () => {
            const desktop = window.innerWidth >= 1200;
            setIsDesktop(desktop);
            if (desktop) setIsNavOpen(false); // Auto-close menu on desktop
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleMobileNav = () => setIsNavOpen(prev => !prev);
    const closeMobileNav = () => setIsNavOpen(false);

    const navListStyle = {
        listStyle: 'none', padding: 0, margin: 0,
        display: isDesktop ? 'flex' : 'flex',
        flexDirection: isDesktop ? 'row' : 'column',
        gap: isDesktop ? '1.5rem' : '1rem',
        alignItems: isDesktop ? 'center' : 'flex-start',
    };

    const navItemStyle = {
        marginBottom: isDesktop ? '0' : '0.5rem',
        position: 'relative', // 👈 important for dropdown placement
    };

    const getLinkStyle = (path) => ({
        fontWeight: 'bold', textDecoration: 'none',
        color: currentPath === path ? '#007bff' : '#333',
        padding: isDesktop ? '0.5rem' : '0.25rem 0',
    });

    const navStyle = isDesktop
        ? { display: 'flex', alignItems: 'center' }
        : {
            display: isNavOpen ? 'block' : 'none',
            position: 'absolute',
            top: '100%', left: 0, width: '100%',
            background: '#fff', zIndex: 1000, padding: '1rem',
            borderBottom: '1px solid #ccc',
        };

    const mobileToggleStyle = {
        fontSize: '1.8rem', cursor: 'pointer',
        display: isDesktop ? 'none' : 'block',
        marginLeft: '1rem', zIndex: 1001, color: '#333',
    };

    const buttonStyle = {
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.4rem 0.8rem', fontSize: '0.9rem',
        marginLeft: isDesktop ? '1rem' : '0',
        marginTop: isDesktop ? '0' : '1rem', whiteSpace: 'nowrap',
    };

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const dropdownStyle = {
        position: "absolute", top: "100%", left: 0,
        backgroundColor: "#fff",
        boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
        borderRadius: "8px", padding: "10px 0",
        display: isDropdownOpen ? "block" : "none",
        minWidth: "160px", zIndex: 1000,
    };


    const dropdownItemStyle = {
        padding: "10px 15px", textDecoration: "none", color: "#333", display: "block",
    };

    return (
        <header className="header d-flex align-items-center fixed-top" style={{ backgroundColor: 'white' }}>
            <div className="container-fluid container-xl d-flex align-items-center justify-content-between" style={{ borderRadius: '50px' }}>

                {/* Logo and Title */}
                <Link to="/" className="logo d-flex align-items-center me-auto me-xl-0" onClick={closeMobileNav}>
                    <img src="/assets/img/logo.png" alt="Logo" style={{ maxHeight: '65px' }} />
                    <h6 className="sitename" style={{ marginLeft: '10px', fontSize: '1.1rem' }}>
                        ionHive Water Purifier  {userInfo?.email ? ` - ${userInfo.email}` : ''}
                    </h6>
                </Link>

                {/* Mobile menu toggle */}
                <i className={`bi ${isNavOpen ? 'bi-x' : 'bi-list'}`} onClick={toggleMobileNav} style={mobileToggleStyle}></i>

                {/* Navigation */}
                <nav id="navmenu" style={navStyle}>
                    <ul style={navListStyle}>
                        <li style={navItemStyle}>
                            <Link to="/" style={getLinkStyle('/')} onClick={closeMobileNav}>Home</Link>
                        </li>
                        <li style={navItemStyle}>
                            <Link to="/about" style={getLinkStyle('/about')} onClick={closeMobileNav}>About</Link>
                        </li>
                        <li style={navItemStyle}>
                            <Link to="/blog" style={getLinkStyle('/blog')} onClick={closeMobileNav}>Blog</Link>
                        </li>
                        <li style={navItemStyle}>
                            <Link to="/faqs" style={getLinkStyle('/faqs')} onClick={closeMobileNav}>FAQs</Link>
                        </li>
                        <li style={navItemStyle}>
                            <Link to="/contact" style={getLinkStyle('/contact')} onClick={closeMobileNav}>Contact Us</Link>
                        </li>
                        {userInfo?.email && (
                            <li
                                style={navItemStyle}
                                onMouseEnter={() => setIsDropdownOpen(true)}
                                onMouseLeave={() => setIsDropdownOpen(false)}
                            >
                                <b style={getLinkStyle('/profile', '/order-history', '/recharge')}> Setting ▾</b>
                                <div style={{ ...dropdownStyle, border: "1px solid #0d83fd" }}>
                                    <Link
                                        to="/profile"
                                        style={dropdownItemStyle}
                                        onMouseEnter={(e) => (e.target.style.color = "#0d83fd")}
                                        onMouseLeave={(e) => (e.target.style.color = "black")}
                                    >
                                        Profile
                                    </Link>
                                    <Link
                                        to="/order-history"
                                        style={dropdownItemStyle}
                                        onMouseEnter={(e) => (e.target.style.color = "#0d83fd")}
                                        onMouseLeave={(e) => (e.target.style.color = "black")}
                                    >
                                        Order History
                                    </Link>
                                    <Link
                                        to="/recharge"
                                        style={dropdownItemStyle}
                                        onMouseEnter={(e) => (e.target.style.color = "#0d83fd")}
                                        onMouseLeave={(e) => (e.target.style.color = "black")}
                                    >
                                        Recharge
                                    </Link>
                                </div>
                            </li>
                        )}
                        <li style={navItemStyle}>
                            {userInfo?.email ? (
                                <button
                                    onClick={() => { handleLogout(); closeMobileNav(); }}
                                    className="btn-getstarted"
                                    style={buttonStyle}
                                >
                                    <i className="bi bi-box-arrow-right"></i>
                                    Logout
                                </button>
                            ) : (
                                <Link to="/auth" onClick={closeMobileNav} className="btn-getstarted" style={buttonStyle}>
                                    Login
                                </Link>
                            )}
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;

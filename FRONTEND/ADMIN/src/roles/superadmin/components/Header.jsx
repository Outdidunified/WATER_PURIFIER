//Header
import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Header = ({ handleLogout }) => {
  const toggleButtonRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    setIsSidebarOpen((prev) => !prev);

    if (window.innerWidth <= 991) {
      if (sidebar) sidebar.classList.toggle('active');
    } else {
      document.body.classList.toggle('sidebar-icon-only');
    }
  };

  useEffect(() => {
    const button = toggleButtonRef.current;

    if (button) button.addEventListener('click', handleToggleSidebar);
    return () => {
      if (button) button.removeEventListener('click', handleToggleSidebar);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    alert(`Searching for: ${searchTerm}`);
  };

  return (
    <nav
      className="navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row" style={{ backgroundColor: 'white' }}
     
    >
      <div className="d-flex align-items-center" style={{ flexGrow: 1 }}>
        <Link
          className="navbar-brand brand-logo d-flex align-items-center"
          to="/associationadmin/Dashboard"
          style={{
            textDecoration: 'none',
            userSelect: 'none',
          }}
        >
          <img
            src="../../images/dashboard/waterpu.jpg"
            alt="Water Purifier Logo"
            style={{ height: 40, marginRight: 8 }}
          />
          <span
            style={{
              fontWeight: '700',
              fontSize: '20px',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              background: 'linear-gradient(90deg, #222 50%, #1E90FF 60%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              userSelect: 'none',
              letterSpacing: '0.03em',
            }}
          >
            WaterPurifier
          </span>
        </Link>

        {/* Sidebar toggle button */}
        <button
          className="navbar-toggler"
          type="button"
          ref={toggleButtonRef}
          style={{
            border: 'none',
            background: 'none',
            fontSize: '28px',
            color: isSidebarOpen ? '#1E90FF' : '#777',
            cursor: 'pointer',
            padding: '0 10px',
            marginLeft: '20px',
          }}
          aria-label="Toggle sidebar"
        >
          <span className="icon-menu"></span>
        </button>
      </div>

      <div className="navbar-menu-wrapper d-flex align-items-center justify-content-end" style={{ flex: 1 }}>
      

        <ul className="navbar-nav navbar-nav-right" style={{ display: 'flex', gap: '15px', margin: 0 }}>
          
          <li className="nav-item dropdown">
            <Link
              className="nav-link dropdown-toggle"
              to="#"
              id="profileDropdown"
              data-toggle="dropdown"
              style={{ color: '#555', fontSize: '22px' }}
            >
              <i className="fas fa-user-circle"></i>
            </Link>
            <div
              className="dropdown-menu dropdown-menu-right navbar-dropdown preview-list"
              aria-labelledby="profileDropdown"
              style={{
                minWidth: 120,
                borderRadius: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <button
                className="dropdown-item"
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  padding: '8px 15px',
                  cursor: 'pointer',
                  color: '#333',
                  fontSize: '14px',
                  textAlign: 'left',
                }}
              >
                <i className="ti-power-off" style={{ marginRight: 6 }}></i> Logout
              </button>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Header;

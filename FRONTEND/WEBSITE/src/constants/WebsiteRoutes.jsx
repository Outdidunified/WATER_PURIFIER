// WebsiteRoutes.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import Home from "../roles/website/pages/Home";
import About from "../roles/website/pages/About";
import Blog from "../roles/website/pages/Blog";
import FAQs from "../roles/website/pages/FAQs";
import Contact from "../roles/website/pages/Contact";
import PrivacyPolicy from "../roles/website/pages/PrivacyPolicy";
import TermsOfService from "../roles/website/pages/TermsOfService";
import Login from "../roles/website/pages/Login";
import Header from "../roles/website/components/Header";
import Swal from 'sweetalert2';
import Profile from "../roles/website/pages/Profile";
import OrderHistory from "../roles/website/pages/OrderHistory";
import Recharge from "../roles/website/pages/Recharge";

const WebsiteRoutes = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [userInfo, setUserInfo] = useState(null);
    const [token, setToken] = useState(null);

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    // If the URL has ?data=... try to parse it safely and login
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const data = params.get('data');
        if (!data) return;

        try {
            const parseData = JSON.parse(decodeURIComponent(data));
            // only proceed if parseData has useful info
            if (parseData && (parseData.token || parseData.user)) {
                handleLogin(parseData);
                // remove querystring without reloading
                const path = window.location.pathname;
                window.history.replaceState({}, '', path);
            }
        } catch (err) {
            console.error('Failed to parse `data` param:', err);
            // ignore; no crash
        }
    }, [location.search]);

    // On mount, load stored session (both user and token)
    useEffect(() => {
        try {
            const storedUser = sessionStorage.getItem("WebUser");
            const storedToken = sessionStorage.getItem("WebToken");
            if (storedUser) setUserInfo(JSON.parse(storedUser));
            if (storedToken) setToken(storedToken);
        } catch (err) {
            console.error("Error reading sessionStorage:", err);
        }
    }, []);

    // central login handler (used by query param login and Login page)
    const handleLogin = (data) => {
        const { token: newToken, user } = data;
        if (user) sessionStorage.setItem("WebUser", JSON.stringify(user));
        if (newToken) sessionStorage.setItem("WebToken", newToken);

        setUserInfo(user || null);
        setToken(newToken || null);

        // small delay so state is set before navigating
        setTimeout(() => {
            navigate("/");
        }, 100);
    };

    const handleLogout = () => {
        sessionStorage.removeItem("WebUser");
        sessionStorage.removeItem("WebToken");
        setUserInfo(null);
        setToken(null);

        Swal.fire({
            icon: 'success',
            title: 'Logged out',
            text: 'You have been successfully logged out.',
            timer: 2000,
            showConfirmButton: false,
        }).then(() => {
            navigate("/");
        });
    };

    return (
        <>
            <Header userInfo={userInfo} token={token} handleLogout={handleLogout} />
            <Routes>
                <Route path="/" element={<Home userInfo={userInfo} token={token} handleLogout={handleLogout} />} />
                <Route path="/recharge" element={<Recharge userInfo={userInfo} token={token} handleLogout={handleLogout} />} />
                <Route path="/about" element={<About userInfo={userInfo} token={token} handleLogout={handleLogout} />} />
                <Route path="/blog" element={<Blog userInfo={userInfo} token={token} handleLogout={handleLogout} />} />
                <Route path="/faqs" element={<FAQs userInfo={userInfo} token={token} handleLogout={handleLogout} />} />
                <Route path="/contact" element={<Contact userInfo={userInfo} token={token} handleLogout={handleLogout} />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy userInfo={userInfo} token={token} handleLogout={handleLogout} />} />
                <Route path="/terms-of-service" element={<TermsOfService userInfo={userInfo} token={token} handleLogout={handleLogout} />} />
                <Route path="/auth" element={<Login handleLogin={handleLogin} token={token} handleLogout={handleLogout} />} />
                <Route path="/profile" element={<Profile userInfo={userInfo} token={token} handleLogout={handleLogout} />} />
                <Route path="/order-history" element={<OrderHistory handleLogin={handleLogin} userInfo={userInfo} token={token} handleLogout={handleLogout} />} />
            </Routes>
        </>
    );
};

export default WebsiteRoutes;

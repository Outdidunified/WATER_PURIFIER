// WebsiteRoutes.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import Home from "../roles/website/pages/Home";
import ProductList from "../roles/website/pages/ProductList";
import About from "../roles/website/pages/About";
import Blog from "../roles/website/pages/Blog";
import FAQs from "../roles/website/pages/FAQs";
import Contact from "../roles/website/pages/Contact";
import PrivacyPolicy from "../roles/website/pages/PrivacyPolicy";
import TermsOfService from "../roles/website/pages/TermsOfService";
import Login from "../roles/website/pages/Login";
import Header from "../roles/website/components/Header";
import Swal from 'sweetalert2'; 

const WebsiteRoutes = () => {
    const [userInfo, setUserInfo] = useState(null);
    const navigate = useNavigate();

    // On component mount or reload, fetch from sessionStorage
    useEffect(() => {
        const user = sessionStorage.getItem("WebUser");
        if (user) {
            setUserInfo(JSON.parse(user));
        }
    }, []);

    const handleLogin = (data) => {
        const { token, user } = data;
        sessionStorage.setItem("WebUser", JSON.stringify(user));
        sessionStorage.setItem("WebToken", token);
        setUserInfo(user);

        // Optional: slight delay to let state propagate
        setTimeout(() => {
            navigate("/");
        }, 100);
    };


    const handleLogout = () => {
        alert('Logout clicked')

        sessionStorage.removeItem("WebUser");
        sessionStorage.removeItem("WebToken");
        setUserInfo(null);

        Swal.fire({
            icon: 'success',
            title: 'Logged out',
            text: 'You have been successfully logged out.',
            timer: 2000,
            showConfirmButton: false,
        }).then(() => {
            navigate("/"); // redirect to homepage or auth page
        });
    };
    

    return (
        <>
            <Header userInfo={userInfo} handleLogout={handleLogout} />
            <Routes>
                <Route path="/" element={<Home userInfo={userInfo} handleLogout={handleLogout} />} />
                <Route path="/product-list" element={<ProductList userInfo={userInfo} handleLogout={handleLogout} />} />
                <Route path="/about" element={<About userInfo={userInfo} handleLogout={handleLogout} />} />
                <Route path="/blog" element={<Blog userInfo={userInfo} handleLogout={handleLogout} />} />
                <Route path="/faqs" element={<FAQs userInfo={userInfo} handleLogout={handleLogout} />} />
                <Route path="/contact" element={<Contact userInfo={userInfo} handleLogout={handleLogout} />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy userInfo={userInfo} handleLogout={handleLogout} />} />
                <Route path="/terms-of-service" element={<TermsOfService userInfo={userInfo} handleLogout={handleLogout} />} />
                <Route path="/auth" element={<Login handleLogin={handleLogin} handleLogout={handleLogout} />} />
            </Routes>
        </>
    );
};

export default WebsiteRoutes;

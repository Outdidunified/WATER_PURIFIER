// WebsiteRoutes.jsx
import React, { useState } from "react";
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

const WebsiteRoutes = () => {
    const [userInfo, setUserInfo] = useState(() => {
        const user = sessionStorage.getItem("WebUser");
        return user ? JSON.parse(user) : null;
    });

    const navigate = useNavigate();

    const handleLogin = (data) => {
        const { token, user } = data;
        sessionStorage.setItem("WebUser", JSON.stringify(user));
        sessionStorage.setItem("WebToken", token);
        setUserInfo(user);
        navigate("/");
    };

    const handleLogout = () => {
        sessionStorage.removeItem("WebUser");
        sessionStorage.removeItem("WebToken");
        setUserInfo(null);
    };

    return (
        <>
            <Header userInfo={userInfo} handleLogout={handleLogout} />
            <Routes>
                <Route path="/" element={<Home userInfo={userInfo} />} />
                <Route path="/product-list" element={<ProductList />} />
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/faqs" element={<FAQs />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/auth" element={<Login handleLogin={handleLogin} />} />
            </Routes>
        </>
    );
};

export default WebsiteRoutes;

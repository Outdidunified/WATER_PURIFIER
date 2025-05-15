// WebsiteRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../roles/website/pages/Home";
import ProductList from "../roles/website/pages/ProductList";
import About from "../roles/website/pages/About";
import Blog from "../roles/website/pages/Blog";
import FAQs from "../roles/website/pages/FAQs";
import Contact from "../roles/website/pages/Contact";
import PrivacyPolicy from "../roles/website/pages/PrivacyPolicy";
import TermsOfService from "../roles/website/pages/TermsOfService";

const WebsiteRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product-list" element={<ProductList />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
        </Routes>
    );
};

export default WebsiteRoutes;

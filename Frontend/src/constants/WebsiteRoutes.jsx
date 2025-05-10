import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../roles/website/pages/Home";

const WebsiteRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
        </Routes>
    );
};

export default WebsiteRoutes;

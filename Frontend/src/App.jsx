import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import WebsiteRoutes from './constants/WebsiteRoutes';

const App = () => {

    return (
        <Router>
            <Routes>
                <Route path="/" element={<WebsiteRoutes />} />
                {/* <Route path="/" element={<Navigate to="/WebsiteRoutes" />} /> */}
            </Routes>
        </Router>
    );
};

export default App;

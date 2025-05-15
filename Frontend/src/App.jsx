import React from 'react';
import { Routes, Route } from 'react-router-dom';
import WebsiteRoutes from './constants/WebsiteRoutes';

const App = () => {
    return (
        <Routes>
            <Route path="/*" element={<WebsiteRoutes />} />
        </Routes>
    );
};

export default App;

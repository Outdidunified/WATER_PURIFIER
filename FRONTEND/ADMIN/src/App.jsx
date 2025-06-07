//App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import SuperAdminApp from './constants/adminRoutes/SuperAdminRoutes';

const App = () => {
  
  return (
    <Router>
      <Routes>
        <Route path="/superadmin/*" element={<SuperAdminApp />} />
        <Route path="/" element={<Navigate to="/superadmin" />} />
    


      </Routes>
    </Router>
  );
};

export default App;

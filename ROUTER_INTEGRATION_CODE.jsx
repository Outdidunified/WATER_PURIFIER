/**
 * ROUTER INTEGRATION CODE
 * Copy this code into your main router/App.jsx file
 */

// ============================================
// IMPORT STATEMENTS
// ============================================
// Add these imports at the top of your App.jsx or router configuration file

import ManageLeaves from './roles/superadmin/page/ManageLeaves/ManageLeaves';
import ViewLeaveDetails from './roles/superadmin/page/ManageLeaves/ViewLeaveDetails';

// ============================================
// ROUTE CONFIGURATION
// ============================================
// Add these route objects to your routes array

const leaveRoutes = [
  {
    path: '/admin/manage-leaves',
    element: <ManageLeaves />,
    protected: true,  // Requires authentication
    description: 'Manage leave requests'
  },
  {
    path: '/admin/manage-leaves/:leaveRequestId',
    element: <ViewLeaveDetails />,
    protected: true,  // Requires authentication
    description: 'View and approve/reject leave request'
  }
];

// ============================================
// EXAMPLE: Full Router Configuration
// ============================================
// If you're using React Router, here's how to set it up:

/**
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ManageLeaves from './roles/superadmin/page/ManageLeaves/ManageLeaves';
import ViewLeaveDetails from './roles/superadmin/page/ManageLeaves/ViewLeaveDetails';

function App() {
  const isAuthenticated = !!localStorage.getItem('adminToken');

  return (
    <Router>
      <Routes>
        {/* Other existing routes */}
        
        {/* Leave Management Routes */}
        <Route
          path="/admin/manage-leaves"
          element={isAuthenticated ? <ManageLeaves /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin/manage-leaves/:leaveRequestId"
          element={isAuthenticated ? <ViewLeaveDetails /> : <Navigate to="/login" />}
        />
        
        {/* Other existing routes */}
      </Routes>
    </Router>
  );
}

export default App;
*/

// ============================================
// SIDEBAR NAVIGATION LINK
// ============================================
// Add this to your Sidebar.jsx component

/**
import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <nav className="sidebar">
      {/* Existing sidebar items */}
      
      {/* Leave Management Link */}
      <NavLink
        to="/admin/manage-leaves"
        className={({ isActive }) => 
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <span className="nav-icon">📋</span>
        <span className="nav-label">Manage Leaves</span>
      </NavLink>
      
      {/* Existing sidebar items */}
    </nav>
  );
}

export default Sidebar;
*/

// ============================================
// HEADER/BREADCRUMB (Optional)
// ============================================
// You can add breadcrumb navigation like this:

/**
import { useLocation } from 'react-router-dom';

function Breadcrumb() {
  const location = useLocation();

  const breadcrumbs = {
    '/admin/manage-leaves': ['Admin', 'Manage Leaves'],
    '/admin/manage-leaves/:leaveRequestId': ['Admin', 'Manage Leaves', 'Leave Details']
  };

  return (
    <div className="breadcrumb">
      {breadcrumbs[location.pathname]?.map((item, index) => (
        <span key={index} className="breadcrumb-item">
          {item}
          {index < breadcrumbs[location.pathname].length - 1 && ' > '}
        </span>
      ))}
    </div>
  );
}
*/

// ============================================
// PERMISSION CHECK (Optional)
// ============================================
// If you have role-based access control:

/**
const checkLeaveManagementPermission = (user) => {
  // Check if user is admin or has leave management permission
  return user.role === 'admin' || user.permissions.includes('manage_leaves');
};

// Use in route protection
<Route
  path="/admin/manage-leaves"
  element={
    isAuthenticated && checkLeaveManagementPermission(currentUser) 
      ? <ManageLeaves /> 
      : <Navigate to="/unauthorized" />
  }
/>
*/

// ============================================
// API CONFIGURATION
// ============================================
// Ensure your API base URL is set in .env:

/**
// .env or .env.local
VITE_API_URL=http://localhost:5001/api/admin

// Or if using environment variables in your code:
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/admin';
*/

// ============================================
// TOKEN SETUP
// ============================================
// Ensure token is stored in localStorage:

/**
// After login, store token like this:
localStorage.setItem('adminToken', response.data.token);
localStorage.setItem('adminName', response.data.adminName); // Used for audit trail

// The hooks will automatically use this token for API calls
*/

// ============================================
// COMPLETE EXAMPLE STRUCTURE
// ============================================

/**
// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ManageLeaves from './roles/superadmin/page/ManageLeaves/ManageLeaves';
import ViewLeaveDetails from './roles/superadmin/page/ManageLeaves/ViewLeaveDetails';

// Other imports...

function App() {
  const token = localStorage.getItem('adminToken');

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Dashboard */}
          <Route path="/admin/dashboard" element={<Dashboard />} />
          
          {/* Other existing routes */}
          <Route path="/admin/manage-users" element={<ManageUsers />} />
          <Route path="/admin/manage-orders" element={<ManageOrders />} />
          
          {/* NEW: Leave Management Routes */}
          <Route
            path="/admin/manage-leaves"
            element={token ? <ManageLeaves /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin/manage-leaves/:leaveRequestId"
            element={token ? <ViewLeaveDetails /> : <Navigate to="/login" />}
          />
          
          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
*/

// ============================================
// TESTING
// ============================================
// To test the routes:

/**
1. Navigate to http://localhost:3000/admin/manage-leaves
2. Should show list of all leave requests
3. Click "Review" on any leave request
4. Should show details with approve/reject buttons
5. Click "Approve" or "Reject" to test functionality
6. Check email (you should receive notification)
7. Go back to list to confirm status change
*/

// ============================================
// TROUBLESHOOTING
// ============================================

/**
If routes are not working:

1. Check if files are in correct directories:
   ✓ hooks/ManageLeaves/ManageLeaveHooks.jsx
   ✓ hooks/ManageLeaves/ViewLeaveDetailsHooks.jsx
   ✓ page/ManageLeaves/ManageLeaves.jsx
   ✓ page/ManageLeaves/ViewLeaveDetails.jsx

2. Check if token is stored:
   localStorage.getItem('adminToken') should exist

3. Check console for errors:
   F12 → Console tab → Look for red errors

4. Check API endpoints:
   Try curl command from terminal to verify backend

5. Check permissions:
   Ensure user has admin role/permissions
*/

// ============================================
// OPTIONAL: LAZY LOADING
// ============================================

/**
import { lazy, Suspense } from 'react';

const ManageLeaves = lazy(() => 
  import('./roles/superadmin/page/ManageLeaves/ManageLeaves')
);
const ViewLeaveDetails = lazy(() => 
  import('./roles/superadmin/page/ManageLeaves/ViewLeaveDetails')
);

// In routes:
<Route
  path="/admin/manage-leaves"
  element={
    <Suspense fallback={<div>Loading...</div>}>
      <ManageLeaves />
    </Suspense>
  }
/>
*/

// ============================================
// END OF ROUTER INTEGRATION CODE
// ============================================
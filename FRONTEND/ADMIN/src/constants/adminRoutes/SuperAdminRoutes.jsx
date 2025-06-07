import React, { useState } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import Login from '../../roles/superadmin/page/Login';
import Dashboard from '../../roles/superadmin/page/Dashboard/Dashboard';
import ManageDevice from '../../roles/superadmin/page/ManageDevices/ManageDevice';
import ViewManageDevice from '../../roles/superadmin/page/ManageDevices/ViewManageDevice';
import EditManageDevice from '../../roles/superadmin/page/ManageDevices/EditManageDevice';
import ManageUsers from '../../roles/superadmin/page/ManageUser/ManageUsers';
import ViewManageUser from '../../roles/superadmin/page/ManageUser/ViewManageUser';
import EditManageUsers from '../../roles/superadmin/page/ManageUser/EditManageUsers';;
import Profile from '../../roles/superadmin/page/Profile/Profile';
import Header from '../../roles/superadmin/components/Header';
import ManageOrders from '../../roles/superadmin/page/ManageOrders/ManageOrders';
import ManageRoles from '../../roles/superadmin/page/ManageRoles/ManageRoles';
import ManageServices from '../../roles/superadmin/page/ManageServices/ManageServices';
import ManageInstallations from '../../roles/superadmin/page/ManageInstallations/ManageInstallations';
import AddProducts from '../../roles/superadmin/page/ManageProducts/AddProducts';
import ManageProducts from '../../roles/superadmin/page/ManageProducts/ManageProducts';
import EditProducts from '../../roles/superadmin/page/ManageProducts/EditProducts';
import ViewProducts from '../../roles/superadmin/page/ManageProducts/ViewProducts';
import ViewOrders from '../../roles/superadmin/page/ManageOrders/ViewOrders';
import ViewRoles from '../../roles/superadmin/page/ManageRoles/ViewRoles';
import EditRoles from '../../roles/superadmin/page/ManageRoles/EditRoles';
import ManageContact from '../../roles/superadmin/page/ManageContact/ManageContact';
import ManageCallRequests from '../../roles/superadmin/page/ManageCallRequests/ManageCallRequests';
import ViewInstallations from '../../roles/superadmin/page/ManageInstallations/ViewInstallations';
import ViewServices from '../../roles/superadmin/page/ManageServices/ViewServices'
//superadmin
const SuperAdminApp = () => {
  const storedUser = JSON.parse(sessionStorage.getItem('superAdminUser'));
  const [loggedIn, setLoggedIn] = useState(!!storedUser);
  const [userInfo, setUserInfo] = useState(storedUser || {});
  const navigate = useNavigate();

  const handleLogin = (data) => {
  const user = data.user;
  const token = data.token; 

  setUserInfo(user);
  setLoggedIn(true);
  sessionStorage.setItem('superAdminUser', JSON.stringify(user));
  sessionStorage.setItem('superAdminToken', token);
  navigate('/superadmin/Dashboard');
};

  // Handle logout
  const handleLogout = () => {
    setLoggedIn(false);
    setUserInfo({});
    sessionStorage.removeItem('superAdminUser');
    sessionStorage.removeItem('superAdminToken');

    navigate('/superadmin');
  };

  return (
    <>
      {loggedIn && <Header userInfo={userInfo} handleLogout={handleLogout} />}
      <Routes>
        <Route
          path="/"
          element={loggedIn ? <Navigate to="/superadmin/Dashboard" /> : <Login handleLogin={handleLogin} />}
        />
        <Route
          path="/Dashboard"
          element={loggedIn ? (
              <Dashboard userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
              <Navigate to="/superadmin" />
          )}
        />
         <Route
          path="ManageInstallations"
          element={loggedIn ? (
            <ManageInstallations userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />

         <Route
          path="ViewInstallations"
          element={loggedIn ? (
            <ViewInstallations userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />
        
        <Route
          path="/ManageDevice"
          element={loggedIn ? (
            <ManageDevice userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />
        <Route
          path="/ViewManageDevice"
          element={loggedIn ? (
            <ViewManageDevice userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />
        <Route
          path="/EditManageDevice"
          element={loggedIn ? (
            <EditManageDevice userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />
        <Route
          path="/ManageUsers"
          element={loggedIn ? (
            <ManageUsers userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />
        <Route
          path="/ViewManageUser"
          element={loggedIn ? (
            <ViewManageUser userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />
         <Route
          path="/EditManageUsers"
          element={loggedIn ? (
            <EditManageUsers userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />
        
         <Route
          path="/ManageProducts"
          element={loggedIn ? (
            <ManageProducts userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />

         <Route
          path="/ViewProducts"
          element={loggedIn ? (
            <ViewProducts userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />

        
        <Route
          path="/EditProducts"
          element={loggedIn ? (
            <EditProducts userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />

        <Route
          path="/AddProducts"
          element={loggedIn ? (
            <AddProducts userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />
        
      
        <Route
          path="/Profile"
          element={loggedIn ? (
            <Profile userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />

        
        <Route
          path="/ManageOrders"
          element={loggedIn ? (
            <ManageOrders userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />

         <Route
          path="/ViewOrders"
          element={loggedIn ? (
            <ViewOrders userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />

        <Route
          path="/ManageRoles"
          element={loggedIn ? (
            <ManageRoles userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />

         <Route
          path="/ViewRoles"
          element={loggedIn ? (
            <ViewRoles userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />

         <Route
          path="/EditRoles"
          element={loggedIn ? (
            <EditRoles userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />
         <Route
          path="/ManageServices"
          element={loggedIn ? (
            <ManageServices userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />
                 <Route
          path="/ViewServices"
          element={loggedIn ? (
            <ViewServices userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />
         <Route
          path="/ManageContact"
          element={loggedIn ? (
            <ManageContact userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />
         <Route
          path="/ManageCallRequests"
          element={loggedIn ? (
            <ManageCallRequests userInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/superadmin" />
          )}
        />
      </Routes>
    </>
  );
};

export default SuperAdminApp;

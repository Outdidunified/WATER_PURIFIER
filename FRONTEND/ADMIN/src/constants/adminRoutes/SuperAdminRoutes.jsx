import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
// Pages
import Login from '../../roles/superadmin/page/Login';
import Dashboard from '../../roles/superadmin/page/Dashboard/Dashboard';
import ManageDevice from '../../roles/superadmin/page/ManageDevices/ManageDevice';
import ViewManageDevice from '../../roles/superadmin/page/ManageDevices/ViewManageDevice';
import EditManageDevice from '../../roles/superadmin/page/ManageDevices/EditManageDevice';
import ManageUsers from '../../roles/superadmin/page/ManageUser/ManageUsers';
import ViewManageUser from '../../roles/superadmin/page/ManageUser/ViewManageUser';
import EditManageUsers from '../../roles/superadmin/page/ManageUser/EditManageUsers';
import Profile from '../../roles/superadmin/page/Profile/Profile';
import Header from '../../roles/superadmin/components/Header';
import ManageOrders from '../../roles/superadmin/page/ManageOrders/ManageOrders';
import ViewOrders from '../../roles/superadmin/page/ManageOrders/ViewOrders';
import ManageRoles from '../../roles/superadmin/page/ManageRoles/ManageRoles';
import ViewRoles from '../../roles/superadmin/page/ManageRoles/ViewRoles';
import EditRoles from '../../roles/superadmin/page/ManageRoles/EditRoles';
import ManageServices from '../../roles/superadmin/page/ManageServices/ManageServices';
import ViewServices from '../../roles/superadmin/page/ManageServices/ViewServices';
import ManageRequests from '../../roles/superadmin/page/ManageRequests/ManageRequests';
import ViewManageRequests from '../../roles/superadmin/page/ManageRequests/ViewManageRequests';
import ManageInstallations from '../../roles/superadmin/page/ManageInstallations/ManageInstallations';
import ViewInstallations from '../../roles/superadmin/page/ManageInstallations/ViewInstallations';
import AddProducts from '../../roles/superadmin/page/ManageProducts/AddProducts';
import ManageProducts from '../../roles/superadmin/page/ManageProducts/ManageProducts';
import EditProducts from '../../roles/superadmin/page/ManageProducts/EditProducts';
import ViewProducts from '../../roles/superadmin/page/ManageProducts/ViewProducts';
import ManageContact from '../../roles/superadmin/page/ManageContact/ManageContact';
import ManageCallRequests from '../../roles/superadmin/page/ManageCallRequests/ManageCallRequests';
import ManageLeaves from '../../roles/superadmin/page/ManageLeaves/ManageLeaves';
import ViewLeaveDetails from '../../roles/superadmin/page/ManageLeaves/ViewLeaveDetails';
import axiosInstance from '../../utils/utils';

const SuperAdminApp = () => {
  const storedUser = JSON.parse(sessionStorage.getItem('superAdminUser'));
  const storedPermissions = JSON.parse(sessionStorage.getItem('superAdminPermissions') || '[]');
  const [loggedIn, setLoggedIn] = useState(!!storedUser);
  const [userInfo, setUserInfo] = useState(storedUser || {});
  const [permissions, setPermissions] = useState(storedPermissions);
  const [permissionsLoaded, setPermissionsLoaded] = useState(storedPermissions.length > 0);
  const navigate = useNavigate();
  const permissionsFetchedRef = useRef(new Set());

  useEffect(() => {
    if (!loggedIn) {
      setPermissions([]);
      setPermissionsLoaded(true);
      permissionsFetchedRef.current.clear();
      return;
    }

    if (!userInfo.role_id) {
      setPermissionsLoaded(true);
      return;
    }

    if (permissionsFetchedRef.current.has(userInfo.role_id)) return; // Already fetched for this role

    permissionsFetchedRef.current.add(userInfo.role_id);
    setPermissionsLoaded(false);
    axiosInstance
      .get(`/api/admin/by-role?ids=${userInfo.role_id}`)
      .then((res) => {
        if (res.data.status === 'Success') {
          setPermissions(res.data.data);
          sessionStorage.setItem('superAdminPermissions', JSON.stringify(res.data.data));
        }
      })
      .catch((err) => {
        console.error(err);
        permissionsFetchedRef.current.delete(userInfo.role_id); // Allow retry on error
      })
      .finally(() => setPermissionsLoaded(true));
  }, [loggedIn, userInfo.role_id]);

  const handleLogin = (data) => {
    const user = data.user;
    const token = data.token; 

    setUserInfo(user);
    setLoggedIn(true);
    sessionStorage.setItem('superAdminUser', JSON.stringify(user));
    sessionStorage.setItem('superAdminToken', token);
    navigate('/superadmin/Dashboard');
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUserInfo({});
    setPermissions([]);
    permissionsFetchedRef.current.clear();
    sessionStorage.removeItem('superAdminUser');
    sessionStorage.removeItem('superAdminToken');
    sessionStorage.removeItem('superAdminPermissions');
    navigate('/superadmin');
  };

  // Helper to check permission
  const canView = (module) => permissions.find(p => p.module === module)?.can_view;

  if (loggedIn && !permissionsLoaded) {
    return null;
  }

  return (
    <>
      {loggedIn && <Header userInfo={userInfo} handleLogout={handleLogout} />}
      <Routes>
        <Route
          path="/"
          element={loggedIn ? <Navigate to="/superadmin/Dashboard" /> : <Login handleLogin={handleLogin} />}
        />

        {canView('dashboard') && (
          <Route
            path="/Dashboard"
            element={<Dashboard userInfo={userInfo} handleLogout={handleLogout} />}
          />
        )}

        {canView('manage_devices') && (
          <>
            <Route
              path="/ManageDevice"
              element={<ManageDevice userInfo={userInfo} handleLogout={handleLogout} />}
            />
            <Route
              path="/ViewManageDevice"
              element={<ViewManageDevice userInfo={userInfo} handleLogout={handleLogout} />}
            />
            <Route
              path="/EditManageDevice"
              element={<EditManageDevice userInfo={userInfo} handleLogout={handleLogout} />}
            />
          </>
        )}

        {canView('manage_users') && (
          <>
            <Route
              path="/ManageUsers"
              element={<ManageUsers userInfo={userInfo} handleLogout={handleLogout} />}
            />
            <Route
              path="/ViewManageUser"
              element={<ViewManageUser userInfo={userInfo} handleLogout={handleLogout} />}
            />
            <Route
              path="/EditManageUsers"
              element={<EditManageUsers userInfo={userInfo} handleLogout={handleLogout} />}
            />
          </>
        )}

        {canView('manage_products') && (
          <>
            <Route path="/ManageProducts" element={<ManageProducts userInfo={userInfo} handleLogout={handleLogout} />} />
            <Route path="/ViewProducts" element={<ViewProducts userInfo={userInfo} handleLogout={handleLogout} />} />
            <Route path="/EditProducts" element={<EditProducts userInfo={userInfo} handleLogout={handleLogout} />} />
            <Route path="/AddProducts" element={<AddProducts userInfo={userInfo} handleLogout={handleLogout} />} />
          </>
        )}

        {canView('manage_installations') && (
          <>
            <Route path="/ManageInstallations" element={<ManageInstallations userInfo={userInfo} handleLogout={handleLogout} />} />
            <Route path="/ViewInstallations" element={<ViewInstallations userInfo={userInfo} handleLogout={handleLogout} />} />
          </>
        )}

        {canView('manage_services') && (
          <>
            <Route path="/ManageServices" element={<ManageServices userInfo={userInfo} handleLogout={handleLogout} />} />
            <Route path="/ViewServices" element={<ViewServices userInfo={userInfo} handleLogout={handleLogout} />} />
          </>
        )}

        {canView('manage_requests') && (
          <>
            <Route path="/ManageRequests" element={<ManageRequests userInfo={userInfo} handleLogout={handleLogout} />} />
            <Route path="/ViewManageRequests" element={<ViewManageRequests userInfo={userInfo} handleLogout={handleLogout} />} />
          </>
        )}

        {canView('manage_roles') && (
          <>
            <Route path="/ManageRoles" element={<ManageRoles userInfo={userInfo} handleLogout={handleLogout} />} />
            <Route path="/ViewRoles" element={<ViewRoles userInfo={userInfo} handleLogout={handleLogout} />} />
            <Route path="/EditRoles" element={<EditRoles userInfo={userInfo} handleLogout={handleLogout} />} />
          </>
        )}

        {canView('manage_orders') && (
          <>
            <Route path="/ManageOrders" element={<ManageOrders userInfo={userInfo} handleLogout={handleLogout} />} />
            <Route path="/ViewOrders" element={<ViewOrders userInfo={userInfo} handleLogout={handleLogout} />} />
          </>
        )}

        {canView('manage_call_requests') && (
          <Route path="/ManageCallRequests" element={<ManageCallRequests userInfo={userInfo} handleLogout={handleLogout} />} />
        )}

        {canView('manage_contact') && (
          <Route path="/ManageContact" element={<ManageContact userInfo={userInfo} handleLogout={handleLogout} />} />
        )}

        {canView('manage_leaves') && (
          <>
            <Route path="/ManageLeaves" element={<ManageLeaves userInfo={userInfo} handleLogout={handleLogout} />} />
            <Route path="/ViewLeaveDetails/:leaveRequestId" element={<ViewLeaveDetails userInfo={userInfo} handleLogout={handleLogout} />} />
          </>
        )}

        <Route path="/Profile" element={<Profile userInfo={userInfo} handleLogout={handleLogout} />} />

        {/* Redirect if route not permitted */}
        <Route path="*" element={<Navigate to={loggedIn ? "/superadmin/Dashboard" : "/superadmin"} />} />
      </Routes>
    </>
  );
};

export default SuperAdminApp;

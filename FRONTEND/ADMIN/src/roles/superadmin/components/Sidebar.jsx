import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  return (
        <nav className="sidebar sidebar-offcanvas" id="sidebar">
      <ul className="nav">
        <li className={location.pathname === '/superadmin/Dashboard' ? 'nav-item active' : 'nav-item'}>
          <Link className="nav-link" to="/superadmin/Dashboard">
            <i className="icon-grid menu-icon"></i>
            <span className="menu-title">Dashboard</span>
          </Link>
        </li>

       <li className={location.pathname === '/superadmin/ManageProducts' || location.pathname==='/superadmin/ViewProducts' || location.pathname=== '/superadmin/EditProducts' || location.pathname==='/superadmin/AddProducts'? 'nav-item active' : 'nav-item'}>
  <Link className="nav-link" to="/superadmin/ManageProducts">
    <i className="icon-head menu-icon mdi mdi-credit-card-multiple"></i>
    <span className="menu-title">Manage Products</span>
  </Link>
</li>

        <li className={location.pathname === '/superadmin/ManageDevice' || location.pathname === '/superadmin/ViewManageDevice' || location.pathname === '/superadmin/EditManageDevice' ? 'nav-item active' : 'nav-item'}>
          <Link className="nav-link" to="/superadmin/ManageDevice">
            <i className="icon-head menu-icon mdi mdi-cellphone-link"></i>
            <span className="menu-title">Manage Device</span>
          </Link>
        </li>

       
 <li className={location.pathname === '/superadmin/ManageInstallations' || location.pathname === '/superadmin/ManageServices' || location.pathname === '/superadmin/ViewInstallations' || location.pathname === '/superadmin/ViewServices'  ? 'nav-item active' : 'nav-item'} key="ManageDevice">
                           <a className="nav-link" data-toggle="collapse" href="#ui-basic-md" aria-expanded="false" aria-controls="ui-basic-md">
                           <i className="icon-head menu-icon mdi mdi-wrench"></i>
                           <span className="menu-title">Installations & Services</span>
                           <i className="menu-arrow"></i>
                           </a>
                           <div className="collapse" id="ui-basic-md">
                           <ul className="nav flex-column sub-menu">
                               <li className="nav-item"> <Link className="nav-link" to={{ pathname: "/superadmin/ManageInstallations" }}>Manage Installations</Link></li>
                               <li className="nav-item"> <Link className="nav-link" to={{ pathname: "/superadmin/ManageServices" }}>Manage Services</Link></li>
                           </ul>
                           </div>
                       </li>
       

        <li className={location.pathname === '/superadmin/ManageRoles' || location.pathname==='/superadmin/EditRoles' || location.pathname==='/superadmin/ViewRoles'? 'nav-item active' : 'nav-item'}>
          <Link className="nav-link" to="/superadmin/ManageRoles">
            <i className="icon-head menu-icon mdi mdi-account-key"></i>
            <span className="menu-title">Manage Roles</span>
          </Link>
        </li>

        <li className={location.pathname === '/superadmin/ManageUsers' || location.pathname === '/superadmin/EditManageUsers' || location.pathname === '/superadmin/ViewManageUser' ? 'nav-item active' : 'nav-item'}>
          <Link className="nav-link" to="/superadmin/ManageUsers">
            <i className="icon-head menu-icon mdi mdi-account-multiple"></i>
            <span className="menu-title">Manage Users</span>
          </Link>
        </li>

        <li className={location.pathname === '/superadmin/ManageOrders' || location.pathname==='/superadmin/ViewOrders'? 'nav-item active' : 'nav-item'}>
          <Link className="nav-link" to="/superadmin/ManageOrders">
            <i className="icon-head menu-icon mdi mdi-cart"></i>
            <span className="menu-title">Manage Orders</span>
          </Link>
        </li>

         <li className={location.pathname === '/superadmin/ManageCallRequests'? 'nav-item active' : 'nav-item'}>
          <Link className="nav-link" to="/superadmin/ManageCallRequests">
            <i className="icon-head menu-icon mdi mdi-cart"></i>
            <span className="menu-title">Manage Call Requests</span>
          </Link>
        </li>

         <li className={location.pathname === '/superadmin/ManageContact' ? 'nav-item active' : 'nav-item'}>
          <Link className="nav-link" to="/superadmin/ManageContact">
            <i className="icon-head menu-icon mdi mdi-cart"></i>
            <span className="menu-title">Manage Enquire</span>
          </Link>
        </li>

        <li className={location.pathname === '/superadmin/Profile' ? 'nav-item active' : 'nav-item'}>
          <Link className="nav-link" to="/superadmin/Profile">
            <i className="icon-head menu-icon mdi mdi-account-circle"></i>
            <span className="menu-title">Profile</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;

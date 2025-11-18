import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Sidebar = ({ userInfo, permissions: propsPermissions }) => {
    const location = useLocation();

    // Fallback to sessionStorage if permissions not provided via props
    const permissions = (propsPermissions && Array.isArray(propsPermissions))
        ? propsPermissions
        : (() => {
            try {
                return JSON.parse(sessionStorage.getItem('superAdminPermissions')) || [];
            } catch {
                return [];
            }
        })();

    const canView = (module) => permissions.find(p => p.module === module)?.can_view;

    return (
        <nav
            className="sidebar sidebar-offcanvas"
            id="sidebar"
            style={{
                position: 'fixed',
                left: 0,
                height: '100vh',
                overflowY: 'auto',
                zIndex: 1000,
                backgroundColor: '#fff', // keeps background solid when scrolling
            }}
        >
            <ul className="nav" style={{marginLeft:0}}>
                {canView('dashboard') && (
                    <li className={location.pathname === '/superadmin/Dashboard' ? 'nav-item active' : 'nav-item'}>
                        <Link className="nav-link" to="/superadmin/Dashboard">
                            <i className="icon-grid menu-icon"></i>
                            <span className="menu-title">Dashboard</span>
                        </Link>
                    </li>
                )}
                {canView('manage_products') && (
                    <li className={['/superadmin/ManageProducts', '/superadmin/ViewProducts', '/superadmin/EditProducts', '/superadmin/AddProducts'].includes(location.pathname) ? 'nav-item active' : 'nav-item'}>
                        <Link className="nav-link" to="/superadmin/ManageProducts">
                            <i className="icon-head menu-icon mdi mdi-credit-card-multiple"></i>
                            <span className="menu-title">Manage Models</span>
                        </Link>
                    </li>
                )}
                {canView('manage_devices') && (
                    <li className={['/superadmin/ManageDevice', '/superadmin/ViewManageDevice', '/superadmin/EditManageDevice'].includes(location.pathname) ? 'nav-item active' : 'nav-item'}>
                        <Link className="nav-link" to="/superadmin/ManageDevice">
                            <i className="icon-head menu-icon mdi mdi-cellphone-link"></i>
                            <span className="menu-title">Manage Device</span>
                        </Link>
                    </li>
                )}

                {canView('manage_users') && (
                    <li className={['/superadmin/ManageUsers', '/superadmin/ViewManageUser', '/superadmin/EditManageUsers'].includes(location.pathname) ? 'nav-item active' : 'nav-item'}>
                        <Link className="nav-link" to="/superadmin/ManageUsers">
                            <i className="icon-head menu-icon mdi mdi-account-multiple"></i>
                            <span className="menu-title">Manage Users</span>
                        </Link>
                    </li>
                )}

                {canView('manage_roles') && (
                    <li className={['/superadmin/ManageRoles', '/superadmin/ViewRoles', '/superadmin/EditRoles'].includes(location.pathname) ? 'nav-item active' : 'nav-item'}>
                        <Link className="nav-link" to="/superadmin/ManageRoles">
                            <i className="icon-head menu-icon mdi mdi-account-key"></i>
                            <span className="menu-title">Manage Roles</span>
                        </Link>
                    </li>
                )}

                {canView('manage_orders') && (
                    <li className={['/superadmin/ManageOrders', '/superadmin/ViewOrders'].includes(location.pathname) ? 'nav-item active' : 'nav-item'}>
                        <Link className="nav-link" to="/superadmin/ManageOrders">
                            <i className="icon-head menu-icon mdi mdi-cart"></i>
                            <span className="menu-title">Manage Orders</span>
                        </Link>
                    </li>
                )}

                {(canView('manage_installations') || canView('manage_services')) && (
                    <li className={['/superadmin/ManageInstallations', '/superadmin/ViewInstallations', '/superadmin/ManageServices', '/superadmin/ViewServices'].includes(location.pathname) ? 'nav-item active' : 'nav-item'}>
                        <a className="nav-link" data-toggle="collapse" href="#ui-basic-md" aria-expanded="false">
                            <i className="icon-head menu-icon mdi mdi-wrench"></i>
                            <span className="menu-title">Installations & Services</span>
                            <i className="menu-arrow"></i>
                        </a>
                        <div className="collapse" id="ui-basic-md">
                            <ul className="nav flex-column sub-menu">
                                {canView('manage_installations') && <li className="nav-item"><Link className="nav-link" to="/superadmin/ManageInstallations">Manage Installations</Link></li>}
                                {canView('manage_services') && <li className="nav-item"><Link className="nav-link" to="/superadmin/ManageServices">Manage Services</Link></li>}
                            </ul>
                        </div>
                    </li>
                )}

                {canView('manage_requests') && (
                    <li className={['/superadmin/ManageRequests', '/superadmin/ViewManageRequests'].includes(location.pathname) ? 'nav-item active' : 'nav-item'}>
                        <Link className="nav-link" to="/superadmin/ManageRequests">
                            <i className="icon-head menu-icon mdi mdi-clipboard-text"></i>
                            <span className="menu-title">Manage Requests</span>
                        </Link>
                    </li>
                )}

                {canView('manage_contact') && (
                    <li className={location.pathname === '/superadmin/ManageContact' ? 'nav-item active' : 'nav-item'}>
                        <Link className="nav-link" to="/superadmin/ManageContact">
                            <i className="icon-head menu-icon mdi mdi-email-outline"></i>
                            <span className="menu-title">Manage Enquire</span>
                        </Link>
                    </li>
                )}

                {canView('manage_leaves') && (
                    <li className={['/superadmin/ManageLeaves', '/superadmin/ViewLeaveDetails'].includes(location.pathname) ? 'nav-item active' : 'nav-item'}>
                        <Link className="nav-link" to="/superadmin/ManageLeaves">
                            <i className="icon-head menu-icon mdi mdi-calendar-multiple"></i>
                            <span className="menu-title">Manage Leaves</span>
                        </Link>
                    </li>
                )}

                {canView('profile') && (
                    <li className={location.pathname === '/superadmin/Profile' ? 'nav-item active' : 'nav-item'}>
                        <Link className="nav-link" to="/superadmin/Profile">
                            <i className="icon-head menu-icon mdi mdi-account-circle"></i>
                            <span className="menu-title">Profile</span>
                        </Link>
                    </li>
                )}
            </ul>
        </nav>
    );
};

export default Sidebar;

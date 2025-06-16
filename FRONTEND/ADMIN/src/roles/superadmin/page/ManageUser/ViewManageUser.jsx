//ViewManageUser
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import { formatTimestamp } from '../../../../utils/formatTimestamp';
import useViewManageUser from '../../hooks/ManageUser/ViewManageUsersHooks';
const ViewManageUser = ({ userInfo, handleLogout }) => {
    const navigate = useNavigate();
    
   const { user, handleBack, handleEditUser } = useViewManageUser();

  

    return (
        <div className='container-scroller'>
            <Header userInfo={userInfo} handleLogout={handleLogout} />
            <div className="container-fluid page-body-wrapper">
                <Sidebar />
                <div className="main-panel">
                    <div className="content-wrapper">
                        <div className="row">
                            <div className="col-md-12 grid-margin">
                                <div className="row">
                                    <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                                        <h3 className="font-weight-bold">Manage User's</h3>
                                    </div>
                                    <div className="col-12 col-xl-4">
                                        <div className="justify-content-end d-flex">
                                            <button type="button" className="btn btn-outline-primary btn-icon-text" onClick={() => handleEditUser(user)} style={{ marginRight: '10px' }}>
                                                <i className="mdi mdi-pencil btn-icon-prepend"></i>Edit
                                            </button>
                                            <button type="button" className="btn btn-success" onClick={handleBack}>Back</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-lg-12 grid-margin stretch-card">
                                <div className="card">
                                    <div className="card-body">
                                                <h4 className="card-title" style={{ textAlign: 'center', paddingBottom: '10px' }}>User Details</h4>
                                                <hr />

                                            <div className="row col-12 viewDataCss">
                                                <div className="col-md-4"><strong>User Name:</strong> {user.name || '-'}</div>
                                                <div className="col-md-4"><strong>Email Id:</strong> {user.email || '-'}</div>
                                                <div className="col-md-4"><strong>Phone Number:</strong> {user.phone || '-'}</div>
                                            </div>

                                            <div className="row col-12 viewDataCss">
                                                <div className="col-md-4"><strong>Password:</strong> {user.password || '-'}</div>
                                                <div className="col-md-4"><strong>City:</strong> {user.city || '-'}</div>
<div className="col-md-4">
  <strong>Role:</strong> {
    user.role_id === 1 ? 'Admin' :
    user.role_id === 2 ? 'Technician' :
    user.role_id === 3 ? 'End User' :
    'Unknown'
  }
</div>
                                            </div>

                                            <div className="row col-12 viewDataCss">
                                                <div className="col-md-4"><strong>Assigned Device ID:</strong> {user.assigned_device_id || '-'}</div>
                                                <div className="col-md-4"><strong>User ID:</strong> {user.user_id || '-'}</div>
                                                <div className="col-md-4"><strong>Status:</strong> {user.status ? <span className="text-success">Active</span> : <span className="text-danger">DeActive</span>}</div>
                                            </div>

                                            <div className="row col-12 viewDataCss">
                                                <div className="col-md-4"><strong>Is Subscribed:</strong> {user.is_subscribed ? 'Yes' : 'No'}</div>
                                                <div className="col-md-4"><strong>Active Plan:</strong> {user.active_label || '-'}</div>
                                                <div className="col-md-4"><strong>Active Duration:</strong> {user.active_duration_id || '-'}</div>
                                            </div>

                                            <div className="row col-12 viewDataCss">
                                                <div className="col-md-4"><strong>Subscribed At:</strong> {user.subscribed_at ? formatTimestamp(user.subscribed_at) : '-'}</div>
                                                <div className="col-md-4"><strong>Subscription Expiry Date:</strong> {user.subscription_expiry_date ? formatTimestamp(user.subscription_expiry_date) : '-'}</div>
                                                <div className="col-md-4"><strong>Active Order ID:</strong> {user.active_order_id || '-'}</div>
                                            </div>

                                            <div className="row col-12 viewDataCss">
                                                <div className="col-md-4"><strong>Created By:</strong> {user.createdby || '-'}</div>
                                                <div className="col-md-4"><strong>Created Date:</strong> {user.createdDate ? formatTimestamp(user.createdDate) : '-'}</div>
                                                <div className="col-md-4"><strong>OTP Expires:</strong> {user.otpExpires ? formatTimestamp(user.otpExpires) : '-'}</div>
                                            </div>

                                          
                                        </div>
                                    </div>
                                
                            </div>
                        </div>
                    </div>
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default ViewManageUser;

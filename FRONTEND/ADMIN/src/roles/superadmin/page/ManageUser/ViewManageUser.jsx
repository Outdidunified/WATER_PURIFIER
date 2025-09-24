import React from 'react';
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
    <div className="container-scroller">
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">

            {/* Header with Edit + Back */}
            <div className="row mb-3">
              <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                <h3 className="font-weight-bold">Manage User's</h3>
              </div>
           <div className="col-12 col-xl-4 d-flex justify-content-end">
  <div className="d-flex gap-2">
    <button
      type="button"
      className="btn btn-outline-primary btn-icon-text mr-2"
      onClick={() => handleEditUser(user)}
    >
      <i className="mdi mdi-pencil btn-icon-prepend"></i>Edit
    </button>
    <button
      type="button"
      className="btn btn-success"
      onClick={handleBack}
    >
      Back
    </button>
  </div>
</div>

            </div>

            {/* User Details Card */}
            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title text-center pb-3">User Details</h4>
                    <hr />

                    {/* Basic Info */}
                    <div className="row col-12 viewDataCss mb-3">
                      <div className="col-md-4"><strong>User Name:</strong> {user?.name || '-'}</div>
                      <div className="col-md-4"><strong>Email:</strong> {user?.email || '-'}</div>
                      <div className="col-md-4"><strong>Phone:</strong> {user?.phone || '-'}</div>
                    </div>

                    <div className="row col-12 viewDataCss mb-3">
                      <div className="col-md-4"><strong>Password:</strong> {user?.password || '-'}</div>
                      <div className="col-md-4"><strong>Role:</strong> {user?.role_name || '-'}</div>
                      <div className="col-md-4"><strong>User ID:</strong> {user?.user_id || '-'}</div>
                    </div>

                    {/* Address Info */}
                    <div className="row col-12 viewDataCss mb-3">
                      <div className="col-md-4"><strong>Address Line 1:</strong> {user?.addressline1 || '-'}</div>
                      <div className="col-md-4"><strong>Address Line 2:</strong> {user?.addressline2 || '-'}</div>
                      <div className="col-md-4"><strong>City:</strong> {user?.city || '-'}</div>
                    </div>

                    <div className="row col-12 viewDataCss mb-3">
                      <div className="col-md-4"><strong>District:</strong> {user?.district || '-'}</div>
                      <div className="col-md-4"><strong>State:</strong> {user?.state || '-'}</div>
                      <div className="col-md-4"><strong>Country:</strong> {user?.country || '-'}</div>
                    </div>

                    <div className="row col-12 viewDataCss mb-3">
                      <div className="col-md-4"><strong>Pincode:</strong> {user?.pincode || '-'}</div>
                      <div className="col-md-4"><strong>Assigned Device IDs:</strong> {user?.assigned_device_ids?.join(', ') || user?.assigned_device_id || '-'}</div>
                      <div className="col-md-4"><strong>Security Deposit:</strong> ₹{user?.security_deposit || 0}</div>
                    </div>

                    {/* Status & Creator Info */}
                    <div className="row col-12 viewDataCss mb-3">
                      <div className="col-md-4"><strong>Status:</strong> {user?.status ? <span className="text-success">Active</span> : <span className="text-danger">DeActive</span>}</div>
                      <div className="col-md-4"><strong>Created By:</strong> {user?.createdby || '-'}</div>
                      <div className="col-md-4"><strong>Modified By:</strong> {user?.modifiedby || '-'}</div>
                    </div>

                    {/* Timestamps */}
                    <div className="row col-12 viewDataCss mb-3">
                      <div className="col-md-4"><strong>Created Date:</strong> {user?.createdDate ? formatTimestamp(user.createdDate) : '-'}</div>
                      <div className="col-md-4"><strong>Modified Date:</strong> {user?.modifiedDate ? formatTimestamp(user.modifiedDate) : '-'}</div>
                      <div className="col-md-4"><strong>OTP Generated At:</strong> {user?.otpGeneratedAt ? formatTimestamp(user.otpGeneratedAt) : '-'}</div>
                    </div>

                    <div className="row col-12 viewDataCss mb-3">
                      <div className="col-md-4"><strong>OTP Expires:</strong> {user?.otpExpires ? formatTimestamp(user.otpExpires) : '-'}</div>
                      <div className="col-md-4"><strong>Subscribed At:</strong> {user?.subscribed_at ? formatTimestamp(user.subscribed_at) : '-'}</div>
                      <div className="col-md-4"><strong>Subscription Expiry Date:</strong> {user?.subscription_expiry_date ? formatTimestamp(user.subscription_expiry_date) : '-'}</div>
                    </div>

                    {/* End-User Fields (role_id === 3) */}
                    {user?.role_id === 3 && (
                      <div className="row col-12 viewDataCss mb-3">
                        <div className="col-md-4"><strong>Is Subscribed:</strong> {user?.is_subscribed ? 'Yes' : 'No'}</div>
                        <div className="col-md-4"><strong>Active Plan:</strong> {user?.active_label || '-'}</div>
                        <div className="col-md-4"><strong>Active Plan ID:</strong> {user?.active_plan_id || '-'}</div>
                      </div>
                    )}

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

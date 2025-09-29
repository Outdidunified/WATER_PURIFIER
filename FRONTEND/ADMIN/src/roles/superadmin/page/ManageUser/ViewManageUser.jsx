import React from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import { formatTimestamp } from "../../../../utils/formatTimestamp";
import useViewManageUser from "../../hooks/ManageUser/ViewManageUsersHooks";

const ViewManageUser = ({ userInfo, handleLogout }) => {
  const {
    user,
    endUserDevices,
    orders,
    technicianTasks,
    loading,
    error,
    handleBack,
    handleEditUser,
  } = useViewManageUser();

  return (
    <div className="container-scroller">
      {/* Header */}
      <Header userInfo={userInfo} handleLogout={handleLogout} />

      <div className="container-fluid page-body-wrapper">
        {/* Sidebar */}
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

            {/* ================= User Details ================= */}
            {/* ================= User Details ================= */}
<div className="row">
  <div className="col-lg-12 grid-margin stretch-card">
    <div className="card">
      <div className="card-body">
        <h4 className="card-title text-center pb-3">User Details</h4>
        <hr />

        {/* Basic Info */}
        <div className="row viewDataCss mb-3">
          <div className="col-md-4"><strong>User Name:</strong> {user?.name || "-"}</div>
          <div className="col-md-4"><strong>Email:</strong> {user?.email || "-"}</div>
          <div className="col-md-4"><strong>Phone:</strong> {user?.phone || "-"}</div>
        </div>

        <div className="row viewDataCss mb-3">
          <div className="col-md-4"><strong>Password:</strong> {user?.password || "-"}</div>
          <div className="col-md-4"><strong>Role:</strong> {user?.role_name || "-"}</div>
          <div className="col-md-4"><strong>User ID:</strong> {user?.user_id || "-"}</div>
        </div>

        {/* Address Info */}
        <div className="row viewDataCss mb-3">
          <div className="col-md-4"><strong>Address Line 1:</strong> {user?.addressline1 || "-"}</div>
          <div className="col-md-4"><strong>Address Line 2:</strong> {user?.addressline2 || "-"}</div>
          <div className="col-md-4"><strong>City:</strong> {user?.city || "-"}</div>
        </div>

        <div className="row viewDataCss mb-3">
          <div className="col-md-4"><strong>District:</strong> {user?.district || "-"}</div>
          <div className="col-md-4"><strong>State:</strong> {user?.state || "-"}</div>
          <div className="col-md-4"><strong>Country:</strong> {user?.country || "-"}</div>
        </div>

        <div className="row viewDataCss mb-3">
          <div className="col-md-4"><strong>Pincode:</strong> {user?.pincode || "-"}</div>
          <div className="col-md-4"><strong>Security Deposit:</strong> ₹{user?.security_deposit || 0}</div>
          <div className="col-md-4"><strong>Status:</strong>{" "}
            {user?.status ? <span className="text-success">Active</span> : <span className="text-danger">DeActive</span>}
          </div>
        </div>

        {/* Creator & Modifier */}
        <div className="row viewDataCss mb-3">
          <div className="col-md-4"><strong>Created By:</strong> {user?.createdby || "-"}</div>
          <div className="col-md-4"><strong>Modified By:</strong> {user?.modifiedby || "-"}</div>
          <div className="col-md-4"><strong>Created Date:</strong> {user?.createdDate ? formatTimestamp(user.createdDate) : "-"}</div>
        </div>

       
        {/* End-User Extra Fields */}
        {user?.role_id === 3 && (
          <div className="row viewDataCss mb-3">
            <div className="col-md-4"><strong>Is Subscribed:</strong> {user?.is_subscribed ? "Yes" : "No"}</div>
            <div className="col-md-4"><strong>Active Plan:</strong> {user?.active_label || "-"}</div>
            <div className="col-md-4"><strong>Active Plan ID:</strong> {user?.active_plan_id || "-"}</div>
          </div>
        )}

         <div className="row viewDataCss mb-3">
          <div className="col-md-4"><strong>Modified Date:</strong> {user?.modifiedDate ? formatTimestamp(user.modifiedDate) : "-"}</div>
          {user?.role_id === 2 && (
            <div className="col-md-4"><strong>Employee ID:</strong> {user?.technician_id || "-"}</div>
          )}
        </div>

      </div>
      
    </div>
  </div>
</div>


            {/* ================= End-User Role (role_id === 3) ================= */}
            {user?.role_id === 3 && (
              <>
                {/* Assigned Devices */}
                <div className="row">
                  <div className="col-lg-12 grid-margin stretch-card">
                    <div className="card">
                      <div className="card-body">
                        <h4 className="card-title">Assigned Devices</h4>
                        <hr />

                        {loading ? (
                          <div className="text-center py-4">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            >
                              <span className="sr-only">Loading...</span>
                            </div>
                            <p className="mt-2">
                              Loading assigned devices...
                            </p>
                          </div>
                        ) : error ? (
                          <div className="alert alert-danger">
                            <strong>Error:</strong> {error}
                          </div>
                        ) : endUserDevices.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-muted">
                              No devices assigned to this user.
                            </p>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-striped">
                              <thead>
                                <tr>
                                  <th>Device ID</th>
                                  <th>Model</th>
                                  <th>Status</th>
                                  <th>Subscription Status</th>
                                  <th>Subscription Started</th>
                                  <th>Subscription Expires</th>
                                </tr>
                              </thead>
                              <tbody>
                                {endUserDevices
                                  .filter(device => device.paymentStatus !== null) // <-- filter out devices with null payment
                                  .map((device, index) => (
                                    <tr key={index}>
                                      <td>{device.wp_device_id || "N/A"}</td>
                                      <td>{device.model_name || "N/A"}</td>
                                      <td>
                                      <span
                                        className={`badge ${
                                          device.status
                                            ? "badge-success"
                                            : "badge-secondary"
                                        }`}
                                      >
                                        {device.status ? "Active" : "Inactive"}
                                      </span>
                                    </td>
                                    <td>
                                      <span
                                        className={`badge ${
                                          device.subscriptionStatus === "Active"
                                            ? "badge-success"
                                            : device.subscriptionStatus === "Expired"
                                            ? "badge-danger"
                                            : device.subscriptionStatus === "Pending"
                                            ? "badge-warning"
                                            : "badge-secondary"
                                        }`}
                                      >
                                        {device.subscriptionStatus || "N/A"}
                                      </span>
                                    </td>
                                    <td>
                                      {device.subscriptionStartedAt
                                        ? formatTimestamp(device.subscriptionStartedAt)
                                        : "N/A"}
                                    </td>
                                    <td>
                                      {device.subscriptionExpiryDate
                                        ? formatTimestamp(device.subscriptionExpiryDate)
                                        : "N/A"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ================= Technician Role (role_id === 2) ================= */}
            {user?.role_id === 2 && (
              <div className="row">
                <div className="col-lg-12 grid-margin stretch-card">
                  <div className="card">
                    <div className="card-body">
                      <h4 className="card-title">
                        Working Devices & Task History
                      </h4>
                      <hr />

                      {loading ? (
                        <div className="text-center py-4">
                          <div
                            className="spinner-border text-primary"
                            role="status"
                          >
                            <span className="sr-only">Loading...</span>
                          </div>
                          <p className="mt-2">Loading technician tasks...</p>
                        </div>
                      ) : error ? (
                        <div className="alert alert-danger">
                          <strong>Error:</strong> {error}
                        </div>
                      ) : technicianTasks.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-muted">
                            No tasks found for this technician.
                          </p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>Task ID</th>
                                <th>Task Type</th>
                                <th>Device ID</th>
                                <th>Customer Details</th>
                                <th>Task Status</th>
                                <th>Assigned Date</th>
                                <th>Completed Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {technicianTasks.map((task, index) => (
                                <tr key={index}>
                                  <td>{task.task_id || "N/A"}</td>
                                  <td>
                                    <span
                                      className={`badge ${
                                        task.task_type === 1
                                          ? "badge-primary"
                                          : "badge-info"
                                      }`}
                                    >
                                      {task.task_type === 1
                                        ? "Installation"
                                        : "Service"}
                                    </span>
                                  </td>
                                  <td>
                                    {task.wp_device_id ||
                                      task.device_id ||
                                      "N/A"}
                                  </td>
                                  <td>
                                    {task.address ? (
                                      <div>
                                        <div>
                                          <strong>
                                            {task.address.name}
                                          </strong>
                                        </div>

                                      </div>
                                    ) : (
                                      "N/A"
                                    )}
                                  </td>
                                  <td>
                                    <span
                                      className={`badge ${
                                        task.task_status === "Completed"
                                          ? "badge-success"
                                          : task.task_status === "In Progress"
                                          ? "badge-warning"
                                          : task.task_status === "Pending"
                                          ? "badge-secondary"
                                          : "badge-light"
                                      }`}
                                    >
                                      {task.task_status || "N/A"}
                                    </span>
                                  </td>
                                  <td>
                                    {task.assigned_date
                                      ? formatTimestamp(task.assigned_date)
                                      : "N/A"}
                                  </td>
                                  <td>
                                    {task.completed_date
                                      ? formatTimestamp(task.completed_date)
                                      : "N/A"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ViewManageUser;

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
    handleDeviceNavigate,
    handleOrderNavigate,
  } = useViewManageUser();

  const resolveOrderForDevice = (device) => {
    if (!device) return null;
    const orderId = device.customOrderId || device.order_id || device.orderId || '';
    if (!orderId) return null;
    const matchedOrder = orders.find(
      (orderItem) =>
        orderItem.customOrderId === orderId ||
        orderItem._id === device.order_id ||
        orderItem._id === device.orderId
    );
    if (matchedOrder) return matchedOrder;
    return {
      customOrderId: orderId,
      _id: device.order_id || device.orderId || '',
      wp_device_id: device.wp_device_id || '',
      orderStatus: device.orderStatus || device.status || '',
      paymentStatus: device.paymentStatus || '',
      selectedPlan: device.selectedPlan || null,
      planStartDate: device.planStartDate || null,
    };
  };

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
          <div className="col-md-4 view-data-item"><span className="view-data-label">User Name</span><span className="view-data-value">{user?.name || "-"}</span></div>
          <div className="col-md-4 view-data-item"><span className="view-data-label">Email</span><span className="view-data-value">{user?.email || "-"}</span></div>
          <div className="col-md-4 view-data-item"><span className="view-data-label">Phone</span><span className="view-data-value">{user?.phone || "-"}</span></div>
        </div>

        <div className="row viewDataCss mb-3">
          <div className="col-md-4 view-data-item"><span className="view-data-label">Password</span><span className="view-data-value">{user?.password || "-"}</span></div>
          <div className="col-md-4 view-data-item"><span className="view-data-label">Role</span><span className="view-data-value">{user?.role_name || "-"}</span></div>
          <div className="col-md-4 view-data-item"><span className="view-data-label">User ID</span><span className="view-data-value">{user?.user_id || "-"}</span></div>
        </div>

        {/* Address Info */}
        <div className="row viewDataCss mb-3">
          <div className="col-md-4 view-data-item"><span className="view-data-label">Address Line 1</span><span className="view-data-value">{user?.addressline1 || "-"}</span></div>
          <div className="col-md-4 view-data-item"><span className="view-data-label">Address Line 2</span><span className="view-data-value">{user?.addressline2 || "-"}</span></div>
          <div className="col-md-4 view-data-item"><span className="view-data-label">City</span><span className="view-data-value">{user?.city || "-"}</span></div>
        </div>

        <div className="row viewDataCss mb-3">
          <div className="col-md-4 view-data-item"><span className="view-data-label">District</span><span className="view-data-value">{user?.district || "-"}</span></div>
          <div className="col-md-4 view-data-item"><span className="view-data-label">State</span><span className="view-data-value">{user?.state || "-"}</span></div>
          <div className="col-md-4 view-data-item"><span className="view-data-label">Country</span><span className="view-data-value">{user?.country || "-"}</span></div>
        </div>

        <div className="row viewDataCss mb-3">
          <div className="col-md-4 view-data-item"><span className="view-data-label">Pincode</span><span className="view-data-value">{user?.pincode || "-"}</span></div>
          <div className="col-md-4 view-data-item"><span className="view-data-label">Status</span><span className="view-data-value">
            {user?.status ? <span className="text-success">Active</span> : <span className="text-danger">DeActive</span>}
          </span></div>
           <div className="col-md-4 view-data-item"><span className="view-data-label">Created By</span><span className="view-data-value">{user?.createdby || "-"}</span></div>
        </div>

        {/* Creator & Modifier */}
        <div className="row viewDataCss mb-3">
         
          <div className="col-md-4 view-data-item"><span className="view-data-label">Modified By</span><span className="view-data-value">{user?.modifiedBy || "-"}</span></div>
          <div className="col-md-4 view-data-item"><span className="view-data-label">Created Date</span><span className="view-data-value">{user?.createdDate ? formatTimestamp(user.createdDate) : "-"}</span></div>
         <div className="col-md-4 view-data-item"><span className="view-data-label">Modified Date</span><span className="view-data-value">{user?.modifiedDate ? formatTimestamp(user.modifiedDate) : "-"}</span></div>
          
        </div>

       
        {/* End-User Extra Fields
        {user?.role_id === 3 && (
          <div className="row viewDataCss mb-3">
            <div className="col-md-4 view-data-item"><span className="view-data-label">Is Subscribed</span><span className="view-data-value">{user?.is_subscribed ? "Yes" : "No"}</span></div>
            <div className="col-md-4 view-data-item"><span className="view-data-label">Active Plan</span><span className="view-data-value">{user?.active_label || "-"}</span></div>
            <div className="col-md-4 view-data-item"><span className="view-data-label">Active Plan ID</span><span className="view-data-value">{user?.active_plan_id || "-"}</span></div>
          </div>
        )} */}

         <div className="row viewDataCss mb-3">
         
          {user?.role_id === 2 && (
            <div className="col-md-4 view-data-item"><span className="view-data-label">Employee ID</span><span className="view-data-value">{user?.technician_id || "-"}</span></div>
          )}
        </div>

      </div>
      
    </div>
  </div>
</div>


            {/* ================= End-User Role (role_id === 3) ================= */}
            {user?.role_id === 3 && (
              <div className="row">
                <div className="col-lg-12 grid-margin stretch-card">
                  <div className="card">
                    <div className="card-body">
                      <h4 className="card-title">Devices</h4>
                      <hr />

                      {loading ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="sr-only">Loading...</span>
                          </div>
                          <p className="mt-2">Loading assigned devices...</p>
                        </div>
                      ) : error ? (
                        <div className="alert alert-danger">
                          <strong>Error</strong> {error}
                        </div>
                      ) : endUserDevices.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-muted">No devices assigned to this user.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>Order ID</th>
                                <th>Device ID</th>
                                <th>Model</th>
                                <th>Status</th>
                                <th>Subscription Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {endUserDevices
                                .filter(device => device.paymentStatus !== null)
                                .map((device, index) => {
                                  const orderId = device.customOrderId || device.order_id || device.orderId || '';
                                  return (
                                    <tr key={index}>
                                      <td>
                                        {orderId ? (
                                          <button
                                            type="button"
                                            className="btn btn-link p-0 align-baseline"
                                            onClick={() => {
                                              const orderPayload = resolveOrderForDevice(device);
                                              if (orderPayload) {
                                                handleOrderNavigate(orderPayload);
                                              }
                                            }}
                                          >
                                            {orderId}
                                          </button>
                                        ) : (
                                          "N/A"
                                        )}
                                      </td>
                                      <td>
                                        {device.wp_device_id ? (
                                          <button
                                            type="button"
                                            className="btn btn-link p-0 align-baseline"
                                            onClick={() => handleDeviceNavigate(device)}
                                          >
                                            {device.wp_device_id}
                                          </button>
                                        ) : (
                                          "N/A"
                                        )}
                                      </td>
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
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
                        <div className={`alert ${error === 'No tasks found for this technician' ? 'alert-info' : 'alert-danger'}`}>
                          <strong>{error === 'No tasks found for this technician' ? 'Info:' : 'Error:'}</strong> {error}
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

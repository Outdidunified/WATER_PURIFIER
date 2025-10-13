//ViewInstallations
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import useViewInstallations from '../../hooks/ManageInstallations/useViewInstallationsHooks';

const ViewInstallations = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const installationTasks = useViewInstallations();

  const handleBack = () => {
    navigate('/superadmin/ManageInstallations');
  };

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');
  const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '-');

  return (
    <div className="container-scroller">
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="row">
              <div className="col-md-12 grid-margin">
                <div className="row">
                  <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                    <h3 className="font-weight-bold">Installation Tasks Details</h3>
                  </div>
                  <div className="col-12 col-xl-4">
                    <div className="justify-content-end d-flex">
                      <button type="button" className="btn btn-success" onClick={handleBack}>
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {installationTasks.length === 0 ? (
              <p>No installation tasks found.</p>
            ) : (
              installationTasks.map((task, index) => {
                const technician = task.technicianDetails || task.assignedTechnician || {};
                const serviceRecord =
                  task?.service_records && task.service_records.length > 0
                    ? task.service_records[0]
                    : {};
                const delivery = task.deliveryAddress || {};
                const deviceInfo = task.deviceDetails || task.device || {};
                const paymentDetails = task.paymentDetails || {};
                const planInfo = task.selectedPlan || serviceRecord?.plan_details || {};
                const durationInfo = task.selectedDuration || serviceRecord?.duration_details || {};

                const assignedDate =
                  task.task_assigned_date ||
                  serviceRecord.assigned_date ||
                  serviceRecord.assignedDate;
                const releasedDate =
                  task.task_released_date ||
                  serviceRecord.released_date ||
                  serviceRecord.releasedDate;
                const completedDate =
                  task.task_completed_date ||
                  serviceRecord.completed_date ||
                  serviceRecord.completedAt;
                const subscriptionExpiry =
                  task.subscriptionExpiryDate ||
                  task.subscription_expiry_date ||
                  serviceRecord.subscriptionExpiryDate ||
                  serviceRecord.subscription_expiry_date;
                const technicianPhone =
                  technician.technician_phone ||
                  technician.phone ||
                  technician.mobile ||
                  technician.contact_number ||
                  technician.contactNumber;
                const technicianEmail =
                  technician.technician_email ||
                  technician.email ||
                  technician.contactEmail;
                const technicianId =
                  technician.technician_id ||
                  serviceRecord.assigned_technician_id ||
                  task.assigned_technician_id;
                const technicianName = technician.technician_name || technician.name;
                const completionNotes =
                  task.task_completion_notes ||
                  serviceRecord.remarks ||
                  serviceRecord.completion_notes ||
                  serviceRecord.completionNotes;
                const releaseNotes =
                  serviceRecord.release_notes ||
                  serviceRecord.releaseNotes ||
                  serviceRecord.release_reason ||
                  serviceRecord.releaseReason;
                const taskStatus =
                  task.task_status ||
                  serviceRecord.task_status ||
                  serviceRecord.status ||
                  task.orderStatus;
                const assignedBy =
                  task.task_assigned_by || serviceRecord.assigned_by || serviceRecord.assignedBy;
                const releasedBy =
                  task.task_released_by || serviceRecord.released_by || serviceRecord.releasedBy;
                const grandTotal =
                  task.grandTotal ?? paymentDetails.grandTotal ?? paymentDetails.totalAmount;
                const totalLitre =
                  task.totalLitre ?? paymentDetails.totalLitre ?? deviceInfo.totalLitre;
                const durationLabel =
                  durationInfo?.duration_time_limit ||
                  durationInfo?.label ||
                  serviceRecord.duration ||
                  serviceRecord.duration_label;
                const planLabel =
                  planInfo?.label ||
                  planInfo?.name ||
                  serviceRecord.plan_name ||
                  serviceRecord.plan;
                const planCapacity =
                  planInfo?.capacity || serviceRecord.plan_capacity || serviceRecord.capacity;
                const deviceSerial =
                  task.serial_number ||
                  task.deviceSerial ||
                  deviceInfo.serial_number ||
                  deviceInfo.serialNumber;
                const customerEmail =
                  task.email || delivery.email || task.customerEmail || task.order_user_email;
                const customerPhone =
                  delivery.phone ||
                  delivery.mobile ||
                  delivery.contactNumber ||
                  task.phone ||
                  task.contactNumber;
                const addressLine1 =
                  delivery.addressLine1 || delivery.address1 || delivery.address || '';
                const addressLine2 =
                  delivery.addressLine2 || delivery.address2 || delivery.landmark || '';
                const fullAddress = [addressLine1, addressLine2].filter(Boolean).join(' ')|| delivery.street;
                const city = delivery.city || delivery.town || delivery.city_town || '';
                const district =
                  delivery.district || delivery.state_district || task.district || '';
                const state = delivery.state || delivery.province || task.state || '';
                const country = delivery.country || task.country || '';
                const pincode =
                  delivery.pincode || delivery.zipcode || delivery.postalCode || '';
                const razorpayOrderId =
                  task.razorpayOrderId ||
                  paymentDetails.razorpayOrderId ||
                  paymentDetails.orderId;
                const razorpayPaymentId =
                  task.razorpayPaymentId ||
                  paymentDetails.razorpayPaymentId ||
                  paymentDetails.paymentId;
                const createdAt =
                  task.createdAt ||
                  task.created_at ||
                  serviceRecord.created_at ||
                  serviceRecord.createdAt;
                const imageAfterService = task.image_after_service || serviceRecord.image_after_service || [];
                

                return (
                  <div
                    className="row"
                    key={task._id || task.task_id || task.wp_device_id || index}
                  >
                    <div className="col-lg-12 grid-margin stretch-card">
                      <div className="card">
                        <div className="card-body">
                          <h4 className="card-title text-center pb-3" style={{ color: '#007bff' }}>
                            Order ID: {task.customOrderId}
                          </h4>
                          <hr />

                          <div className="row viewDataCss">
                            <div className="col-md-4">
                              <strong>Model Name</strong>&nbsp;&nbsp; {task.modelName || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Device ID</strong> {task.wp_device_id || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Plan</strong> {planLabel || '-'}
                              {planCapacity ? ` (${planCapacity})` : ''}
                            </div>

                          </div>

                          <div className="row viewDataCss mt-2">
                            
                            <div className="col-md-4">
                              <strong>Duration</strong> {durationLabel || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Total Litre</strong> {totalLitre ?? '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Grand Total</strong>{' '}
                              {grandTotal !== undefined && grandTotal !== null
                                ? `₹${Number(grandTotal).toLocaleString()}`
                                : '-'}
                            </div>
                          </div>

                          <div className="row viewDataCss mt-2">
                            
                            <div className="col-md-4">
                                 <strong>Created At</strong> {formatDateTime(createdAt)}
                            </div>
                             <div className="col-md-4">
                              <strong>Order User ID</strong> {task.order_user_id || task.user_id || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Payment Status</strong>{' '}
                              {task.paymentStatus || paymentDetails.status || '-'}
                            </div>
                          </div>
                          <div className="row viewDataCss mt-2">                           
                            <div className="col-md-4">
                              <strong>Order Status</strong> {task.orderStatus || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Razorpay Order ID</strong> {razorpayOrderId || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Razorpay Payment ID</strong> {razorpayPaymentId || '-'}
                            </div>
                          </div>
                          <div className="row viewDataCss mt-4">
                            <div className="col-12">
                              <h5 className="font-weight-bold" style={{ color: '#007bff' }}>
                                Customer Details
                              </h5>
                              <hr />
                            </div>
                            <div className="col-md-4">
                              <strong>Name</strong> {delivery.name || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Email</strong> {customerEmail || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Phone</strong> {customerPhone || '-'}
                            </div>
                          </div>

                          <div className="row viewDataCss mt-2">
                            <div className="col-md-4">
                              <strong>Address</strong> {fullAddress || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>City</strong> {city || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>District</strong> {district || '-'}
                            </div>
                          </div>

                          <div className="row viewDataCss mt-2">
                            <div className="col-md-4">
                              <strong>State</strong> {state || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Country</strong> {country || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Pincode</strong> {pincode || '-'}
                            </div>
                          </div>

                          {/* <div className="row viewDataCss mt-4">
                            <div className="col-12">
                              <h5 className="font-weight-bold" style={{ color: '#007bff' }}>
                                Order & Payment Details
                              </h5>
                              <hr />
                            </div>
                            <div className="col-md-4">
                              <strong>Payment Status</strong>{' '}
                              {task.paymentStatus || paymentDetails.status || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Order Status</strong> {task.orderStatus || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Grand Total</strong>{' '}
                              {grandTotal !== undefined && grandTotal !== null
                                ? `₹${Number(grandTotal).toLocaleString()}`
                                : '-'}
                            </div>
                          </div>

                          <div className="row viewDataCss mt-2">
                            <div className="col-md-4">
                              <strong>Razorpay Order ID</strong> {razorpayOrderId || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Razorpay Payment ID</strong> {razorpayPaymentId || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Subscription Expiry</strong>{' '}
                              {formatDate(subscriptionExpiry)}
                            </div>
                          </div> */}
                                                    <div className="row viewDataCss mt-4">
                            <div className="col-12">
                              <h5 className="font-weight-bold" style={{ color: '#007bff' }}>
                                Technician Details
                              </h5>
                              <hr />
                            </div>
                            <div className="col-md-4">
                              <strong>Name</strong> {technicianName || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Technician ID</strong> {technicianId || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Email</strong> {technicianEmail || '-'}
                            </div>
                          </div>

                          <div className="row viewDataCss mt-2">
                            <div className="col-md-4">
                              <strong>Phone</strong> {technicianPhone || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Assigned Date</strong> {formatDateTime(assignedDate)}
                            </div>
                            <div className="col-md-4">
                              <strong>Assigned By</strong> {assignedBy || '-'}
                            </div>
                          </div>

                          {/* <div className="row viewDataCss mt-2">
                            <div className="col-md-4">
                              <strong>Released Date</strong> {formatDateTime(releasedDate)}
                            </div>
                            <div className="col-md-4">
                              <strong>Released By</strong> {releasedBy || '-'}
                            </div>
                            <div className="col-md-4">
                              <strong>Release Notes</strong> {releaseNotes || '-'}
                            </div>
                          </div> */}

                          <div className="row viewDataCss mt-2">
                            <div className="col-md-4">
                              <strong>Completion Date</strong> {formatDateTime(completedDate)}
                            </div>
                            {/* <div className="col-md-4">
                              <strong>Completion Notes</strong> {completionNotes || '-'}
                            </div> */}
                            <div className="col-md-4">
                              <strong>Task Status</strong> {taskStatus || '-'}
                            </div>
                          </div>
{/*
                          <div className="row viewDataCss mt-2">
                            <div className="col-md-4">
                              <strong>Subscription Expiry</strong>{' '}
                              {formatDate(subscriptionExpiry)}
                            </div>
                          </div> */}

                          {/* Image After Service */}
                          {imageAfterService?.length > 0 && (
                            <div className="row viewDataCss mt-3">
                              <div className="col-md-12">
                                <strong>After Service Images</strong>
                                <div className="row mt-2">
                                  {imageAfterService.map((img, idx) => (
                                    <div className="col-md-3 mb-2" key={idx}>
                                      <img
                                        src={`${img}`}
                                        alt={`After ${idx}`}
                                        className="img-fluid rounded"
                                        style={{ border: '1px solid #ccc', padding: '5px', maxHeight: '150px' }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ViewInstallations;
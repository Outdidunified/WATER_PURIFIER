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

  const extractDateValue = (value) => {
    if (!value) return null;
    if (typeof value === 'object' && value !== null && '$date' in value) {
      return value.$date;
    }
    return value;
  };

  const formatDate = (value) => {
    const dateValue = extractDateValue(value);
    return dateValue ? new Date(dateValue).toLocaleDateString() : '-';
  };
  const formatDateTime = (value) => {
    const dateValue = extractDateValue(value);
    return dateValue ? new Date(dateValue).toLocaleString() : '-';
  };

  const resolveTechnicianId = (record) => {
    if (!record) return '-';

    const toPlainString = (value) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value.trim();
      if (typeof value === 'number' || typeof value === 'bigint') return value.toString();
      if (typeof value === 'object') {
        if ('$date' in value) return toPlainString(value.$date);
        if ('$oid' in value) return toPlainString(value.$oid);
        if ('$numberInt' in value) return toPlainString(value.$numberInt);
        if ('$numberLong' in value) return toPlainString(value.$numberLong);
        if ('technician_id' in value) return toPlainString(value.technician_id);
        if ('assigned_technician_id' in value) return toPlainString(value.assigned_technician_id);
        if ('id' in value) return toPlainString(value.id);
        if (Array.isArray(value)) {
          for (const item of value) {
            const result = toPlainString(item);
            if (result) return result;
          }
          return '';
        }
        const stringValue = value.toString();
        return stringValue && stringValue !== '[object Object]' ? stringValue : '';
      }
      return '';
    };

    const values = [
      record.technician_id,
      record.assigned_technician_id,
      record.technicianId,
      record.assignedTechnicianId,
      record.technician_code,
      record.technicianCode,
      record.technicianID,
      record.technician_device_map_id,
      record.technician?.technician_id,
      record.technicianDetails?.technician_id,
      record.assignedTechnician?.technician_id,
      record.technician,
      record.technicianDetails,
      record.assignedTechnician,
    ];

    for (const value of values) {
      const resolved = toPlainString(value);
      if (resolved) return resolved;
    }

    return '-';
  };

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
                const assignmentHistoryRecords = Array.isArray(task.assignment_history)
                  ? task.assignment_history.map((entry) => {
                      const technicianIdValue =
                        resolveTechnicianId(entry) ||
                        entry.technician_id ||
                        entry.assigned_technician_id ||
                        entry.technicianId ||
                        entry.assignedTechnicianId ||
                        '';
                      const technicianNameValue =
                        entry.technician_name ||
                        entry.technicianName ||
                        entry.name ||
                        entry.technician?.technician_name ||
                        entry.technician?.name ||
                        entry.technicianDetails?.technician_name ||
                        entry.technicianDetails?.name ||
                        entry.assignedTechnician?.technician_name ||
                        entry.assignedTechnician?.name ||
                        '';

                      return {
                        technicianLabel:
                          [technicianIdValue, technicianNameValue].filter(Boolean).join(' - ') ||
                          technicianIdValue ||
                          technicianNameValue ||
                          '-',
                        technicianId: technicianIdValue || technicianNameValue || '-',
                        assignedBy: entry.assigned_by || '-',
                        assignedDate: entry.assigned_date || entry.assignedDate || null,
                        pendingReason:
                          entry.unassigned_reason ||
                          entry.unassignedReason ||
                          entry.pending_reason ||
                          entry.pendingReason ||
                          entry.pending_reason_text ||
                          entry.pendingReasonText ||
                          entry.reassigned_reason ||
                          entry.reassignedReason ||
                          '-',
                      };
                    })
                  : [];
                const serviceHistoryRecords = Array.isArray(task.service_records)
                  ? task.service_records.map((record) => {
                      const technicianIdValue =
                        resolveTechnicianId(record) ||
                        record.technician_id ||
                        record.assigned_technician_id ||
                        record.technicianId ||
                        record.assignedTechnicianId ||
                        record.technician_device_map_id ||
                        '';
                      const technicianNameValue =
                        record.technician_name ||
                        record.technicianName ||
                        record.name ||
                        record.technician?.technician_name ||
                        record.technician?.name ||
                        record.technicianDetails?.technician_name ||
                        record.technicianDetails?.name ||
                        record.assignedTechnician?.technician_name ||
                        record.assignedTechnician?.name ||
                        '';

                      return {
                        technicianLabel:
                          [technicianIdValue, technicianNameValue].filter(Boolean).join(' - ') ||
                          technicianIdValue ||
                          technicianNameValue ||
                          '-',
                        technicianId: technicianIdValue || technicianNameValue || '-',
                        assignedBy: record.assigned_by || record.assignedBy || '-',
                        assignedDate: record.assigned_date || record.assignedDate || null,
                        pendingReason:
                          record.pending_reason ||
                          record.pendingReason ||
                          record.pending_reason_text ||
                          record.pendingReasonText ||
                          record.reassigned_reason ||
                          record.reassignedReason ||
                          '-',
                      };
                    })
                  : [];
                const historyRows =
                  assignmentHistoryRecords.length > 0
                    ? assignmentHistoryRecords
                    : serviceHistoryRecords.length > 0
                    ? serviceHistoryRecords
                    : Array.isArray(task.assignment_history)
                    ? task.assignment_history.map((entry) => {
                        const technicianIdValue =
                          resolveTechnicianId(entry) ||
                          entry.technician_id ||
                          entry.assigned_technician_id ||
                          entry.technicianId ||
                          entry.assignedTechnicianId ||
                          '';
                        const technicianNameValue =
                          entry.technician_name ||
                          entry.technicianName ||
                          entry.name ||
                          entry.technician?.technician_name ||
                          entry.technician?.name ||
                          entry.technicianDetails?.technician_name ||
                          entry.technicianDetails?.name ||
                          entry.assignedTechnician?.technician_name ||
                          entry.assignedTechnician?.name ||
                          '';

                        return {
                          technicianLabel:
                            [technicianIdValue, technicianNameValue].filter(Boolean).join(' - ') ||
                            technicianIdValue ||
                            technicianNameValue ||
                            '-',
                          technicianId: technicianIdValue || technicianNameValue || '-',
                          assignedBy: entry.assigned_by || '-',
                          assignedDate: entry.assigned_date || null,
                          pendingReason:
                            entry.unassigned_reason ||
                            entry.unassignedReason ||
                            entry.pending_reason ||
                            entry.pendingReason ||
                            entry.pending_reason_text ||
                            entry.pendingReasonText ||
                            entry.reassigned_reason ||
                            entry.reassignedReason ||
                            '-',
                        };
                      })
                    : [];

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

                          {historyRows.length > 0 && (
                            <div className="row viewDataCss mt-4">
                              <div className="col-12">
                                <h5 className="font-weight-bold" style={{ color: '#007bff' }}>
                                  Assignment History
                                </h5>
                                <hr />
                                <div className="table-responsive">
                                  <table className="table table-striped">
                                    <thead>
                                      <tr>
                                        <th>#</th>
                                        <th>Technician</th>
                                        <th>Assigned By</th>
                                        <th>Assigned Date</th>
                                        <th>Pending Reason</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {historyRows.map((record, recordIndex) => (
                                        <tr key={`${record.technicianLabel || record.technicianId || 'row'}-${recordIndex}`}>
                                          <td>{recordIndex + 1}</td>
                                          <td>{record.technicianLabel || record.technicianId || '-'}</td>
                                          <td>{record.assignedBy || '-'}</td>
                                          <td>{formatDateTime(record.assignedDate)}</td>
                                          <td>{record.pendingReason || '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
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
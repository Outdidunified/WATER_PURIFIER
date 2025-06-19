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
              installationTasks.map((task) => (
                <div className="row" key={task._id}>
                  <div className="col-lg-12 grid-margin stretch-card">
                    <div className="card">
                      <div className="card-body">
                        <h4 className="card-title text-center pb-3">
                          Order ID: {task.customOrderId}
                        </h4>
                        <hr />

                        <div className="row viewDataCss">
                          <div className="col-md-4">
                            <strong>Model Name:</strong> {task.modelName || '-'}
                          </div>
                          <div className="col-md-4">
                            <strong>Device ID:</strong> {task.wp_device_id || '-'}
                          </div>
                          <div className="col-md-4">
                            <strong>Technician ID:</strong> {task.assigned_technician_id || '-'}
                          </div>
                        </div>

                        <div className="row viewDataCss mt-2">
                          <div className="col-md-4">
                            <strong>Plan:</strong> {task.selectedPlan?.label || '-'} (
                            {task.selectedPlan?.capacity || '-'})
                          </div>
                          <div className="col-md-4">
                            <strong>Duration:</strong> {task.selectedDuration?.duration_time_limit || '-'}
                          </div>
                          <div className="col-md-4">
                            <strong>Grand Total:</strong> ₹{task.grandTotal || '-'}
                          </div>
                        </div>

                        <div className="row viewDataCss mt-2">
                          <div className="col-md-4">
                            <strong>Payment Status:</strong> {task.paymentStatus || '-'}
                          </div>
                          <div className="col-md-4">
                            <strong>Order Status:</strong> {task.orderStatus || '-'}
                          </div>
                          <div className="col-md-4">
                            <strong>Subscription Expiry:</strong>{' '}
                            {task.subscriptionExpiryDate
                              ? new Date(task.subscriptionExpiryDate).toLocaleDateString()
                              : '-'}
                          </div>
                        </div>

                        <div className="row viewDataCss mt-2">
                          <div className="col-md-4">
                            <strong>Customer Name:</strong> {task.deliveryAddress?.name || '-'}
                          </div>
                          <div className="col-md-4">
                            <strong>Phone:</strong> {task.deliveryAddress?.phone || '-'}
                          </div>
                          <div className="col-md-4">
                            <strong>City:</strong> {task.deliveryAddress?.city || '-'}
                          </div>
                        </div>

                        <div className="row viewDataCss mt-2">
                          <div className="col-md-4">
                            <strong>Address:</strong>{' '}
                            {`${task.deliveryAddress?.addressLine1 || ''} ${task.deliveryAddress?.addressLine2 || ''}`.trim() || '-'}
                          </div>
                          <div className="col-md-4">
                            <strong>Pincode:</strong> {task.deliveryAddress?.pincode || '-'}
                          </div>
                          <div className="col-md-4">
                            <strong>Created At:</strong>{' '}
                            {task.createdAt ? new Date(task.createdAt).toLocaleString() : '-'}
                          </div>
                        </div>

                        <div className="row viewDataCss mt-2">
                          <div className="col-md-4">
                            <strong>Razorpay Order ID:</strong> {task.razorpayOrderId || '-'}
                          </div>
                          <div className="col-md-4">
                            <strong>Razorpay Payment ID:</strong> {task.razorpayPaymentId || '-'}
                          </div>
                          <div className="col-md-4">
                            <strong>Total Litre:</strong> {task.totalLitre || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}


export default ViewInstallations;

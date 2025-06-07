import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import { formatTimestamp } from '../../../../utils/formatTimestamp';
import useViewOrders from '../../hooks/ManageOrders/ViewOrdersHooks';
const ViewOrders = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const order = useViewOrders();

  const handleBack = () => {
    navigate('/superadmin/Manageorders');
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
                    <h3 className="font-weight-bold">Order Details</h3>
                  </div>
                  <div className="col-12 col-xl-4 d-flex justify-content-end">
                    <button type="button" className="btn btn-success" onClick={handleBack}>
                      Back
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title text-center mb-4">Order Information</h4>
                    <hr />

                    <div className="row viewDataCss">
                      <div className="col-md-4"><strong>Order ID:</strong> <span>{order.customOrderId || '-'}</span></div>
                      <div className="col-md-4"><strong>Model Name:</strong> <span>{order.modelName || '-'}</span></div>
                      <div className="col-md-4"><strong>Device ID:</strong> <span>{order.wp_device_id || '-'}</span></div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4"><strong>Plan:</strong> <span>{order.selectedPlan?.label || '-'}</span></div>
                      <div className="col-md-4"><strong>Capacity:</strong> <span>{order.selectedPlan?.capacity || '-'}</span></div>
                      <div className="col-md-4"><strong>Duration:</strong> <span>{order.selectedDuration?.duration_time_limit || '-'}</span></div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4"><strong>Price:</strong> ₹{order.price || '-'}</div>
                      <div className="col-md-4"><strong>Security Deposit:</strong> ₹{order.selectedDuration?.security_deposit || '-'}</div>
                      <div className="col-md-4"><strong>Discount:</strong> {order.selectedDuration?.discount || '-'}%</div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4"><strong>Payment Status:</strong> <span>{order.paymentStatus || '-'}</span></div>
                      <div className="col-md-4"><strong>Order Status:</strong> <span>{order.orderStatus || '-'}</span></div>
                      <div className="col-md-4"><strong>Installation Status:</strong> <span>{order.installation_status || '-'}</span></div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4"><strong>Created At:</strong> <span>{order.createdAt ? formatTimestamp(order.createdAt) : '-'}</span></div>
                      <div className="col-md-4"><strong>Updated At:</strong> <span>{order.updatedAt ? formatTimestamp(order.updatedAt) : '-'}</span></div>
                      <div className="col-md-4"><strong>Subscription Expiry:</strong> <span>{order.subscriptionExpiryDate ? formatTimestamp(order.subscriptionExpiryDate) : '-'}</span></div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4"><strong>Razorpay Order ID:</strong> <span>{order.razorpayOrderId || '-'}</span></div>
                      <div className="col-md-4"><strong>Razorpay Payment ID:</strong> <span>{order.razorpayPaymentId || '-'}</span></div>
                      <div className="col-md-4"><strong>Total Litre:</strong> <span>{order.totalLitre || '-'}</span></div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4"><strong>Customer Name:</strong> <span>{order.deliveryAddress?.name || '-'}</span></div>
                      <div className="col-md-4"><strong>Phone:</strong> <span>{order.deliveryAddress?.phone || '-'}</span></div>
                      <div className="col-md-4"><strong>Address:</strong> <span>{order.deliveryAddress?.addressLine1 || '-'}, {order.deliveryAddress?.city || '-'}, {order.deliveryAddress?.state || '-'} - {order.deliveryAddress?.pincode || '-'}</span></div>
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

export default ViewOrders;

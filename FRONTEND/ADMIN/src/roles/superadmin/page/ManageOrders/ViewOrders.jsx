//ViewOrders
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import { formatTimestamp } from '../../../../utils/formatTimestamp';
import useViewOrders from '../../hooks/ManageOrders/ViewOrdersHooks';
import HorizontalDeliveryTimeline from '../../components/DeliveryTimeline/HorizontalDeliveryTimeline';
import UpdateDeliveryStatusModal from '../../components/DeliveryTimeline/UpdateDeliveryStatusModal';
import classNames from 'classnames';
import { useMemo, useState } from 'react';
import './ViewOrders.css';

const DELIVERY_STATUS_LABELS = {
  accepted: 'Accepted',
  packed: 'Packed',
  intransit: 'In Transit',
  outfordelivery: 'Out for Delivery',
  completed: 'Completed',
};

const DELIVERY_STATUS_ORDER = ['accepted', 'packed', 'intransit', 'outfordelivery', 'completed'];

const formatPaymentType = (paymentType) => {
  if (!paymentType) return '-';
  const type = paymentType.toLowerCase();
  if (type.includes('cod') || type.includes('cash')) return 'COD';
  if (type.includes('online') || type.includes('razorpay') || type.includes('card')) return 'ONLINE';
  return paymentType.toUpperCase();
};

const ViewOrders = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    order,
    deliveryHistory,
    deliveryNotes,
    currentDeliveryStatus,
    isLoading,
    error,
    setOrder,
    refreshDeliveryDetails,
  } = useViewOrders();

  const handleBack = () => {
    navigate('/superadmin/ManageOrders');
  };

  const handleUpdateStatusClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleUpdateDeliveryStatus = async (updatedOrder) => {
    console.log('handleUpdateDeliveryStatus called with order:', updatedOrder?._id);
    // Merge updated order with existing order to preserve all fields including _id
    setOrder(prevOrder => ({
      ...prevOrder,
      ...updatedOrder
    }));
    // Refresh delivery details using the updated order's ID to ensure fresh data is fetched
    console.log('Refreshing delivery details for order:', updatedOrder?._id);
    await refreshDeliveryDetails(updatedOrder?._id);
    console.log('Delivery details refreshed successfully');
    // Don't close modal here - let modal close itself after showing success message
  };

  const timeline = useMemo(() => {
    const historyMap = (deliveryHistory || []).reduce((accumulator, entry) => {
      if (!entry?.status) return accumulator;
      const statusKey = entry.status.toLowerCase();
      if (!DELIVERY_STATUS_ORDER.includes(statusKey)) return accumulator;

      const existingEntry = accumulator.get(statusKey) || [];
      accumulator.set(statusKey, [...existingEntry, entry]);
      return accumulator;
    }, new Map());

    return DELIVERY_STATUS_ORDER.map((status) => {
      const updates = historyMap.get(status) || [];
      const latestUpdate = updates[updates.length - 1] || null;
      const isReached = status === currentDeliveryStatus || DELIVERY_STATUS_ORDER.indexOf(status) <= DELIVERY_STATUS_ORDER.indexOf(currentDeliveryStatus);
      const isActive = status === currentDeliveryStatus;

      // Use order timestamps for accepted and completed if no updates
      let timestamp = latestUpdate?.timestamp;
      if (!timestamp) {
        if (status === 'accepted' && order.deliveryAcceptanceTimestamp) {
          timestamp = order.deliveryAcceptanceTimestamp;
        } else if (status === 'completed' && order.deliveryCompletionTimestamp) {
          timestamp = order.deliveryCompletionTimestamp;
        } else if (isReached && order.deliveryCompletionTimestamp) {
          // For other completed statuses, use completion timestamp
          timestamp = order.deliveryCompletionTimestamp;
        }
      }

      return {
        status,
        label: DELIVERY_STATUS_LABELS[status] || status,
        isReached,
        isActive,
        updates,
        latestUpdate,
        timestamp,
      };
    });
  }, [deliveryHistory, currentDeliveryStatus]);

  const hasTimelineData = timeline.some((item) => item.updates.length > 0);

  const renderTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    try {
      return formatTimestamp(timestamp);
    } catch (dateError) {
      console.error('Failed to format delivery timeline timestamp', dateError);
      return timestamp;
    }
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
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Order ID</span><span className="view-data-value">{order.customOrderId || '-'}</span></div>
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Model Name</span><span className="view-data-value">{order.modelName || '-'}</span></div>
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Device ID</span><span className="view-data-value">{order.wp_device_id || '-'}</span></div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Plan</span><span className="view-data-value">{order.selectedPlan?.label || '-'}</span></div>
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Capacity</span><span className="view-data-value">{order.selectedPlan?.capacity || '-'}</span></div>
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Duration</span><span className="view-data-value">{order.selectedDuration?.duration_time_limit || '-'}</span></div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Price</span><span className="view-data-value">₹{order.grandTotal || '-'}</span></div>
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Security Deposit</span><span className="view-data-value">₹{order.selectedDuration?.security_deposit || '-'}</span></div>
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Discount</span><span className="view-data-value">{order.selectedDuration?.discount || '-'}%</span></div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Payment Type</span><span className="view-data-value">{formatPaymentType(order.paymentType || order.payment_type)}</span></div>
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Payment Status</span><span className="view-data-value">{order.paymentStatus || '-'}</span></div>
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Order Status</span><span className="view-data-value">{order.orderStatus || '-'}</span></div>
                    </div>

                    {order.paymentType !== 'COD' && order.payment_type !== 'COD' ? (
                      <div className="row viewDataCss mt-3">
                        {order.isRecharge ? (
                          <>
                            <div className="col-md-4 view-data-item"><span className="view-data-label">Order Type</span><span className="view-data-value">{order.orderType || '-'}</span></div>
                            <div className="col-md-4 view-data-item"><span className="view-data-label">Razorpay Order ID</span><span className="view-data-value">{order.razorpayOrderId || '-'}</span></div>
                            <div className="col-md-4 view-data-item"><span className="view-data-label">Razorpay Payment ID</span><span className="view-data-value">{order.razorpayPaymentId || '-'}</span></div>
                          </>
                        ) : (
                          <>
                            <div className="col-md-4 view-data-item"><span className="view-data-label">Installation Status</span><span className="view-data-value">{order.installation_status || '-'}</span></div>
                            <div className="col-md-4 view-data-item"><span className="view-data-label">Razorpay Order ID</span><span className="view-data-value">{order.razorpayOrderId || '-'}</span></div>
                            <div className="col-md-4 view-data-item"><span className="view-data-label">Razorpay Payment ID</span><span className="view-data-value">{order.razorpayPaymentId || '-'}</span></div>
                          </>
                        )}
                      </div>
                    ) : order.isRecharge ? (
                      <div className="row viewDataCss mt-3">
                        <div className="col-md-4 view-data-item"><span className="view-data-label">Order Type</span><span className="view-data-value">{order.orderType || '-'}</span></div>
                        <div className="col-md-4 view-data-item"><span className="view-data-label">Payment Collected At</span><span className="view-data-value">{order.paymentCollectedAt ? formatTimestamp(order.paymentCollectedAt) : '-'}</span></div>
                        <div className="col-md-4 view-data-item"><span className="view-data-label">Payment Collected By</span><span className="view-data-value">{order.paymentCollectedBy || '-'}</span></div>
                      </div>
                    ) : (
                      <div className="row viewDataCss mt-3">
                        <div className="col-md-4 view-data-item"><span className="view-data-label">Installation Status</span><span className="view-data-value">{order.installation_status || '-'}</span></div>
                        <div className="col-md-4 view-data-item"><span className="view-data-label">Current Delivery Status</span><span className="view-data-value text-capitalize">{currentDeliveryStatus || '-'}</span></div>
                        <div className="col-md-4 view-data-item"><span className="view-data-label">Delivery Accepted At</span><span className="view-data-value">{order.deliveryAcceptanceTimestamp ? formatTimestamp(order.deliveryAcceptanceTimestamp) : '-'}</span></div>
                      </div>
                    )}

                    {!order.isRecharge && order.paymentType !== 'COD' && order.payment_type !== 'COD' && (
                      <div className="row viewDataCss mt-3">
                        <div className="col-md-4 view-data-item"><span className="view-data-label">Current Delivery Status</span><span className="view-data-value text-capitalize">{currentDeliveryStatus || '-'}</span></div>
                        <div className="col-md-4 view-data-item"><span className="view-data-label">Delivery Accepted At</span><span className="view-data-value">{order.deliveryAcceptanceTimestamp ? formatTimestamp(order.deliveryAcceptanceTimestamp) : '-'}</span></div>
                        <div className="col-md-4 view-data-item"><span className="view-data-label">Delivery Completed At</span><span className="view-data-value">{order.deliveryCompletionTimestamp ? formatTimestamp(order.deliveryCompletionTimestamp) : '-'}</span></div>
                      </div>
                    )}

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Created At</span><span className="view-data-value">{order.createdAt ? formatTimestamp(order.createdAt) : '-'}</span></div>
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Updated At</span><span className="view-data-value">{order.updatedAt ? formatTimestamp(order.updatedAt) : '-'}</span></div>
                      {!order.isRecharge && (order.paymentType === 'COD' || order.payment_type === 'COD') ? (
                        <div className="col-md-4 view-data-item"><span className="view-data-label">Delivery Completed At</span><span className="view-data-value">{order.deliveryCompletionTimestamp ? formatTimestamp(order.deliveryCompletionTimestamp) : '-'}</span></div>
                      ) : (
                        <div className="col-md-4 view-data-item"><span className="view-data-label">Plan End Date</span><span className="view-data-value">{order.subscriptionExpiryDate ? formatTimestamp(order.subscriptionExpiryDate) : '-'}</span></div>
                      )}
                    </div>



                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Customer Name</span><span className="view-data-value">{order.deliveryAddress?.name || '-'}</span></div>
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Phone</span><span className="view-data-value">{order.deliveryAddress?.phone || '-'}</span></div>
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Street</span><span className="view-data-value">{order.deliveryAddress?.street || '-'}</span></div>
                    </div>
                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Landmark</span><span className="view-data-value">{order.deliveryAddress?.landmark || '-'}</span></div>
                      <div className="col-md-4 view-data-item"><span className="view-data-label">City</span><span className="view-data-value">{order.deliveryAddress?.city || '-'}</span></div>
                      <div className="col-md-4 view-data-item"><span className="view-data-label">District</span><span className="view-data-value">{order.deliveryAddress?.district || '-'}</span></div>
                    </div>
                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4 view-data-item"><span className="view-data-label">State</span><span className="view-data-value">{order.deliveryAddress?.state || '-'}</span></div>
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Pincode</span><span className="view-data-value">{order.deliveryAddress?.pincode || '-'}</span></div>
                      <div className="col-md-4 view-data-item"><span className="view-data-label">Email</span><span className="view-data-value">{order.deliveryAddress?.email || '-'}</span></div>
                    </div>

                    {!order.isRecharge && (
                      <div className="mt-5">
                        <h4 className="card-title mb-3">Delivery Timeline</h4>
                        
                        {/* Horizontal Timeline Component */}
                        <HorizontalDeliveryTimeline 
                          timeline={timeline}
                          currentDeliveryStatus={currentDeliveryStatus}
                          isLoading={isLoading}
                          error={error}
                        />

                        <div className="text-center mt-4 mb-4">
                          <button
                            type="button"
                            className={classNames("btn", {
                              "btn-warning": currentDeliveryStatus !== 'completed',
                              "btn-secondary": currentDeliveryStatus === 'completed'
                            })}
                            onClick={handleUpdateStatusClick}
                            disabled={currentDeliveryStatus === 'completed'}
                            title={currentDeliveryStatus === 'completed' ? "Delivery is completed" : "Update delivery status"}
                          >
                            📝 Update Delivery Status
                          </button>
                        </div>
                      </div>
                    )}

                   
                  </div>
                </div>
              </div>
            </div>
          </div>
                        
          
          {/* Update Delivery Status Modal */}
          <UpdateDeliveryStatusModal
            isOpen={isModalOpen}
            orderId={order?._id}
            currentStatus={currentDeliveryStatus}
            onClose={handleCloseModal}
            onUpdate={handleUpdateDeliveryStatus}
          />
          
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ViewOrders;

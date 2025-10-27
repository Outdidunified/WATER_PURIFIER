//ViewOrders
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import { formatTimestamp } from '../../../../utils/formatTimestamp';
import useViewOrders from '../../hooks/ManageOrders/ViewOrdersHooks';
import classNames from 'classnames';
import { useMemo } from 'react';

const DELIVERY_STATUS_LABELS = {
  accepted: 'Accepted',
  packed: 'Packed',
  intransit: 'In Transit',
  outfordelivery: 'Out for Delivery',
  completed: 'Completed',
};

const DELIVERY_STATUS_ORDER = ['accepted', 'packed', 'intransit', 'outfordelivery', 'completed'];

const ViewOrders = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const {
    order,
    deliveryHistory,
    deliveryNotes,
    currentDeliveryStatus,
    isLoading,
    error,
  } = useViewOrders();

  const handleBack = () => {
    navigate('/superadmin/ManageOrders');
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

      return {
        status,
        label: DELIVERY_STATUS_LABELS[status] || status,
        isReached,
        isActive,
        updates,
        latestUpdate,
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
                      <div className="col-md-4"><strong>Order ID</strong> <span>{order.customOrderId || '-'}</span></div>
                      <div className="col-md-4"><strong>Model Name</strong> <span>{order.modelName || '-'}</span></div>
                      <div className="col-md-4"><strong>Device ID</strong> <span>{order.wp_device_id || '-'}</span></div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4"><strong>Plan</strong> <span>{order.selectedPlan?.label || '-'}</span></div>
                      <div className="col-md-4"><strong>Capacity</strong> <span>{order.selectedPlan?.capacity || '-'}</span></div>
                      <div className="col-md-4"><strong>Duration</strong> <span>{order.selectedDuration?.duration_time_limit || '-'}</span></div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4"><strong>Price</strong> ₹{order.grandTotal || '-'}</div>
                      <div className="col-md-4"><strong>Security Deposit</strong> ₹{order.selectedDuration?.security_deposit || '-'}</div>
                      <div className="col-md-4"><strong>Discount</strong> {order.selectedDuration?.discount || '-'}%</div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4"><strong>Payment Status</strong> <span>{order.paymentStatus || '-'}</span></div>
                      <div className="col-md-4"><strong>Order Status</strong> <span>{order.orderStatus || '-'}</span></div>
                      <div className="col-md-4"><strong>Installation Status</strong> <span>{order.installation_status || '-'}</span></div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4"><strong>Current Delivery Status</strong> <span className="text-capitalize">{currentDeliveryStatus || '-'}</span></div>
                      <div className="col-md-4"><strong>Delivery Accepted At</strong> <span>{order.deliveryAcceptanceTimestamp ? formatTimestamp(order.deliveryAcceptanceTimestamp) : '-'}</span></div>
                      <div className="col-md-4"><strong>Delivery Completed At</strong> <span>{order.deliveryCompletionTimestamp ? formatTimestamp(order.deliveryCompletionTimestamp) : '-'}</span></div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4"><strong>Created At</strong> <span>{order.createdAt ? formatTimestamp(order.createdAt) : '-'}</span></div>
                      <div className="col-md-4"><strong>Updated At</strong> <span>{order.updatedAt ? formatTimestamp(order.updatedAt) : '-'}</span></div>
                      <div className="col-md-4"><strong>Subscription Expiry</strong> <span>{order.subscriptionExpiryDate ? formatTimestamp(order.subscriptionExpiryDate) : '-'}</span></div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4"><strong>Razorpay Order ID</strong> <span>{order.razorpayOrderId || '-'}</span></div>
                      <div className="col-md-4"><strong>Razorpay Payment ID</strong> <span>{order.razorpayPaymentId || '-'}</span></div>
                      <div className="col-md-4"><strong>Total Litre</strong> <span>{order.totalLitre || '-'}</span></div>
                    </div>

                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4"><strong>Customer Name</strong> <span>{order.deliveryAddress?.name || '-'}</span></div>
                      <div className="col-md-4"><strong>Phone</strong> <span>{order.deliveryAddress?.phone || '-'}</span></div>
                      <div className="col-md-4"><strong>Address</strong> <span>{order.deliveryAddress?.addressLine1 || '-'}, {order.deliveryAddress?.city || '-'}, {order.deliveryAddress?.state || '-'} - {order.deliveryAddress?.pincode || '-'}</span></div>
                    </div>
                    <div className="row viewDataCss mt-3">
                      <div className="col-md-4"><strong>Address Line 2</strong> <span>{order.deliveryAddress?.addressLine2 || '-'}</span></div>
                      <div className="col-md-4"><strong>Email</strong> <span>{order.deliveryAddress?.email || '-'}</span></div>
                    </div>

                    <div className="mt-5">
                      <div className="d-flex align-items-center justify-content-between">
                        <h4 className="card-title mb-0">Delivery Timeline</h4>
                        {isLoading && <span className="badge badge-info">Loading timeline...</span>}
                      </div>
                      {error && (
                        <div className="alert alert-danger mt-3" role="alert">
                          {error}
                        </div>
                      )}

                      {hasTimelineData ? (
                        <div className="mt-4 timeline-wrapper">
                          <ul className="timeline list-unstyled">
                            {timeline.map((item) => (
                              <li
                                key={item.status}
                                className={classNames('timeline-item', {
                                  'timeline-item--active': item.isActive,
                                  'timeline-item--reached': item.isReached,
                                })}
                              >
                                <div className="timeline-marker" />
                                <div className="timeline-content">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <h6 className="mb-1">{item.label}</h6>
                                    <span className="badge badge-outline-primary text-capitalize">{item.status}</span>
                                  </div>
                                  <p className="text-muted mb-2">
                                    {item.latestUpdate ? renderTimestamp(item.latestUpdate.timestamp) : 'Pending'}
                                  </p>
                                  {item.updates.length > 0 && (
                                    <div className="timeline-updates">
                                      {item.updates.map((update, index) => (
                                        <div key={`${item.status}-${index}`} className="timeline-update border rounded p-3 mb-2">
                                          <div className="d-flex justify-content-between align-items-start">
                                            <span className="font-weight-bold text-capitalize">{item.label}</span>
                                            <small className="text-muted">{renderTimestamp(update.timestamp)}</small>
                                          </div>
                                          {update.note && <p className="mt-2 mb-0">{update.note}</p>}
                                          {update.updatedBy && (
                                            <small className="text-muted d-block mt-1">Updated by: {update.updatedBy}</small>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="alert alert-secondary mt-4" role="alert">
                          Delivery timeline updates will appear here once available.
                        </div>
                      )}
                    </div>

                    {Array.isArray(deliveryNotes) && deliveryNotes.length > 0 && (
                      <div className="mt-5">
                        <h4 className="card-title">Delivery Notes</h4>
                        <div className="row">
                          {deliveryNotes.map((note, index) => (
                            <div key={index} className="col-md-6 mb-3">
                              <div className="card">
                                <div className="card-body">
                                  <h6 className="card-subtitle mb-2 text-muted">{note?.title || `Note ${index + 1}`}</h6>
                                  <p className="card-text">{note?.message || note?.note || '-'}</p>
                                  <div className="d-flex justify-content-between">
                                    <small className="text-muted">{note?.updatedBy || note?.author || 'System'}</small>
                                    <small className="text-muted">{renderTimestamp(note?.timestamp || note?.createdAt)}</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
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

export default ViewOrders;

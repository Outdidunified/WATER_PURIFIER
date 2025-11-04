//ManageOrders
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';
import { formatTimestamp } from '../../../../utils/formatTimestamp';
import useManageOrders from '../../hooks/ManageOrders/ManageOrdersHooks';
import { useNavigate } from 'react-router-dom';

const ManageOrders = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();

  const {
    orders,
    filteredOrders,
    loading,
    error,
    showEditForm,
    selectedOrder,
    editOrderStatus,
    editLoading,
    modalStyle,
    codConfirmationLoading,
    setEditOrderStatus,
    handleSearchInputChange,
    handleEditOrder,
    closeEditModal,
    updateOrderStatus,
    resolveDeviceId,
    confirmCodPayment,
  } = useManageOrders(userInfo);

  const [codConfirmation, setCodConfirmation] = useState({});

  // Initialize codConfirmation state based on order data
  // For COD orders: checked if moneyReceived is true
  // For non-COD orders: checked if paymentStatus is 'completed'
  useEffect(() => {
    const confirmationState = (filteredOrders || []).reduce((accumulator, order) => {
      const stateKey = buildConfirmationStateKey(order);

      if (!stateKey) {
        return accumulator;
      }

      if (!isCodPaymentEligible(order)) {
        accumulator[stateKey] = false;
        return accumulator;
      }

      accumulator[stateKey] = Boolean(order.moneyReceived);
      return accumulator;
    }, {});

    setCodConfirmation(confirmationState);
  }, [filteredOrders]);

  // Helper functions for Money Received checkbox logic
  const mapOrderToConfirmationKey = (order) => order.customOrderId || order._id; // Use customOrderId if available, else _id

  const buildConfirmationStateKey = (order) => {
    const keyBase = mapOrderToConfirmationKey(order);
    return keyBase ? `${keyBase}-money` : null; // Unique key for codConfirmation state
  };

  const isCodPaymentEligible = (order) => (order.paymentType || '').toUpperCase() === 'COD'; // Check if order is Cash on Delivery

  // Handle checkbox toggle for Money Received
  // Logic:
  // - If order already has moneyReceived=true or paymentStatus='completed', set checked
  // - If unchecking, ignore (prevents undoing confirmation)
  // - If not COD eligible, set unchecked
  // - For COD orders, call confirmCodPayment API to confirm payment
  // - On success, set checked; on failure, set unchecked
  const handleMoneyReceivedToggle = async (order, isChecked) => {
    console.log('=== handleMoneyReceivedToggle called ===', {
      orderId: order._id,
      customOrderId: order.customOrderId,
      isChecked,
      paymentType: order.paymentType,
      paymentStatus: order.paymentStatus,
      moneyReceived: order.moneyReceived,
      wp_device_id: order.wp_device_id,
      order_snapshot_wp_device_id: order?.order_snapshot?.wp_device_id,
    });

    if (!isChecked) {
      console.log('Checkbox unchecked - ignoring');
      return;
    }

    const stateKey = buildConfirmationStateKey(order);

    if (!stateKey) {
      console.error('Could not build confirmation state key');
      return;
    }

    // If already confirmed in backend, ensure UI reflects this
    if (order.moneyReceived) {
      console.log('Order already marked as received');
      setCodConfirmation((previousState) => ({
        ...previousState,
        [stateKey]: true,
      }));
      return;
    }

    // Only allow confirmation for COD payments
    if (!isCodPaymentEligible(order)) {
      console.log('Order is not COD payment eligible');
      setCodConfirmation((previousState) => ({
        ...previousState,
        [stateKey]: false,
      }));
      return;
    }

    const deviceId = resolveDeviceId(order);
    console.log('=== Resolved device ID ===', deviceId);

    if (!deviceId) {
      console.error('❌ Device ID is empty - cannot proceed');
      return;
    }

    const confirmationSucceeded = await confirmCodPayment({
      wp_device_id: deviceId,
      onSuccess: () => {
        console.log('✅ Payment confirmation succeeded');
        setCodConfirmation((previousState) => ({
          ...previousState,
          [stateKey]: true,
        }));
      },
    });

    console.log('📊 Confirmation result:', confirmationSucceeded);
    setCodConfirmation((previousState) => ({
      ...previousState,
      [stateKey]: confirmationSucceeded,
    }));
  };

  const ORDER_STATUSES = ['Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'badge badge-primary';
      case 'Processing':
        return 'badge badge-warning';
      case 'Shipped':
        return 'badge badge-info';
      case 'Delivered':
        return 'badge badge-success';
      case 'Cancelled':
        return 'badge badge-danger';
      default:
        return 'badge badge-secondary';
    }
  };



  const handleViewOrder = (dataItem) => {
    navigate(`/superadmin/ViewOrders`, { state: { dataItem } });
  };

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
                    <h3 className="font-weight-bold">Manage Orders</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Modal
            {showEditForm && (
              <div className="modalStyle" style={modalStyle}>
                <div className="modalContentStyle" style={{ maxHeight: '680px', overflowY: 'auto' }}>
                  <span onClick={closeEditModal} style={{ float: 'right', cursor: 'pointer', fontSize: '30px' }}>&times;</span>
                  <form className="pt-3" onSubmit={updateOrderStatus}>
                    <div className="card-body">
                      <div style={{ textAlign: 'center' }}>
                        <h2
                          className="card-title"
                          style={{
                            color: '#0056b3',
                            fontWeight: '300',
                            letterSpacing: '1.2px',
                            borderBottom: '1px solid #004494',
                            display: 'inline-block',
                            paddingBottom: '4px',
                            marginBottom: '20px',
                            fontFamily: 'Arial, sans-serif',  // simple, clean font

                          }}
                        >
                          Update Order Status
                        </h2>
                      </div>

                      <div className="form-group">
                        <label>Order ID</label>
                        <input type="text" className="form-control" value={selectedOrder?.customOrderId} disabled />
                      </div>

                      <div className="form-group">
                        <label>Order Status</label>
                        <select
                          className="form-control"
                          value={editOrderStatus}
                          onChange={(e) => setEditOrderStatus(e.target.value)}
                          required
                        >
                          <option value="">Select Status</option>
                          {ORDER_STATUSES.map((status) => {
                            const currentIndex = ORDER_STATUSES.indexOf(selectedOrder?.orderStatus);
                            const statusIndex = ORDER_STATUSES.indexOf(status);

                            return (
                              <option
                                key={status}
                                value={status}
                                disabled={statusIndex < currentIndex} // disable previous statuses
                              >
                                {status}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <ReusableButton
                        loading={editLoading}
                        type="submit"
                        disabled={
                          editLoading ||
                          !editOrderStatus ||
                          editOrderStatus === selectedOrder?.orderStatus
                        }
                      >
                        Update Status
                      </ReusableButton>

                    </div>
                  </form>
                </div>
              </div>
            )} */}

            {/* Order List Table */}
            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    {/* Header Section with Title and Search */}
                    <div className="row mb-3 align-items-center justify-content-between">
                      <div className="col-md-6">
                        <h4 className="card-title">List of Orders</h4>
                      </div>
                      <div className="col-md-4">
                        <div className="input-group" style={{ maxWidth: '400px' }}>
                          <div className="input-group-prepend hover-cursor">
                            <span className="input-group-text"><i className="icon-search"></i></span>
                          </div>
                          <InputField placeholder="Search now" onChange={handleSearchInputChange} />
                        </div>
                      </div>
                    </div>

                    {/* Table Section */}
                    <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <table className="table table-striped">
                        <thead style={{
                          textAlign: 'center',
                          position: 'sticky',
                          top: 0,
                          backgroundColor: '#fff',
                        }}>
                          <tr>
                            <th>Sl.No</th>
                            <th>Order ID</th>
                            <th>Model</th>
                            <th>Plan</th>
                            <th>Duration</th>
                            <th>User</th>
                            <th>Email</th>
                            <th>City</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Created At</th>
                            <th>Actions</th>
                            <th style={{ minWidth: '120px' }}>Money Received</th>
                          </tr>
                        </thead>
                        <tbody style={{ textAlign: 'center' }}>
                          {loading ? (
                            <tr><td colSpan="13">Loading...</td></tr>
                          ) : error ? (
                            <tr><td colSpan="13">Error: {error}</td></tr>
                          ) : (
                            (filteredOrders || []).length > 0 ? (
                              filteredOrders.map((order, index) => (
                                <tr key={order._id}>
                                  <td>{index + 1}</td>
                                  <td>{order.customOrderId}</td>
                                  <td>{order.modelName}</td>
                                  <td>{order.selectedPlan?.label}</td>
                                  <td>{order.selectedDuration?.duration_time_limit}</td>
                                  <td>{order.deliveryAddress?.name}</td>
                                  <td>{order.email || '-'}</td>
                                  <td>{order.deliveryAddress?.city}</td>
                                  <td>
                                    <span className={`badge-status badge-${order.orderStatus.toLowerCase()}`}>
                                      {order.orderStatus}
                                    </span>


                                  </td>
                                  <td className="align-middle">
                                    <span>{order.paymentStatus}</span>
                                  </td>
                                  <td>{formatTimestamp(order.createdAt)}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn btn-outline-success btn-icon-text"
                                      onClick={() => handleViewOrder(order)}
                                      style={{ marginRight: '10px' }}
                                    >
                                      <i className="mdi mdi-eye"></i> View
                                    </button>
                                   
                                  </td>
                                  <td className="align-middle" style={{ minWidth: '120px', padding: '12px' }}>
                                    <div className="form-check d-flex justify-content-center">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`money-received-${order._id}`}
                                        disabled={!isCodPaymentEligible(order) || codConfirmationLoading || Boolean(codConfirmation[buildConfirmationStateKey(order)])}
                                        checked={Boolean(codConfirmation[buildConfirmationStateKey(order)])}
                                        onChange={(event) => {
                                          const isChecked = event.target.checked;
                                          handleMoneyReceivedToggle(order, isChecked);
                                        }}
                                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="13">No orders found</td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
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

export default ManageOrders;

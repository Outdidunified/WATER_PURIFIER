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
    calculateOrderSummary,
    selectedFilter,
    handleFilterSelect,
  } = useManageOrders(userInfo);

  const orderSummary = calculateOrderSummary(orders);

  const cardGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '8px',
    width: '100%'
  };

  const getCardStyle = (isActive) => ({
    border: 'none',
    outline: 'none',
    borderRadius: '12px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: isActive ? '0 10px 20px rgba(76, 91, 253, 0.3)' : '0 4px 12px rgba(27, 37, 89, 0.12)',
    background: isActive ? 'linear-gradient(135deg, #4c5bfd 0%, #7c8bff 100%)' : '#f6f7ff',
    color: isActive ? '#ffffff' : '#1b2559',
    textAlign: 'left',
    width: '100%'
  });

  const getLabelStyle = (isActive) => ({
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    opacity: isActive ? 0.9 : 0.65,
    color: isActive ? 'rgba(255, 255, 255, 0.9)' : '#1b2559',
    whiteSpace: 'nowrap'
  });

  const getValueStyle = (isActive) => ({
    fontSize: '22px',
    fontWeight: 700,
    color: isActive ? '#ffffff' : '#1b2559'
  });

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
      order_id: order.customOrderId,
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
                <div className="row" style={{ marginBottom: '0px' }}>
              <div className="col-12" style={{ marginBottom: '10px' }}>
                <h3 className="font-weight-bold" style={{ marginBottom: '5px' }}>Manage Orders</h3>
              </div>
            </div>

            {/* Summary Cards Grid */}
            <div className="row mb-1" >
              <div className="col-12" style={{ marginBottom: '10px' }}>
                <div style={{ ...cardGridStyle, marginBottom: '10px' }}>
                  <button
                    type="button"
                    style={getCardStyle(selectedFilter === '')}
                    onClick={() => handleFilterSelect('')}
                  >
                    <span style={getLabelStyle(selectedFilter === '')}>All Orders</span>
                    <span style={getValueStyle(selectedFilter === '')}>{orderSummary.totalOrders}</span>
                  </button>
                  <button
                    type="button"
                    style={getCardStyle(selectedFilter === 'completed')}
                    onClick={() => handleFilterSelect('completed')}
                  >
                    <span style={getLabelStyle(selectedFilter === 'completed')}>Completed</span>
                    <span style={getValueStyle(selectedFilter === 'completed')}>{orderSummary.completedOrders}</span>
                  </button>
                  <button
                    type="button"
                    style={getCardStyle(selectedFilter === 'pending')}
                    onClick={() => handleFilterSelect('pending')}
                  >
                    <span style={getLabelStyle(selectedFilter === 'pending')}>Pending</span>
                    <span style={getValueStyle(selectedFilter === 'pending')}>{orderSummary.pendingOrders}</span>
                  </button>
                  <button
                    type="button"
                    style={getCardStyle(selectedFilter === 'paymentCompleted')}
                    onClick={() => handleFilterSelect('paymentCompleted')}
                  >
                    <span style={getLabelStyle(selectedFilter === 'paymentCompleted')}>Payment Done</span>
                    <span style={getValueStyle(selectedFilter === 'paymentCompleted')}>{orderSummary.paymentCompletedCOD + orderSummary.paymentCompletedOnline}</span>
                  </button>
                  <button
                    type="button"
                    style={getCardStyle(selectedFilter === 'paymentPending')}
                    onClick={() => handleFilterSelect('paymentPending')}
                  >
                    <span style={getLabelStyle(selectedFilter === 'paymentPending')}>Payment Pending</span>
                    <span style={getValueStyle(selectedFilter === 'paymentPending')}>{orderSummary.paymentPendingCOD + orderSummary.paymentPendingOnline}</span>
                  </button>
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
                    <div className="row mb-2 align-items-center justify-content-between">
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
                   <div className="table-responsive dynamic-table">
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
                            {/* <th>Email</th> */}
                            <th>City</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Created At</th>
                            <th>Actions</th>
                            <th style={{ minWidth: '120px' }}>Money Received</th>
                          </tr>
                        </thead>
                        <tbody style={{ textAlign: 'center', verticalAlign: 'middle', lineHeight: '1.0' }}>
                          {loading ? (
                            <tr style={{ height: '36px' }}><td colSpan="13">Loading...</td></tr>
                          ) : error ? (
                            <tr style={{ height: '36px' }}><td colSpan="13">Error: {error}</td></tr>
                          ) : (
                            (filteredOrders || []).length > 0 ? (
                              filteredOrders.map((order, index) => (
                                <tr key={order._id} style={{ height: '36px' }}>
                                  <td style={{ padding: '4px 2px' }}>{index + 1}</td>
                                  <td style={{ padding: '4px 2px' }}>{order.customOrderId}</td>
                                  <td style={{ padding: '4px 4px', maxWidth: '100px', wordWrap: 'break-word', wordBreak: 'break-word' }}>{order.modelName}</td>
                                  <td style={{ padding: '4px 2px', maxWidth: '60px', wordWrap: 'break-word', wordBreak: 'break-word' }}>{order.selectedPlan?.label}</td>
                                  <td style={{ padding: '4px 2px', maxWidth: '70px', wordWrap: 'break-word', wordBreak: 'break-word' }}>{order.selectedDuration?.duration_time_limit}</td>
                                  <td style={{ padding: '4px 4px', maxWidth: '200px', wordWrap: 'break-word', wordBreak: 'break-word' }}>{order.deliveryAddress?.name}</td>
                                  {/* <td style={{ padding: '4px 2px', maxWidth: '90px', wordWrap: 'break-word', wordBreak: 'break-word' }}>{order.email || '-'}</td> */}
                                  <td style={{ padding: '4px 2px', maxWidth: '100px', wordWrap: 'break-word', wordBreak: 'break-word' }}>{order.deliveryAddress?.city}</td>
                                  <td>
                                    <span className={`badge-status badge-${order.orderStatus.toLowerCase()}`}>
                                      {order.orderStatus}
                                    </span>


                                  </td>
                                  <td style={{ padding: '4px 2px' }} className="align-middle">
                                    <span>{order.paymentStatus}</span>
                                  </td>
                                  <td style={{ padding: '4px 2px' }}>{formatTimestamp(order.createdAt)}</td>
                                  <td style={{ padding: '4px 2px' }}>
                                    <button
                                      type="button"
                                      className="btn btn-outline-success btn-icon-text"
                                      onClick={() => handleViewOrder(order)}
                                      style={{ padding: '3px 6px', fontSize: '10px', marginRight: 0 }}
                                    >
                                      <i className="mdi mdi-eye"></i> View
                                    </button>
                                   
                                  </td>
                                  <td style={{ padding: '4px 2px', minWidth: '90px' }} className="align-middle">
                                    <div className="form-check d-flex justify-content-center">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`money-received-${order._id}`}
                                        disabled={!isCodPaymentEligible(order) || codConfirmationLoading || Boolean(codConfirmation[buildConfirmationStateKey(order)]) || userInfo.role_id !== 1}
                                        checked={Boolean(codConfirmation[buildConfirmationStateKey(order)])}
                                        onChange={(event) => {
                                          const isChecked = event.target.checked;
                                          handleMoneyReceivedToggle(order, isChecked);
                                        }}
                                        style={{ cursor: 'pointer', width: '18px', height: '18px', margin: '0 10px' }}
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

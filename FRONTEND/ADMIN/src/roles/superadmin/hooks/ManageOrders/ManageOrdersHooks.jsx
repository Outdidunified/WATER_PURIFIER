//ManageOrderHook
import { useState, useEffect, useRef } from 'react';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';
import axiosInstance from '../../../../utils/utils';

const useManageOrders = (userInfo) => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editLoading, setEditLoading] = useState(false);

    const [editOrderStatus, setEditOrderStatus] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [modalStyle, setModalStyle] = useState({ display: 'none' });
    const [codConfirmationLoading, setCodConfirmationLoading] = useState(false);

    const fetchOrdersCalled = useRef(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const isSeller = Number(userInfo?.role_id) === 4;
            const url = isSeller ? '/api/admin/orders/by-district' : 'api/admin/FetchOrders';
            const res = isSeller
              ? await axiosInstance.get(url, { params: { district: userInfo?.district } })
              : await axiosInstance.post(url);
            if (res.data.status === 'Success') {
                const sortedOrders = [...res.data.data].sort((a, b) => {
                    const toTimestamp = (order) => {
                        const rawDate =
                            order?.createdAt ||
                            order?.createddate ||
                            order?.orderDate ||
                            order?.order_snapshot?.createdAt ||
                            order?.order_snapshot?.orderDate;

                        if (!rawDate) return 0;
                        const date = new Date(rawDate);
                        return Number.isNaN(date.getTime()) ? 0 : date.getTime();
                    };

                    return toTimestamp(b) - toTimestamp(a);
                });

                setOrders(sortedOrders);
                setFilteredOrders(sortedOrders);
            } else {
                showErrorAlert('Error', 'Failed to fetch orders');
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Error fetching orders. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const confirmCodPayment = async ({ wp_device_id, onSuccess } = {}) => {
        if (!wp_device_id) {
            showErrorAlert('Error', 'Device ID missing. Unable to confirm payment.');
            return false;
        }

        try {
            setCodConfirmationLoading(true);
            const response = await axiosInstance.post('/api/admin/ConfirmCodPayment', {
                wp_device_id,
            });

            const responseStatus = (response?.data?.status || '').toString().toLowerCase();

            if (responseStatus === 'success') {
                showSuccessAlert('Success', response?.data?.message || 'COD payment confirmed successfully');
                if (typeof onSuccess === 'function') {
                    onSuccess();
                }
                await fetchOrders();
                return true;
            } else {
                showErrorAlert('Error', response?.data?.message || 'Failed to confirm COD payment');
                return false;
            }
        } catch (error) {
            console.error('Error confirming COD payment:', error);
            const message = error?.response?.data?.message || 'An error occurred while confirming COD payment';
            showErrorAlert('Error', message);
            return false;
        } finally {
            setCodConfirmationLoading(false);
        }
    };

    const resolveDeviceId = (order = {}) => order.wp_device_id || order?.order_snapshot?.wp_device_id || null;

    useEffect(() => {
        if (!fetchOrdersCalled.current) {
            fetchOrders();
            fetchOrdersCalled.current = true;
        }
    }, []);

  const handleSearchInputChange = (e) => {
  const inputValue = e.target.value.toUpperCase();
  const filtered = orders.filter((order) =>
    order.customOrderId?.toUpperCase().includes(inputValue) ||
    order.deliveryAddress?.name?.toUpperCase().includes(inputValue) ||
    order.email?.toUpperCase().includes(inputValue)|| 
    order.phoneNumber?.toUpperCase().includes(inputValue)
  );
  setFilteredOrders(filtered);
};



    const handleEditOrder = (order) => {
        setSelectedOrder(order);
        setEditOrderStatus(order.orderStatus);
        setShowEditForm(true);
        setModalStyle({ display: 'block' });
    };

    const closeEditModal = () => {
        setShowEditForm(false);
        setSelectedOrder(null);
        setEditOrderStatus('');
        setModalStyle({ display: 'none' });
    };

    const updateOrderStatus = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            const response = await axiosInstance.post('api/admin/UpdateOrdersStatus', {
                order_id: selectedOrder._id,
                orderStatus: editOrderStatus,
                modified_by: userInfo.email,
            });

            if (response.data.status === 'Success') {
                showSuccessAlert('Order status updated successfully');
                fetchOrders();
                closeEditModal();
            } else {
                showErrorAlert('Error', response.data.message || 'Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            const msg = error?.response?.data?.message || 'An error occurred while updating order status';
            showErrorAlert('Error', msg);
        } finally {
            setEditLoading(false);
        }
    };

    return {
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
    };
};

export default useManageOrders;

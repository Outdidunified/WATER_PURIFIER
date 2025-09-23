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

    const fetchOrdersCalled = useRef(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.post('api/admin/FetchOrders');
            if (res.data.status === 'Success') {
                setOrders(res.data.data);
                setFilteredOrders(res.data.data);
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
        order.deliveryAddress?.name?.toUpperCase().includes(inputValue)
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
        setEditOrderStatus,
        handleSearchInputChange,
        handleEditOrder,
        closeEditModal,
        updateOrderStatus,
    };
};

export default useManageOrders;

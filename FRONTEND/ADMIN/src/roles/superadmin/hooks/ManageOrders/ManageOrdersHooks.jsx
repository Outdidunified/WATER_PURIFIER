//ManageOrderHook
import { useState, useEffect, useRef } from 'react';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';
import axiosInstance from '../../../../utils/utils';
import OrderSearchService from '../../../../services/OrderSearchService';

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
    const [selectedFilter, setSelectedFilter] = useState('');
    const [searchText, setSearchText] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchOrdersCalled = useRef(false);
    const debouncedSearchRef = useRef(null);

    const fetchOrders = async (pageNum = 1, pageLimit = 10) => {
        try {
            setLoading(true);
            const isSeller = Number(userInfo?.role_id) === 4;
            const url = isSeller ? '/api/admin/orders/by-district' : '/api/admin/FetchOrders';
            const res = isSeller
              ? await axiosInstance.get(url, { params: { district: userInfo?.district, page: pageNum, limit: pageLimit } })
              : await axiosInstance.post(url, { page: pageNum, limit: pageLimit });
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
                
                if (res.data.pagination) {
                    setCurrentPage(res.data.pagination.currentPage);
                    setPageSize(res.data.pagination.pageSize);
                    setTotalRecords(res.data.pagination.totalRecords);
                    setTotalPages(res.data.pagination.totalPages);
                }
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

    const confirmCodPayment = async ({ wp_device_id, order_id, onSuccess } = {}) => {
        console.log('🔹 confirmCodPayment hook called with:', { wp_device_id, order_id });

        if (!wp_device_id || !order_id) {
            const errorMsg = 'Device ID or Order ID missing. Unable to confirm payment.';
            console.error('❌', errorMsg);
            showErrorAlert('Error', errorMsg);
            return false;
        }

        try {
            setCodConfirmationLoading(true);
            const response = await axiosInstance.post('/api/admin/ConfirmCodPayment', {
                wp_device_id,
                order_id,
            });

            console.log('✅ API Response received:', response.data);
            const responseStatus = (response?.data?.status || '').toString().toLowerCase();

            if (responseStatus === 'success') {
                console.log('✅ API confirmed success');
                showSuccessAlert('Success', response?.data?.message || 'COD payment confirmed successfully');
                if (typeof onSuccess === 'function') {
                    onSuccess();
                }
                await fetchOrders();
                await fetchOrderCounts();
                return true;
            } else {
                const errorMsg = response?.data?.message || 'Failed to confirm COD payment';
                console.error('❌ API returned non-success status:', errorMsg);
                showErrorAlert('Error', errorMsg);
                return false;
            }
        } catch (error) {
            console.error('❌ Error confirming COD payment:', error);
            const message = error?.response?.data?.message || error?.message || 'An error occurred while confirming COD payment';
            console.error('Full error details:', { 
                status: error?.response?.status,
                data: error?.response?.data,
                message 
            });
            showErrorAlert('Error', message);
            return false;
        } finally {
            setCodConfirmationLoading(false);
        }
    };

    const resolveDeviceId = (order = {}) => order.wp_device_id || order?.order_snapshot?.wp_device_id || null;

    const [orderCounts, setOrderCounts] = useState({
        totalOrders: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        pendingPayment: 0,
        cod: 0,
        online: 0
    });

    const fetchOrderCounts = async () => {
        try {
            const isSeller = Number(userInfo?.role_id) === 4;
            const params = isSeller ? { district: userInfo?.district } : {};
            const res = await axiosInstance.get('/api/admin/orders/counts', { params });
            if (res.data.status === 'Success') {
                setOrderCounts(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching order counts:', err);
        }
    };

    const calculateOrderSummary = (ordersList) => {
        const summary = {
            totalOrders: ordersList.length,
            pendingOrders: 0,
            completedOrders: 0,
            paymentCompletedCOD: 0,
            paymentCompletedOnline: 0,
            paymentPendingCOD: 0,
            paymentPendingOnline: 0,
            deliveryPending: 0,
            deliveryCompleted: 0,
        };

        ordersList.forEach((order) => {
            const paymentType = (order.paymentType || '').toUpperCase();
            const paymentStatus = (order.paymentStatus || '').toLowerCase();
            const orderStatus = order.orderStatus || '';
            const deliveryCompletionStatus = order.deliveryCompletionStatus;
            const deliveryHistory = order.deliveryHistory || [];
            const lastDeliveryStatus = deliveryHistory.length > 0 
                ? (deliveryHistory[deliveryHistory.length - 1]?.status || '').toLowerCase()
                : '';
            
            const isCOD = paymentType === 'COD';
            const isOnline = paymentType === 'ONLINE' || paymentType === 'RAZORPAY';
            const isPaymentCompleted = paymentStatus === 'completed' || paymentStatus === 'success';
            const isDeliveryCompleted = deliveryCompletionStatus === true || lastDeliveryStatus === 'completed' || isPaymentCompleted;

            if (isDeliveryCompleted) {
                summary.completedOrders += 1;
                if (deliveryCompletionStatus === true || lastDeliveryStatus === 'completed') {
                    summary.deliveryCompleted += 1;
                }
            } else {
                summary.pendingOrders += 1;
            }

            if (isPaymentCompleted) {
                if (isCOD) summary.paymentCompletedCOD += 1;
                if (isOnline) summary.paymentCompletedOnline += 1;
            } else {
                if (isCOD) summary.paymentPendingCOD += 1;
                if (isOnline) summary.paymentPendingOnline += 1;
            }

            if (!isDeliveryCompleted && orderStatus !== 'Cancelled') {
                summary.deliveryPending += 1;
            }
        });

        return summary;
    };

    useEffect(() => {
        if (!fetchOrdersCalled.current) {
            fetchOrders();
            fetchOrderCounts();
            fetchOrdersCalled.current = true;
        }
    }, []);

  const performSearch = async (term, page = 1, limit = 10) => {
    try {
      setLoading(true);
      const result = await OrderSearchService.performSearch(term, page, limit);
      setOrders(result.data);
      setFilteredOrders(result.data);
      setCurrentPage(result.pagination.currentPage);
      setPageSize(result.pagination.pageSize);
      setTotalRecords(result.totalCount);
      setTotalPages(Math.ceil(result.totalCount / limit) || 1);
    } catch (err) {
      console.error('Error performing search:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    setCurrentPage(1);
    
    if (!debouncedSearchRef.current) {
      debouncedSearchRef.current = OrderSearchService.debounceSearch(performSearch, 300);
    }
    
    debouncedSearchRef.current(value, 1, pageSize);
  };

  const applyFilters = (filterType, searchQuery) => {
    let filtered = orders;

    if (filterType === 'completed') {
      filtered = orders.filter(order => {
        const deliveryCompletionStatus = order.deliveryCompletionStatus;
        const deliveryHistory = order.deliveryHistory || [];
        const lastDeliveryStatus = deliveryHistory.length > 0 
          ? (deliveryHistory[deliveryHistory.length - 1]?.status || '').toLowerCase()
          : '';
        return deliveryCompletionStatus === true || lastDeliveryStatus === 'completed';
      });
    } else if (filterType === 'pending') {
      filtered = orders.filter(order => {
        const deliveryCompletionStatus = order.deliveryCompletionStatus;
        const deliveryHistory = order.deliveryHistory || [];
        const lastDeliveryStatus = deliveryHistory.length > 0 
          ? (deliveryHistory[deliveryHistory.length - 1]?.status || '').toLowerCase()
          : '';
        return !(deliveryCompletionStatus === true || lastDeliveryStatus === 'completed');
      });
    } else if (filterType === 'paymentCompleted') {
      filtered = orders.filter(order => {
        const paymentStatus = (order.paymentStatus || '').toLowerCase();
        return paymentStatus === 'completed' || paymentStatus === 'success';
      });
    } else if (filterType === 'paymentPending') {
      filtered = orders.filter(order => {
        const paymentStatus = (order.paymentStatus || '').toLowerCase();
        return !(paymentStatus === 'completed' || paymentStatus === 'success');
      });
    }

    if (searchQuery) {
      filtered = filtered.filter((order) =>
        order.customOrderId?.toUpperCase().includes(searchQuery) ||
        order.deliveryAddress?.name?.toUpperCase().includes(searchQuery) ||
        order.email?.toUpperCase().includes(searchQuery) || 
        order.phoneNumber?.toUpperCase().includes(searchQuery)
      );
    }

    setFilteredOrders(filtered);
  };

  const handleFilterSelect = (filterType) => {
    if (selectedFilter === filterType) {
      setSelectedFilter('');
    } else {
      setSelectedFilter(filterType);
    }
    fetchOrders(1, pageSize);
  };

  const getPaginatedData = () => {
    return orders;
  };

  const getTotalPages = () => {
    return totalPages;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchOrders(newPage, pageSize);
    }
  };

  const handlePageSizeChange = (newSize) => {
    fetchOrders(1, newSize);
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
            const response = await axiosInstance.post('/api/admin/UpdateOrdersStatus', {
                order_id: selectedOrder._id,
                orderStatus: editOrderStatus,
                modified_by: userInfo.email,
            });

            if (response.data.status === 'Success') {
                showSuccessAlert('Order status updated successfully');
                fetchOrders();
                fetchOrderCounts();
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
        calculateOrderSummary,
        orderCounts,
        fetchOrderCounts,
        selectedFilter,
        handleFilterSelect,
        currentPage,
        pageSize,
        totalRecords,
        totalPages,
        getPaginatedData,
        getTotalPages,
        handlePageChange,
        handlePageSizeChange,
    };
};

export default useManageOrders;

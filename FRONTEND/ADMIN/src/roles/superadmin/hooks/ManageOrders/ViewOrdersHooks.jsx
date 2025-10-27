//ViewOrderHooks
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../../../../utils/utils';

const DELIVERY_STATUS_ORDER = ['accepted', 'packed', 'intransit', 'outfordelivery', 'completed'];

const buildDeliveryHistory = (history = []) => {
  if (!Array.isArray(history)) return [];

  return history
    .map((entry, index) => {
      const status = typeof entry?.status === 'string' ? entry.status.toLowerCase() : '';
      return {
        status,
        // prefer explicit timestamp, fallback to createdAt, or null
        timestamp: entry?.timestamp || entry?.createdAt || null,
        note: entry?.note || '',
        updatedBy: entry?.updatedBy || entry?.updated_by || '',
        index,
      };
    })
    .filter((entry) => DELIVERY_STATUS_ORDER.includes(entry.status))
    .sort((a, b) => {
      const aIndex = DELIVERY_STATUS_ORDER.indexOf(a.status);
      const bIndex = DELIVERY_STATUS_ORDER.indexOf(b.status);
      if (aIndex === bIndex) {
        return new Date(a.timestamp || 0) - new Date(b.timestamp || 0);
      }
      return aIndex - bIndex;
    });
};

const getCurrentStatus = ({ deliveryAcceptanceStatus, deliveryCurrentStatus, orderStatus, paymentStatus }) => {
  const candidates = [
    deliveryAcceptanceStatus,
    deliveryCurrentStatus,
    orderStatus,
    paymentStatus,
  ]
    .map((value) => (typeof value === 'string' ? value.toLowerCase() : ''))
    .filter(Boolean);

  for (const status of DELIVERY_STATUS_ORDER) {
    if (candidates.includes(status)) {
      return status;
    }
  }

  return candidates[0] || '';
};

const useViewOrders = () => {
  const location = useLocation();

  const [order, setOrder] = useState({
    _id: '',
    customOrderId: '',
    user_id: '',
    productModelId: '',
    modelName: '',
    wp_device_id: '',
    selectedPlan: {
      plans_id: '',
      label: '',
      capacity: '',
      price: '',
    },
    selectedDuration: {
      duration_id: '',
      duration_time_limit: '',
      gst: '',
      discount: '',
      security_deposit: '',
    },
    grandTotal: '',
    deliveryAddress: {
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      email: '',
    },
    paymentStatus: '',
    orderStatus: '',
    razorpayOrderId: '',
    razorpayPaymentId: '',
    totalLitre: '',
    createdAt: '',
    updatedAt: '',
    subscriptionExpiryDate: '',
    installation_status: '',
    deliveryAcceptanceStatus: '',
    deliveryCurrentStatus: '',
    deliveryHistory: [],
    deliveryNotes: [],
    deliveryAcceptanceTimestamp: '',
    deliveryCompletionTimestamp: '',
  });

  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const mergeOrderData = useCallback((orderData = {}) => {
    const formattedOrder = {
      _id: orderData._id || '',
      customOrderId: orderData.customOrderId || '',
      user_id: orderData.user_id || '',
      productModelId: orderData.productModelId || '',
      modelName: orderData.modelName || '',
      wp_device_id: orderData.wp_device_id || '',
      selectedPlan: {
        plans_id: orderData.selectedPlan?.plans_id || '',
        label: orderData.selectedPlan?.label || '',
        capacity: orderData.selectedPlan?.capacity || '',
        price: orderData.selectedPlan?.price || '',
      },
      selectedDuration: {
        duration_id: orderData.selectedDuration?.duration_id || '',
        duration_time_limit: orderData.selectedDuration?.duration_time_limit || '',
        gst: orderData.selectedDuration?.gst || '',
        discount: orderData.selectedDuration?.discount || '',
        security_deposit: orderData.selectedDuration?.security_deposit || '',
      },
      grandTotal: orderData.grandTotal || '',
      deliveryAddress: {
        name: orderData.deliveryAddress?.name || '',
        phone: orderData.deliveryAddress?.phone || '',
        addressLine1: orderData.deliveryAddress?.addressLine1 || '',
        addressLine2: orderData.deliveryAddress?.addressLine2 || '',
        city: orderData.deliveryAddress?.city || '',
        state: orderData.deliveryAddress?.state || '',
        pincode: orderData.deliveryAddress?.pincode || '',
        email: orderData.deliveryAddress?.email || '',
      },
      paymentStatus: orderData.paymentStatus || '',
      orderStatus: orderData.orderStatus || '',
      razorpayOrderId: orderData.razorpayOrderId || '',
      razorpayPaymentId: orderData.razorpayPaymentId || '',
      totalLitre: orderData.totalLitre || '',
      createdAt: orderData.createdAt || '',
      updatedAt: orderData.updatedAt || '',
      subscriptionExpiryDate: orderData.subscriptionExpiryDate || '',
      installation_status: orderData.installation_status || '',
      deliveryAcceptanceStatus: orderData.deliveryAcceptanceStatus || '',
      deliveryCurrentStatus: orderData.deliveryCurrentStatus || '',
      deliveryAcceptanceTimestamp: orderData.deliveryAcceptanceTimestamp || '',
      deliveryCompletionTimestamp: orderData.deliveryCompletionTimestamp || '',
      deliveryHistory: Array.isArray(orderData.deliveryHistory) ? orderData.deliveryHistory : [],
      deliveryNotes: Array.isArray(orderData.deliveryNotes) ? orderData.deliveryNotes : [],
    };

    setOrder(formattedOrder);
    localStorage.setItem('orderData', JSON.stringify(formattedOrder));
    setDeliveryHistory(buildDeliveryHistory(formattedOrder.deliveryHistory));
    setDeliveryNotes(Array.isArray(formattedOrder.deliveryNotes) ? formattedOrder.deliveryNotes : []);
  }, []);

  useEffect(() => {
    const { dataItem } = location.state || {};

    if (dataItem) {
      const orderData = Array.isArray(dataItem) ? dataItem[0] : dataItem;
      mergeOrderData(orderData);
    } else {
      const savedData = localStorage.getItem('orderData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          mergeOrderData(parsedData);
        } catch (parseError) {
          console.error('Error parsing saved order data:', parseError);
        }
      }
    }
  }, [location, mergeOrderData]);

  const fetchDeliveryDetails = useCallback(async (orderId) => {
    if (!orderId) return;

    try {
      setIsLoading(true);
      setError('');
      const response = await axiosInstance.get(`/api/admin/orders/${orderId}/delivery-history`);

      const history = response?.data?.data?.history || response?.data?.data?.deliveryHistory || [];
      const notes = response?.data?.data?.notes || response?.data?.data?.deliveryNotes || [];
      const currentStatus = response?.data?.data?.currentStatus;

      const nextOrderState = {
        ...order,
        deliveryHistory: history,
        deliveryNotes: notes,
        deliveryCurrentStatus: currentStatus || getCurrentStatus({
          deliveryAcceptanceStatus: order.deliveryAcceptanceStatus,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
        }),
      };

      mergeOrderData(nextOrderState);
    } catch (requestError) {
      console.error('Failed to fetch delivery details', requestError);
      setError(requestError?.response?.data?.message || 'Failed to fetch delivery details');
    } finally {
      setIsLoading(false);
    }
  }, [mergeOrderData, order]);

  useEffect(() => {
    if (order?._id) {
      fetchDeliveryDetails(order._id);
    }
  }, [order?._id, fetchDeliveryDetails]);

  const currentDeliveryStatus = getCurrentStatus({
    deliveryAcceptanceStatus: order.deliveryAcceptanceStatus,
    deliveryCurrentStatus: order.deliveryCurrentStatus,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
  });

  return {
    order,
    deliveryHistory,
    deliveryNotes,
    currentDeliveryStatus,
    isLoading,
    error,
    refreshDeliveryDetails: () => fetchDeliveryDetails(order?._id),
  };
};

export default useViewOrders;

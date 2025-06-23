//ViewOrderHooks
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
      city: '',
      state: '',
      pincode: '',
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
  });

  useEffect(() => {
    const { dataItem } = location.state || {};
    console.log('dataItem from location.state:', dataItem);

    if (dataItem) {
      const orderData = Array.isArray(dataItem) ? dataItem[0] : dataItem;

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
          addressLine2:orderData.deliveryAddress?.addressLine2|| '',
          city: orderData.deliveryAddress?.city || '',
          state: orderData.deliveryAddress?.state || '',
          pincode: orderData.deliveryAddress?.pincode || '',
          email:orderData.deliveryAddress?.email|| '',
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
      };

      setOrder(formattedOrder);
      localStorage.setItem('orderData', JSON.stringify(formattedOrder));
    } else {
      const savedData = JSON.parse(localStorage.getItem('orderData'));
      if (savedData) {
        setOrder(savedData);
      }
    }
  }, [location]);

  return order;
};

export default useViewOrders;

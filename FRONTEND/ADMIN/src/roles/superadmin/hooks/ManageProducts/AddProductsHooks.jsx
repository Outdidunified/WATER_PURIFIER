import { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/utils';
import { useNavigate } from 'react-router-dom';
import {
  showConfirmationAlert,
  showErrorAlert,
  showSuccessAlert
} from '../../../../utils/alert';

const generateUniqueId = () => Date.now() + Math.floor(Math.random() * 1000);
const allowedDurations = ['28 days', '60 days', '90 days', '180 days', '360 days'];

const createEmptyPlan = () => ({
  plans_id: generateUniqueId(),
  label: '',
  capacity: '',
  price: ''
});

const createEmptyDuration = () => ({
  duration_id: generateUniqueId(),
  duration_time_limit: '',
  gst: '',
  discount: '',
  security_deposit: '',
  plans: [createEmptyPlan()],
  durationError: ''
});

const useAddProducts = (userInfo) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [modelName, setModelName] = useState('');
  const [modelType, setModelType] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [productSpecifications, setProductSpecifications] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [subImages, setSubImages] = useState([null, null, null, null]);

  const [wpDeviceQuantity, setWpDeviceQuantity] = useState(0);
  const [connectivity, setConnectivity] = useState([]);
  const [durations, setDurations] = useState([createEmptyDuration()]);
  const [errorMessage, setErrorMessage] = useState('');
  const [allDurationsUsed, setAllDurationsUsed] = useState(false);

  useEffect(() => {
    const usedDurations = durations
      .map(d => d.duration_time_limit?.toLowerCase().trim())
      .filter(d => d);
    const allUsed = allowedDurations.every(allowed => 
      usedDurations.includes(allowed.toLowerCase().trim())
    );
    setAllDurationsUsed(allUsed);
  }, [durations]);

  const backToManagePage = () => {
    navigate('/superadmin/ManageProducts');
  };

  const addSubImage = () => {
    const nonNullImages = subImages.filter(img => img !== null);
    if (nonNullImages.length >= 4) {
      showErrorAlert('Limit reached', 'You can add max 4 sub images.');
      return;
    }
    setSubImages([...subImages, null]);
  };

  const removeSubImage = (index) => {
    showConfirmationAlert({
      title: 'Are you sure?',
      text: 'Do you want to remove this sub image?',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'No, keep it',
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = [...subImages];
        updated[index] = null;
        setSubImages(updated);
        showSuccessAlert('Image removed');
      }
    });
  };

  const handleSubImageChange = (index, file) => {
    const updated = [...subImages];
    updated[index] = file;
    setSubImages(updated);
  };

  const addPlan = (durationIndex) => {
    setDurations(prevDurations => prevDurations.map((duration, idx) => {
      if (idx !== durationIndex) return duration;

      if (duration.plans.length >= 4) {
        showErrorAlert('Limit reached', 'You can add up to 4 plan types per duration.');
        return duration;
      }

      return {
        ...duration,
        plans: [...duration.plans, createEmptyPlan()]
      };
    }));
  };

  const removePlan = (durationIndex, planIndex) => {
    const currentDuration = durations[durationIndex];
    if (!currentDuration) return;

    if (currentDuration.plans.length === 1) {
      showErrorAlert('Not allowed', 'Each duration must have at least one plan.');
      return;
    }

    showConfirmationAlert({
      title: 'Are you sure?',
      text: 'Do you want to remove this plan?',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'No, keep it',
    }).then((result) => {
      if (result.isConfirmed) {
        setDurations(prevDurations => prevDurations.map((duration, idx) => {
          if (idx !== durationIndex) return duration;
          return {
            ...duration,
            plans: duration.plans.filter((_, i) => i !== planIndex)
          };
        }));
        showSuccessAlert('Plan removed');
      }
    });
  };

  const normalizePrice = (value) => {
    let sanitized = value.replace(/[^0-9.]/g, '');
    const dotCount = (sanitized.match(/\./g) || []).length;
    if (dotCount > 1) return null;

    if (sanitized.includes('.')) {
      const [integerPart, decimalPart] = sanitized.split('.');
      if (decimalPart && decimalPart.length > 2) return null;
      sanitized = `${integerPart}.${decimalPart ?? ''}`;
    }

    if (sanitized === '.') {
      sanitized = '0.';
    }

    return sanitized;
  };

  const handlePlanChange = (durationIndex, planIndex, field, rawValue) => {
    setDurations(prevDurations => prevDurations.map((duration, idx) => {
      if (idx !== durationIndex) return duration;

      const updatedPlans = duration.plans.map((plan, pIdx) => {
        if (pIdx !== planIndex) return plan;

        if (field === 'price') {
          const normalized = normalizePrice(rawValue);
          if (normalized === null) return plan;
          return { ...plan, price: normalized };
        }

        if (field === 'capacity') {
          const numericValue = rawValue.replace(/[^0-9]/g, '');
          return { ...plan, capacity: numericValue };
        }

        if (field === 'label') {
          const label = rawValue.toLowerCase();
          const capacity = label === 'unlimited' ? '' : plan.capacity || '';
          return { ...plan, label, capacity };
        }

        return { ...plan, [field]: rawValue };
      });

      return {
        ...duration,
        plans: updatedPlans
      };
    }));
  };

  const addDuration = () => {
    setDurations(prevDurations => [...prevDurations, createEmptyDuration()]);
  };

  const removeDuration = (index) => {
    if (durations.length === 1) {
      showErrorAlert('Not allowed', 'At least one duration is required.');
      return;
    }

    showConfirmationAlert({
      title: 'Are you sure?',
      text: 'Do you want to remove this duration?',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'No, keep it',
    }).then((result) => {
      if (result.isConfirmed) {
        setDurations(prevDurations => prevDurations.filter((_, i) => i !== index));
        showSuccessAlert('Duration removed');
      }
    });
  };

  const normalizeNumericInput = (rawValue, options = {}) => {
    const { allowDecimal = false, maxDecimals = 2, max = null } = options;
    let sanitized = rawValue.replace(/[^0-9.]/g, '');

    if (!allowDecimal) {
      return sanitized.replace(/\./g, '');
    }

    const dotCount = (sanitized.match(/\./g) || []).length;
    if (dotCount > 1) return null;

    if (sanitized.includes('.')) {
      const [integerPart, decimalPart] = sanitized.split('.');
      if (decimalPart && decimalPart.length > maxDecimals) return null;
      sanitized = `${integerPart}.${decimalPart ?? ''}`;
    }

    if (sanitized === '.') {
      sanitized = '0.';
    }

    const numericValue = sanitized === '' ? '' : Number(sanitized);
    if (max !== null && numericValue > max) return null;

    return sanitized;
  };

  const handleDurationChange = (index, field, value) => {
    if (field === 'duration_time_limit') {
      const normalizedValue = typeof value === 'string' ? value.trim() : value;
      const updatedDurations = durations.map((duration, idx) =>
        idx === index ? { ...duration, [field]: normalizedValue, durationError: '' } : duration
      );
      setDurations(updatedDurations);
      return;
    }

    const configMap = {
      gst: { allowDecimal: true, maxDecimals: 2, max: 100 },
      discount: { allowDecimal: true, maxDecimals: 2, max: 100 },
      security_deposit: { allowDecimal: true, maxDecimals: 2 }
    };

    const config = configMap[field];
    const normalizedValue = config ? normalizeNumericInput(value, config) : value;
    if (normalizedValue === null) return;

    const updatedDurations = durations.map((duration, idx) =>
      idx === index
        ? {
            ...duration,
            [field]: normalizedValue,
            durationError: ''
          }
        : duration
    );

    setDurations(updatedDurations);
  };

  const resetForm = () => {
    setModelName('');
    setModelType('');
    setProductDetails('');
    setProductSpecifications(null);
    setMainImage(null);
    setSubImages([null, null, null, null]);
    setWpDeviceQuantity(0);
    setConnectivity([]);
    setDurations([createEmptyDuration()]);
    setErrorMessage('');
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    const sanitizedConnectivity = Array.from(
      new Set(
        connectivity
          .filter((item) => typeof item === 'string' && item.trim() !== '')
          .map((item) => item.trim())
      )
    );

    if (!modelName || !modelType || !productDetails || !mainImage) {
      setErrorMessage('All required fields must be filled.');
      setLoading(false);
      return;
    }

    if (productSpecifications && productSpecifications.type !== 'application/pdf') {
      showErrorAlert('Invalid File', 'Product Specifications must be a PDF file.');
      setLoading(false);
      return;
    }

    if (sanitizedConnectivity.length === 0) {
      showErrorAlert('Missing Data', 'Please select at least one connectivity option.');
      setLoading(false);
      return;
    }

    if (!durations.length) {
      showErrorAlert('Missing Data', 'Please add at least one duration.');
      setLoading(false);
      return;
    }

    for (const duration of durations) {
      if (!duration.duration_time_limit) {
        showErrorAlert('Invalid Duration', 'Each duration must include a time limit.');
        setLoading(false);
        return;
      }

      if (
        duration.gst === '' || isNaN(Number(duration.gst)) ||
        duration.discount === '' || isNaN(Number(duration.discount)) ||
        duration.security_deposit === '' || isNaN(Number(duration.security_deposit))
      ) {
        showErrorAlert('Invalid Duration', 'GST, discount, and security deposit must be valid numbers.');
        setLoading(false);
        return;
      }

      if (!duration.plans.length) {
        showErrorAlert('Invalid Duration', 'Each duration must contain at least one plan.');
        setLoading(false);
        return;
      }

      for (const plan of duration.plans) {
        const label = plan.label?.toLowerCase();
        const requiresCapacity = label && label !== 'unlimited';
        if (
          !label ||
          (requiresCapacity && !plan.capacity) ||
          plan.price === '' ||
          isNaN(Number(plan.price))
        ) {
          showErrorAlert(
            'Invalid Plan',
            'Each plan must include a label, numeric price, and capacity unless it is unlimited.'
          );
          setLoading(false);
          return;
        }
      }
    }

    const formData = new FormData();
    formData.append('model_name', modelName);
    formData.append('model_type', modelType);
    formData.append('product_details', productDetails);
    if (productSpecifications) {
      formData.append('product_specifications', productSpecifications);
    }
    formData.append('wp_device_quantity', wpDeviceQuantity);
    formData.append('main_img', mainImage);

    subImages.forEach((img, i) => {
      if (img) {
        formData.append(`sub_img_${i + 1}`, img);
      }
    });

    const normalizedDurations = durations.map(duration => ({
      duration_id: duration.duration_id,
      duration_time_limit: duration.duration_time_limit.toLowerCase(),
      gst: Number(duration.gst),
      discount: Number(duration.discount),
      security_deposit: Number(duration.security_deposit),
      plans: duration.plans.map(plan => ({
        plans_id: plan.plans_id,
        label: plan.label.toLowerCase(),
        capacity: plan.label.toLowerCase() === 'unlimited' ? '' : plan.capacity,
        price: Number(plan.price)
      }))
    }));

    formData.append('duration', JSON.stringify(normalizedDurations));
    formData.append('createdby', userInfo.email);
    formData.append('connectivity', sanitizedConnectivity.join(', '));

    try {
      const response = await axiosInstance.post('/api/admin/AddProductModels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setLoading(false);
      if (response.data.status === 'Success') {
        showSuccessAlert('Product added successfully');
        resetForm();
        backToManagePage();
      } else {
        showErrorAlert('Failed', response.data.message || 'Product creation failed.');
      }
    } catch (error) {
      setLoading(false);
      const errMsg = error?.response?.data?.message || error.message;
      showErrorAlert('Error', `An error occurred: ${errMsg}`);
    }
  };

  return {
    loading,
    errorMessage,
    modelName,
    setModelName,
    productDetails,
    setProductDetails,
    productSpecifications,
    setProductSpecifications,
    mainImage,
    setMainImage,
    subImages,
    addSubImage,
    removeSubImage,
    handleSubImageChange,
    connectivity,
    setConnectivity,
    durations,
    addDuration,
    handleDurationChange,
    removeDuration,
    addPlan,
    removePlan,
    handlePlanChange,
    wpDeviceQuantity,
    setWpDeviceQuantity,
    handleAddProduct,
    modelType,
    setModelType,
    allDurationsUsed,
  };
};

export default useAddProducts;
//AddProductHook
import { useState, useRef } from 'react';
import axiosInstance from '../../../../utils/utils';
import { useNavigate } from 'react-router-dom';
import {
  showConfirmationAlert,
  showErrorAlert,
  showSuccessAlert
} from '../../../../utils/alert';

const useAddProducts = (userInfo) => {
  const navigate = useNavigate();
  const fetchDataCalled = useRef(false);
  const [loading, setLoading] = useState(false);

  const [modelName, setModelName] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [productSpecifications, setProductSpecifications] = useState(null); // Now storing PDF File
  const [mainImage, setMainImage] = useState(null); // Now storing File
  const [subImages, setSubImages] = useState([null, null, null, null]); // Up to 4

  const [wpDeviceQuantity, setWpDeviceQuantity] = useState(0);
  const [connectivity, setConnectivity] = useState([]);
  const [plans, setPlans] = useState([{ plans_id: 1, label: '', capacity: '', price: '' }]);
  const [durations, setDurations] = useState([
    {
      duration_id: 1,
      duration_time_limit: '28 days',
      gst: '',
      discount: '',
      security_deposit: '',
      durationError: ''
    }
  ]);
  const [errorMessage, setErrorMessage] = useState('');

  const backToManagePage = () => {
    navigate('/superadmin/ManageProducts');
  };

  const addSubImage = () => {
    const nonNullImages = subImages.filter(img => img !== null);
    if (nonNullImages.length >= 4) {
      showErrorAlert("Limit reached", "You can add max 4 sub images.");
      return;
    }
    setSubImages([...subImages, null]);
  };

  const removeSubImage = (index) => {
    showConfirmationAlert({
      title: "Are you sure?",
      text: "Do you want to remove this sub image?",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "No, keep it",
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = [...subImages];
        updated[index] = null;
        setSubImages(updated);
        showSuccessAlert("Image removed");
      }
    });
  };

  const removeDuration = (index) => {
    showConfirmationAlert({
      title: "Are you sure?",
      text: "Do you want to remove this duration?",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "No, keep it",
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = durations.filter((_, i) => i !== index);
        setDurations(updated);
        showSuccessAlert("Duration removed");
      }
    });
  };

  const removePlan = (index) => {
    showConfirmationAlert({
      title: "Are you sure?",
      text: "Do you want to remove this plan?",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "No, keep it",
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = plans.filter((_, i) => i !== index);
        setPlans(updated);
        showSuccessAlert("Plan removed");
      }
    });
  };

  const handleSubImageChange = (index, file) => {
    const updated = [...subImages];
    updated[index] = file;
    setSubImages(updated);
  };

  const addPlan = () => {
    setPlans([
      ...plans, 
      { plans_id: Date.now(), label: '', capacity: '', price: '' }
    ]);
  };

  const handlePlanChange = (index, field, value) => {
    setPlans(prevPlans => {
      const updatedPlans = prevPlans.map((plan, idx) =>
        idx === index ? { ...plan, [field]: value } : plan
      );

      if (field === 'label' && value.toLowerCase() === 'unlimited') {
        updatedPlans[index] = { ...updatedPlans[index], capacity: '' };
      }

      return updatedPlans;
    });
  };

  const addDuration = () => {
    setDurations([
      ...durations,
      {
        duration_id: Date.now(),
        duration_time_limit: '28 days',
        gst: '',
        discount: '',
        security_deposit: '',
        durationError: ''
      }
    ]);
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
    const updatedDurations = durations.map((duration, idx) =>
      idx === index ? { ...duration, [field]: value } : duration
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




  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!modelName || !productDetails || !mainImage) {
      setErrorMessage("All required fields must be filled.");
      setLoading(false);
      return;
    }

    // Validate PDF file if provided
    if (productSpecifications && productSpecifications.type !== 'application/pdf') {
      showErrorAlert("Invalid File", "Product Specifications must be a PDF file.");
      setLoading(false);
      return;
    }

    if (connectivity.length === 0) {
      showErrorAlert("Missing Data", "Please select at least one connectivity option.");
      setLoading(false);
      return;
    }

    if (plans.length === 0 || durations.length === 0) {
      showErrorAlert("Missing Data", "Please add at least one plan and one duration.");
      setLoading(false);
      return;
    }

    for (let plan of plans) {
      const requiresCapacity = plan.label && plan.label.toLowerCase() !== 'unlimited';
      if (
        !plan.label ||
        (requiresCapacity && !plan.capacity) ||
        plan.price === '' ||
        isNaN(Number(plan.price))
      ) {
        showErrorAlert(
          "Give valid Plan",
          "Each plan must include a label, numeric price, and capacity unless it is unlimited."
        );
        setLoading(false);
        return;
      }
    }

    for (let dur of durations) {
      if (
        !dur.duration_time_limit ||
        dur.gst === '' || isNaN(Number(dur.gst)) ||
        dur.discount === '' || isNaN(Number(dur.discount)) ||
        dur.security_deposit === '' || isNaN(Number(dur.security_deposit))
      ) {
        showErrorAlert("Give Valid Duration", "Each duration must have valid data.");
        setLoading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('model_name', modelName);
    formData.append('product_details', productDetails);
    formData.append('product_specifications', productSpecifications);
    formData.append('wp_device_quantity', wpDeviceQuantity);
    formData.append('connectivity', connectivity.join(', '));
    formData.append('main_img', mainImage);

    subImages.forEach((img, i) => {
      if (img) {
        formData.append(`sub_img_${i + 1}`, img);
      }
    });

    formData.append('plans', JSON.stringify(plans.map(plan => ({
      ...plan,
      price: Number(plan.price)
    }))));

    formData.append('duration', JSON.stringify(durations.map(dur => ({
      ...dur,
      duration_time_limit: dur.duration_time_limit.toLowerCase(),
      gst: Number(dur.gst),
      discount: Number(dur.discount),
      security_deposit: Number(dur.security_deposit)
    }))));

    formData.append('createdby', userInfo.email);

    try {
      const response = await axiosInstance.post('api/admin/AddProductModels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setLoading(false);
      if (response.data.status === 'Success') {
        showSuccessAlert("Product added successfully");

        // Reset form
        setModelName('');
        setProductDetails('');
        setProductSpecifications(null);
        setMainImage(null);
        setSubImages([null, null, null, null]);
        setWpDeviceQuantity(0);
        setConnectivity([]);
        setPlans([{ plans_id: 1, label: '', capacity: '', price: '' }]);
        setDurations([
          { duration_id: 1, duration_time_limit: '', gst: '', discount: '', security_deposit: '' }
        ]);

        backToManagePage();
      } else {
        showErrorAlert("Failed", response.data.message || "Product creation failed.");
      }
    } catch (error) {
      setLoading(false);
      const errMsg = error?.response?.data?.message || error.message;
      showErrorAlert("Error", `An error occurred: ${errMsg}`);
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
    plans,
    addPlan,
    handlePlanChange,
    durations,
    addDuration,
    handleDurationChange,
    removeDuration,
    wpDeviceQuantity,
    setWpDeviceQuantity,
    handleAddProduct,
    removePlan
  };
};

export default useAddProducts;

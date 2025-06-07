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
  const [productSpecifications, setProductSpecifications] = useState('');
  const [mainImage, setMainImage] = useState(null); // Now storing File
  const [subImages, setSubImages] = useState([null, null, null, null]); // Up to 4

  const [wpDeviceQuantity, setWpDeviceQuantity] = useState(0);
  const [plans, setPlans] = useState([{ plans_id: 1, label: '', capacity: '', price: '' }]);
  const [durations, setDurations] = useState([
    { duration_id: 1, duration_time_limit: '', gst: '', discount: '', security_deposit: '' },
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
    const updatedPlans = plans.map((plan, idx) =>
      idx === index ? { ...plan, [field]: value } : plan
    );
    setPlans(updatedPlans);
  };

  const addDuration = () => {
    setDurations([
      ...durations,
      {
        duration_id: Date.now(),
        duration_time_limit: '',
        gst: '',
        discount: '',
        security_deposit: ''
      }
    ]);
  };

  const handleDurationChange = (index, field, value) => {
    const updatedDurations = durations.map((duration, idx) =>
      idx === index ? { ...duration, [field]: value } : duration
    );
    setDurations(updatedDurations);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!modelName || !productDetails || !productSpecifications || !mainImage) {
      setErrorMessage("All required fields must be filled.");
      setLoading(false);
      return;
    }

    if (plans.length === 0 || durations.length === 0) {
      showErrorAlert("Missing Data", "Please add at least one plan and one duration.");
      setLoading(false);
      return;
    }

    for (let plan of plans) {
      if (!plan.label || !plan.capacity || plan.price === '' || isNaN(Number(plan.price))) {
        showErrorAlert("Invalid Plan", "Each plan must have label, capacity, and numeric price.");
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
        showErrorAlert("Invalid Duration", "Each duration must have valid data.");
        setLoading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('model_name', modelName);
    formData.append('product_details', productDetails);
    formData.append('product_specifications', productSpecifications);
    formData.append('wp_device_quantity', wpDeviceQuantity);
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
        setProductSpecifications('');
        setMainImage(null);
        setSubImages([null, null, null, null]);
        setWpDeviceQuantity(0);
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

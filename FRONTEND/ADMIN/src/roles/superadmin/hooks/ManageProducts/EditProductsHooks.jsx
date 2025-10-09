import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../../utils/utils';
import {
  showConfirmationAlert,
  showErrorAlert,
  showSuccessAlert
} from '../../../../utils/alert';

const useEditProducts = (userInfo) => {
  const navigate = useNavigate();
  const location = useLocation();
  const fetchDataCalled = useRef(false);
  const originalDataRef = useRef(null); // Store original data for comparison

  const [modelId, setModelId] = useState(null);
  const [modelName, setModelName] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [productSpecifications, setProductSpecifications] = useState(null); // Now storing PDF File
  const [mainImage, setMainImage] = useState(null);
  const [subImages, setSubImages] = useState([null, null, null, null]);
  const [wpDeviceQuantity, setWpDeviceQuantity] = useState(0);
  const [connectivity, setConnectivity] = useState([]);
  const [plans, setPlans] = useState([{ plans_id: 1, label: '', capacity: '', price: '' }]);
  const [durations, setDurations] = useState([
    { duration_id: 1, duration_time_limit: '', gst: '', discount: '', security_deposit: '' },
  ]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [productData, setProductData] = useState(null);

  useEffect(() => {
    if (fetchDataCalled.current) return;

    const { dataItem } = location.state || {};
    let data = dataItem;

    if (!data) {
      const stored = localStorage.getItem('productData');
      if (stored) data = JSON.parse(stored);
    }

    if (data) {
      setProductData(data);
      setModelId(data.model_id || null);
      setModelName(data.model_name || '');
      setProductDetails(data.product_details || '');
      setProductSpecifications(data.product_specifications || '');
      setWpDeviceQuantity(data.wp_device_quantity || 0);

      // Parse connectivity - could be string "Wifi, Bluetooth" or array
      const connectivityData = data.connectivity || '';
      const connectivityArray = typeof connectivityData === 'string'
        ? connectivityData.split(',').map(s => s.trim()).filter(Boolean)
        : Array.isArray(connectivityData) ? connectivityData : [];
      setConnectivity(connectivityArray);

      const statusValue =
        data.status === 1 || data.status === '1' || data.status === true
          ? 'true'
          : 'false';
      setStatus(statusValue);

      const parsedPlans = data.plans?.length > 0
        ? data.plans.map((p, i) => ({
            ...p,
            plans_id: i + 1,
            label: p.label?.toLowerCase() || ''
          }))
        : [{ plans_id: 1, label: '', capacity: '', price: '' }];
      setPlans(parsedPlans);

      const parsedDurations = data.duration?.length > 0
        ? data.duration.map((d, i) => ({
            ...d,
            duration_id: i + 1
          }))
        : [{
            duration_id: 1,
            duration_time_limit: '',
            gst: '',
            discount: '',
            security_deposit: ''
          }];
      setDurations(parsedDurations);

      const subImgs = [
        data.sub_img_1 || null,
        data.sub_img_2 || null,
        data.sub_img_3 || null,
        data.sub_img_4 || null
      ];
      setMainImage(data.main_img || null);
      setSubImages(subImgs);

      // Store original data for change detection
      originalDataRef.current = {
        modelName: data.model_name || '',
        productDetails: data.product_details || '',
        productSpecifications: data.product_specifications || '',
        wpDeviceQuantity: data.wp_device_quantity || 0,
        connectivity: connectivityArray,
        mainImage: data.main_img || null,
        subImages: subImgs,
        plans: parsedPlans.map(p => ({
          label: p.label,
          capacity: p.capacity,
          price: Number(p.price)
        })),
        durations: parsedDurations.map(d => ({
          duration_time_limit: d.duration_time_limit,
          gst: Number(d.gst),
          discount: Number(d.discount),
          security_deposit: Number(d.security_deposit)
        })),
        status: statusValue
      };
    }

    fetchDataCalled.current = true;
  }, [location]);



  const backToManagePage = () => navigate('/superadmin/ManageProducts');

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
    setPlans([...plans, { plans_id: Date.now(), label: '', capacity: '', price: '' }]);
  };

  const handlePlanChange = (index, field, value) => {
    if (field === 'price') {
      if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
        const updated = plans.map((plan, i) =>
          i === index ? { ...plan, [field]: value } : plan
        );
        setPlans(updated);
      }
    } else {
      const updated = plans.map((plan, i) =>
        i === index ? { ...plan, [field]: value } : plan
      );
      setPlans(updated);
    }
  };

  const addDuration = () => {
    setDurations([...durations, {
      duration_id: Date.now(),
      duration_time_limit: '',
      gst: '',
      discount: '',
      security_deposit: ''
    }]);
  };

  const handleDurationChange = (index, field, value) => {
    if (['gst', 'discount', 'security_deposit'].includes(field)) {
      if (value === '' || (/^\d*\.?\d*$/.test(value) && Number(value) >= 0)) {
        const updated = durations.map((duration, i) =>
          i === index ? { ...duration, [field]: value } : duration
        );
        setDurations(updated);
      }
    } else {
      const updated = durations.map((duration, i) =>
        i === index ? { ...duration, [field]: value } : duration
      );
      setDurations(updated);
    }
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
    formData.append('model_id', modelId);
    formData.append('model_name', modelName);
    formData.append('product_details', productDetails);
    if (productSpecifications instanceof File) {
      formData.append('product_specifications', productSpecifications);
    }
    formData.append('existing_product_specifications', originalDataRef.current?.productSpecifications || '');
    formData.append('wp_device_quantity', wpDeviceQuantity);
    formData.append('connectivity', connectivity.join(', '));
    formData.append('main_img', mainImage);
    formData.append('createdby', userInfo.email);
    formData.append('modifiedby', userInfo.email);
    formData.append('status', status === 'true');

    subImages.forEach((img, i) => {
      if (img) formData.append(`sub_img_${i + 1}`, img);
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

    try {
      const response = await axiosInstance.post('api/admin/UpdateProductModels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setLoading(false);

      if (response.data.status === 'Success') {
        showSuccessAlert("Product updated successfully");
        backToManagePage();
      } else {
        showErrorAlert("Failed", response.data.message || "Update failed.");
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
    removePlan,
    status,
    setStatus,
  };
};

export default useEditProducts;

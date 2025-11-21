import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useViewProducts = () => {
  const location = useLocation();

  const [product, setProduct] = useState({
    _id: '',
    main_img: '',
    sub_img_1: '',
    sub_img_2: '',
    sub_img_3: '',
    sub_img_4: '',
    product_details: '',
    product_specifications: '',
    duration: [],
    plans: [],
    createdby: '',
    modifiedby: '',
    createddate: '',
    modifieddate: '',
    status: '',
    model_id: '',
    model_name: '',
    model_type: '',
    wp_device_quantity: '',
    connectivity: '',
  });

  useEffect(() => {
    const { dataItem } = location.state || {};
    if (dataItem) {
      const parsedData = {
        _id: dataItem._id || '',
        main_img: dataItem.main_img || '',
        sub_img_1: dataItem.sub_img_1 || '',
        sub_img_2: dataItem.sub_img_2 || '',
        sub_img_3: dataItem.sub_img_3 || '',
        sub_img_4: dataItem.sub_img_4 || '',
        product_details: dataItem.product_details || '',
        product_specifications: dataItem.product_specifications || '',
        duration: Array.isArray(dataItem.duration) ? dataItem.duration : [],
        plans: Array.isArray(dataItem.plans) ? dataItem.plans : [],
        createdby: dataItem.createdby || '',
        modifiedby: dataItem.modifiedby || '',
        createddate: dataItem.createddate || '',
        modifieddate: dataItem.modifieddate || '',
        status: dataItem.status ?? '',
        model_id: dataItem.model_id || '',
        model_name: dataItem.model_name || '',
        model_type: dataItem.model_type || '',
        wp_device_quantity: dataItem.wp_device_quantity || '',
        connectivity: dataItem.connectivity || '',
      };
      setProduct(parsedData);
      localStorage.setItem('productData', JSON.stringify(parsedData));
    } else {
      const savedData = JSON.parse(localStorage.getItem('productData'));
      if (savedData) {
        setProduct(savedData);
      }
    }
  }, [location]);

  return { product, setProduct };
};
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const useViewManageSeller = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [seller, setSeller] = useState({
    _id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    addressline1: '',
    addressline2: '',
    city: '',
    district: '',
    state: '',
    country: '',
    pincode: '',
    createdby: '',
    modifiedby: '',
    createdDate: '',
    modifiedDate: '',
    createddate: '',
    modifieddate: '',
    status: false,
    role_id: 4,
    role_name: 'Seller',
    user_id: '',
  });

  useEffect(() => {
    const { dataItem } = location.state || {};
    if (dataItem) {
      setSeller({
        _id: dataItem._id || '',
        name: dataItem.name || '',
        email: dataItem.email || '',
        phone: dataItem.phone || '',
        password: dataItem.password || '',
        addressline1: dataItem.addressline1 || '',
        addressline2: dataItem.addressline2 || '',
        city: dataItem.city || '',
        district: dataItem.district || '',
        state: dataItem.state || '',
        country: dataItem.country || '',
        pincode: dataItem.pincode || '',
        createdby: dataItem.createdby || '',
        modifiedby: dataItem.modifiedby || '',
        createdDate: dataItem.createdDate || '',
        modifiedDate: dataItem.modifiedDate || '',
        createddate: dataItem.createddate || '',
        modifieddate: dataItem.modifieddate || '',
        status: dataItem.status || false,
        role_id: dataItem.role_id || 4,
        role_name: dataItem.role_name || 'Seller',
        user_id: dataItem.user_id || '',
      });
      localStorage.setItem('sellerData', JSON.stringify(dataItem));
    } else {
      const savedData = JSON.parse(localStorage.getItem('sellerData'));
      if (savedData) {
        setSeller(savedData);
      }
    }
  }, [location]);

  const handleBack = () => {
    navigate('/superadmin/ManageSellers');
  };

  const handleEditSeller = (seller) => {
    navigate('/superadmin/EditManageSeller', { state: { seller } });
  };

  return {
    seller,
    setSeller,
    handleBack,
    handleEditSeller,
  };
};

export default useViewManageSeller;
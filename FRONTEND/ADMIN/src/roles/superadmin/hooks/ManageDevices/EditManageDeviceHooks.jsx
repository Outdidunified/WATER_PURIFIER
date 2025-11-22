//EditManageDevices
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../../utils/utils';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';

const useEditDevice = (userInfo) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Fix: use the same key as passed from the previous page
  let dataItem = location.state?.deviceData;
  if (dataItem) {
    localStorage.setItem('editDeviceData', JSON.stringify(dataItem));
  } else {
    dataItem = JSON.parse(localStorage.getItem('editDeviceData'));
  }

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize states once dataItem is ready
  const [wpDeviceId, setWpDeviceId] = useState('');
  const [modelId, setModelId] = useState('');
  const [modelName, setModelName] = useState('');
  const [status, setStatus] = useState('active');
  const [initialStatus, setInitialStatus] = useState('');

  // Use effect to populate state after dataItem loads
  useEffect(() => {
    if (dataItem) {
      setWpDeviceId(dataItem.wp_device_id || '');
      setModelId(dataItem.model_id?.toString() || '');  // make sure modelId is string for input fields
      setModelName(dataItem.model_name || '');
      const initialStatusValue = dataItem.status === true ? 'active' : 'inactive';
      setStatus(initialStatusValue);
      setInitialStatus(initialStatusValue);
    }
  }, [dataItem]);



  const goBackToManageDevices = () => {
    navigate('/superadmin/ManageDevice');
  };

  const updateDevice = async (e) => {

    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (!wpDeviceId || !modelId || !modelName) {
      setErrorMessage('Please fill in all required fields');
      setLoading(false);
      return;
    }

    const payload = {
      wp_device_id: wpDeviceId,
      modifiedby: userInfo.email,
      model_assigned_by: userInfo.email,
      model_id: parseInt(modelId),
      model_name: modelName,
      status: status === 'active' ? true : false
    };

    try {
      const response = await axiosInstance.post('/api/admin/UpdateDeviceDetails', payload);
      if (response.data.status === 'Success') {
        showSuccessAlert('Device updated successfully');
        goBackToManageDevices();
      } else {
        showErrorAlert('Error', response.data.message || 'Failed to update device');
      }
    } catch (error) {
      console.error('Update error:', error);
      showErrorAlert('Error', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    errorMessage,
    wpDeviceId, setWpDeviceId,
    modelId, setModelId,
    modelName, setModelName,
    status, setStatus,
    initialStatus,
    updateDevice,
    goBackToManageDevices
  };
};

export default useEditDevice;

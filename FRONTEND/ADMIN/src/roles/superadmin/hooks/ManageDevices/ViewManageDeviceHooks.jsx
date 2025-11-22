//viewManageDevice
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../../../../utils/utils';

const useViewDevice = () => {
  const location = useLocation();

  const [device, setDevice] = useState({
    _id: '',
    wp_device_id: '',
    model_id: '',
    model_name: '',
    status: false,
    createdby: '',
    modifiedby: '',
    model_assigned_by: '',
    createddate: '',
    model_assigned_date: '',
    modifieddate: '',
    mac_id: '',
    enter_mac_id: '',
    plan_config: null,
  });

  useEffect(() => {
    const { dataItem } = location.state || {};

    const formatDevice = (deviceData = {}) => ({
      _id: deviceData._id || '',
      wp_device_id: deviceData.wp_device_id || '',
      model_id: deviceData.model_id || '',
      model_name: deviceData.model_name || '',
      status: deviceData.status !== undefined ? deviceData.status : false,
      createdby: deviceData.createdby || '',
      modifiedby: deviceData.modifiedby || '',
      model_assigned_by: deviceData.model_assigned_by || '',
      createddate: deviceData.createddate || '',
      model_assigned_date: deviceData.model_assigned_date || '',
      modifieddate: deviceData.modifieddate || '',
      mac_id: deviceData.mac_id || '',
      enter_mac_id: deviceData.enter_mac_id || '',
      plan_config: deviceData.plan_config || null,
    });

    const applyDevice = (data) => {
      const formatted = formatDevice(data);
      setDevice(formatted);
      localStorage.setItem('deviceData', JSON.stringify(formatted));
      return formatted;
    };

    const fetchDeviceDetails = async (wpDeviceId) => {
      if (!wpDeviceId) return;
      try {
        const response = await axiosInstance.post('/api/admin/FetchDeviceDetails');
        if (response.status === 200 && response.data.status === 'Success') {
          const deviceList = response.data.data || [];
          const matchedDevice = deviceList.find(
            (item) => item?.wp_device_id && item.wp_device_id.toLowerCase() === wpDeviceId.toLowerCase()
          );
          if (matchedDevice) {
            applyDevice({ ...matchedDevice });
          }
        }
      } catch (error) {
        console.error('Failed to fetch device details:', error);
      }
    };

    if (dataItem) {
      const deviceData = Array.isArray(dataItem) ? dataItem[0] : dataItem;
      const formatted = applyDevice(deviceData);
      fetchDeviceDetails(formatted.wp_device_id);
    } else {
      const savedData = JSON.parse(localStorage.getItem('deviceData'));
      if (savedData) {
        const formatted = applyDevice(savedData);
        fetchDeviceDetails(formatted.wp_device_id);
      }
    }
  }, [location]);

  return device;
};

export default useViewDevice;

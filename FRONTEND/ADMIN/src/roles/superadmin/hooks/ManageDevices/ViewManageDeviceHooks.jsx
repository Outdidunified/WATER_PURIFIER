//viewManageDevice
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
  });

  useEffect(() => {
    const { dataItem } = location.state || {};
    console.log('dataItem from location.state:', dataItem);

    if (dataItem) {
      const deviceData = Array.isArray(dataItem) ? dataItem[0] : dataItem;

      const formattedDevice = {
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
      };

      setDevice(formattedDevice);
      localStorage.setItem('deviceData', JSON.stringify(formattedDevice));
    } else {
      const savedData = JSON.parse(localStorage.getItem('deviceData'));
      if (savedData) {
        setDevice(savedData);
      }
    }
  }, [location]);

  return device;
};

export default useViewDevice;

//ManageDevice
import { useState, useEffect } from 'react';
import { showErrorAlert, showSuccessAlert } from '../../../../utils/alert';
import axiosInstance from '../../../../utils/utils';

const useManageDevice = (userInfo) => {
  const [stationData, setStationData] = useState({
    wp_device_id: '',
    model_id: '',
    model_name: ''
  });
  const [models, setModels] = useState([]);
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch available models
  const fetchModels = async () => {
    try {
      const res = await axiosInstance.post('api/admin/FetchProductModels');
      if (res.data.status === 'Success') {
        setModels(res.data.data);
      } else {
        showErrorAlert('Error', res.data.message || 'Failed to fetch models');
      }
    } catch (err) {
      showErrorAlert('Error', err?.message || 'Error fetching models');
    }
  };

  // Fetch list of stations/devices
  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post('api/admin/FetchDeviceDetails');
      if (res.data.status === 'Success') {
        setStations(res.data.data);
        setFilteredStations(res.data.data);
        setError('');
      } else {
        setError(res.data.message || 'Failed to fetch stations');
      }
    } catch (err) {
      setError(err.message || 'Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const addStation = async (e) => {
    e.preventDefault();

    const selectedModel = models.find(
      (model) => model.model_name === stationData.model_name
    );

    if (!stationData.wp_device_id || !selectedModel) {
      return showErrorAlert('Error', 'Please fill all required fields');
    }

    const payload = {
      wp_device_id: stationData.wp_device_id,
      createdby: userInfo.email,
      model_assigned_by: userInfo.email,
      model_id: selectedModel.model_id,
      model_name: selectedModel.model_name,
    };

    try {
      setLoading(true);
      const response = await axiosInstance.post('api/admin/AddDeviceDetails', payload);
      if (response.data.status === 'Success') {
        showSuccessAlert('Success', 'Device added successfully');
        setStationData({
          wp_device_id: '',
          model_id: '',
          model_name: ''
        });
        setShowAddModal(false);
        fetchDevices(); // Refresh station list
      } else {
        showErrorAlert('Error', response.data.message || 'Failed to add device');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Unexpected error occurred';
      showErrorAlert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const modalAddStyle = {
    display: showAddModal ? 'block' : 'none',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    position: 'fixed',
    zIndex: 1050,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    overflow: 'auto',
    paddingTop: '50px',
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setStationData({
      wp_device_id: '',
      model_id: '',
      model_name: '',
      connectivity: ''
    });
  };

  const handleAddStationToggle = () => {
    if (!showAddModal) {
      fetchModels();
    }
    setShowAddModal(prev => !prev);
  };

  const handleSearchInputChange = (e) => {
    const text = e.target.value.toLowerCase();
    setSearchText(text);
    if (!text) {
      setFilteredStations(stations);
    } else {
      const filtered = stations.filter((station) =>
        station.wp_device_id?.toLowerCase().includes(text) ||
        station.model_name?.toLowerCase().includes(text) ||
        station.email?.toLowerCase().includes(text)
      );
      setFilteredStations(filtered);
    }
  };

  useEffect(() => {
    fetchModels();
    fetchDevices();
  }, []);

  return {
    stationData,
    setStationData,
    loading,
    error,
    isLoading,
    stations,
    filteredStations,
    searchText,
    models,
    showAddModal,
    modalAddStyle,
    handleAddStationToggle,
    closeAddModal,
    addStation,
    handleSearchInputChange,
  };
};

export default useManageDevice;

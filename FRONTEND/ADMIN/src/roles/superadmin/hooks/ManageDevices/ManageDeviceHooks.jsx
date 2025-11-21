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
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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
  const fetchDevices = async (pageNum = 1, pageLimit = 10) => {
    setIsLoading(true);
    try {
      const isSeller = Number(userInfo?.role_id) === 4;
      const url = isSeller ? '/api/admin/FetchDeviceDetails/by-district' : '/api/admin/FetchDeviceDetails';
      const res = isSeller 
        ? await axiosInstance.get(url, { params: { district: userInfo?.district, page: pageNum, limit: pageLimit } })
        : await axiosInstance.post(url, { page: pageNum, limit: pageLimit });
      if (res.data.status === 'Success') {
        const devices = Array.isArray(res.data.data) ? [...res.data.data]: [];
        setStations(devices);
        setFilteredStations(devices);
        setError('');
        setCurrentPage(pageNum);
        setPageSize(pageLimit);
        
        if (res.data.pagination) {
          setTotalRecords(res.data.pagination.totalRecords);
          setTotalPages(res.data.pagination.totalPages);
        } else {
          setTotalRecords(devices.length);
          setTotalPages(Math.ceil(devices.length / pageLimit));
        }
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
    setSearchText(e.target.value);
  };

  useEffect(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    const normalizedModel = selectedModel.trim().toLowerCase();

    const filtered = stations.filter((station) => {
      const deviceId = (station.wp_device_id || '').toLowerCase();
      const modelName = (station.model_name || '').toLowerCase();
      const createdBy = (station.createdby || '').toLowerCase();
      const email = (station.email || '').toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        deviceId.includes(normalizedSearch) ||
        modelName.includes(normalizedSearch) ||
        createdBy.includes(normalizedSearch) ||
        email.includes(normalizedSearch);

      const matchesModel =
        normalizedModel.length === 0 ||
        modelName === normalizedModel;

      return matchesSearch && matchesModel;
    });

    setFilteredStations(filtered);
  }, [stations, searchText, selectedModel]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedModel]);

  useEffect(() => {
    fetchModels();
    fetchDevices();
  }, []);

  const handleModelSelect = (value) => {
    setSelectedModel(value);
    setCurrentPage(1);
  };

  const resetModelFilter = () => {
    setSelectedModel('');
    setCurrentPage(1);
  };

  const getPaginatedData = () => {
    return filteredStations;
  };

  const getTotalPages = () => {
    return totalPages;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchDevices(newPage, pageSize);
    }
  };

  const handlePageSizeChange = (newSize) => {
    fetchDevices(1, newSize);
  };

  const modelOptions = Array.from(
    new Set(
      stations
        .map((station) => station.model_name?.trim())
        .filter((name) => name)
    )
  ).sort((a, b) => a.localeCompare(b));

  const totalDevices = Array.isArray(stations) ? stations.length : 0;

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
    handleModelSelect,
    resetModelFilter,
    modelOptions,
    selectedModel,
    totalDevices,
    currentPage,
    pageSize,
    totalRecords,
    totalPages,
    getPaginatedData,
    getTotalPages,
    handlePageChange,
    handlePageSizeChange,
  };
};

export default useManageDevice;

//ManageRoles
import { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../../../../utils/utils';
import {
  showSuccessAlert,
  showErrorAlert
} from '../../../../utils/alert';
import { useNavigate } from 'react-router-dom';


const useManageRoles = (userInfo) => {
  const fetchCalled = useRef(false);

  // Roles data & UI states
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tableError, setTableError] = useState(null);

  // Add Role Modal & form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetForm();
    setFormError(null);
  };

  const [roleId, setRoleId] = useState('');
  const [roleName, setRoleName] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);


  // Fetch roles from backend
  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      setTableError(null);

      const response = await axiosInstance.post('api/admin/FetchUserRoles');

      if (response.status === 200 && response.data.status === 'Success') {
        const data = response.data.data || [];
        setRoles(data);
        setFilteredRoles(data);
      } else {
        setTableError('Failed to fetch roles');
        setRoles([]);
        setFilteredRoles([]);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      setTableError('Error fetching roles. Please try again.');
      setRoles([]);
      setFilteredRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fetchCalled.current) {
      fetchRoles();
      fetchCalled.current = true;
    }
  }, [fetchRoles]);

  // Search/filter roles by role_name or role_id
  const handleSearchInputChange = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = roles.filter(role =>
      role.role_name?.toLowerCase().includes(searchTerm) ||
      role.role_id?.toString().includes(searchTerm)
    );
    setFilteredRoles(filtered);
  };

  // Add Role form submit
  const handleAddRoleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!roleId || !roleName) {
      setFormError('Role ID and Role Name are required');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const payload = {
        role_id: Number(roleId),
        role_name: roleName,
        created_by: userInfo.email,
      };

      const response = await axiosInstance.post('api/admin/AddUserRoles', payload);

      if (response.status === 200 && response.data.status === 'Success') {
        showSuccessAlert('Success', 'Role added successfully');
        closeAddModal();
        await fetchRoles();
      } else {
        const msg = response.data.message || 'Failed to add role';
        setFormError(msg);
        showErrorAlert('Error', msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error adding role. Please try again.';
      setFormError(msg);
      showErrorAlert('Error', msg);
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setRoleId('');
    setRoleName('');
    setFormError(null);
  };

  return {
    roles: filteredRoles,
    isLoading,
    tableError,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    roleId,
    setRoleId,
    roleName,
    setRoleName,
    formLoading,
    formError,
    handleAddRoleSubmit,
    handleSearchInputChange,
  };
};

export default useManageRoles;

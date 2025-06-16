// useManageRoles.js
import { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../../../../utils/utils';
import { showSuccessAlert, showErrorAlert } from '../../../../utils/alert';

const useManageRoles = (userInfo) => {
  const fetchCalled = useRef(false);

  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tableError, setTableError] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [roleId, setRoleId] = useState('');
  const [roleName, setRoleName] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setRoleId('');
    setRoleName('');
    setFormError(null);
  };
// Define required role IDs
const requiredRoleIds = [1, 2, 3];

// Determine if all roles are already created
const isAllRolesCreated = requiredRoleIds.every(requiredId =>
  roles.some(existingRole => existingRole.role_id === requiredId)
);

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

  const handleSearchInputChange = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = roles.filter(role =>
      role.role_name?.toLowerCase().includes(searchTerm) ||
      role.role_id?.toString().includes(searchTerm)
    );
    setFilteredRoles(filtered);
  };

  const handleAddRoleSubmit = async (e) => {
    e.preventDefault();

    if (!roleId || !roleName) {
      setFormError('Role ID and Role Name are required');
      return;
    }

    if (roles.some(role => role.role_id === Number(roleId))) {
      setFormError('This role already exists');
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

const isDuplicateRole = roles.some(
  role =>
    String(role.role_id) === String(roleId) ||
    role.role_name?.toLowerCase() === roleName.toLowerCase()
);
const isAddDisabled = !roleId || !roleName || isDuplicateRole || formLoading;

  return {
    roles: filteredRoles,
    isLoading,isAddDisabled,
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
    isDuplicateRole,isAllRolesCreated
  };
};

export default useManageRoles;

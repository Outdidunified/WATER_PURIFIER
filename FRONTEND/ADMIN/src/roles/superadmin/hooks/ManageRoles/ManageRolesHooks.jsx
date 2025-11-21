// ManageRolesHooks.js
import { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../../../../utils/utils';
import { showSuccessAlert, showErrorAlert } from '../../../../utils/alert';
import axios from "axios";

const useManageRoles = (userInfo) => {
  const fetchCalled = useRef(false);

  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tableError, setTableError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setRoleName('');
    setFormError(null);
  };

  const fetchRoles = useCallback(async (pageNum = 1, pageLimit = 10) => {
    try {
      setIsLoading(true);
      setTableError(null);

      const response = await axiosInstance.post('api/admin/FetchUserRoles', { page: pageNum, limit: pageLimit });

      if (response.status === 200 && response.data.status === 'Success') {
        const data = response.data.data || [];
        const pagination = response.data.pagination || {};
        setRoles(data);
        setFilteredRoles(data);
        setCurrentPage(pagination.currentPage || pageNum);
        setPageSize(pagination.pageSize || pageLimit);
        setTotalRecords(pagination.totalRecords || 0);
        setTotalPages(pagination.totalPages || 0);
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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchRoles(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchRoles(1, newSize);
  };

  useEffect(() => {
    if (!fetchCalled.current) {
      fetchRoles(currentPage, pageSize);
      fetchCalled.current = true;
    }
  }, [fetchRoles, currentPage, pageSize]);

  useEffect(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    const normalizedRole = selectedRole.trim().toLowerCase();

    const filtered = roles.filter((role) => {
      const name = (role.role_name || '').toLowerCase();
      const id = (role.role_id?.toString() || '').toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        name.includes(normalizedSearch) ||
        id.includes(normalizedSearch);
      const matchesRole =
        normalizedRole.length === 0 ||
        name === normalizedRole;

      return matchesSearch && matchesRole;
    });

    setFilteredRoles(filtered);
  }, [roles, searchText, selectedRole]);

  const handleSearchInputChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleRoleSelect = (value) => {
    setSelectedRole(value);
  };

  const resetRoleFilter = () => {
    setSelectedRole('');
  };

  const handleAddRoleSubmit = async (e) => {
    e.preventDefault();

    if (!roleName) {
      setFormError('Role Name is required');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const payload = {
        role_name: roleName,
        created_by: userInfo.email,
      };

      const response = await axiosInstance.post(
        'api/admin/AddUserRoles',
        payload
      );

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
    role => role.role_name?.toLowerCase() === roleName.toLowerCase()
  );

  const isAddDisabled = !roleName || isDuplicateRole || formLoading;

  const roleOptions = Array.from(
    new Set(
      roles
        .map((role) => role.role_name?.trim())
        .filter((name) => name)
    )
  ).sort((a, b) => a.localeCompare(b));

  const totalRoles = Array.isArray(roles) ? roles.length : 0;

  return {
    roles: filteredRoles,
    isLoading,
    isAddDisabled,
    tableError,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    roleName,
    setRoleName,
    formLoading,
    formError,
    handleAddRoleSubmit,
    handleSearchInputChange,
    handleRoleSelect,
    resetRoleFilter,
    roleOptions,
    selectedRole,
    totalRoles,
    isDuplicateRole,
    currentPage,
    pageSize,
    totalRecords,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
  };
};

export default useManageRoles;

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/utils';
import UserSearchService from '../../../../services/UserSearchService';
import {
  showConfirmationAlert,
  showErrorAlert,
  showSuccessAlert
} from '../../../../utils/alert';

const useManageUsers = (userInfo) => {
  const navigate = useNavigate();
  const fetchUsersCalled = useRef(false);

  // Table data and state
  const [data, setData] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [roleSummaries, setRoleSummaries] = useState([]);
  const [allRoleSummaries, setAllRoleSummaries] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Add User modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => {
    resetForm();
    setIsAddModalOpen(false);
  };

  // Add User form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(userInfo?.role_id === 4 ? 2 : 3); // Default to Technician if seller, else EndUser
  const [address, setAddress] = useState('');
  const [addressline1, setAddressline1] = useState('');
  const [addressline2, setAddressline2] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [stateField, setStateField] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Roles
  const [roles, setRoles] = useState([]);

  // Seller assignment modal state (role_id === 4)
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignMode, setAssignMode] = useState('assign'); // 'assign' | 'reassign'
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [assignState, setAssignState] = useState('');
  const [assignDistrict, setAssignDistrict] = useState('');
  const [assignStatus, setAssignStatus] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  // ----------------------------
  // FETCH ROLES
  // ----------------------------
  const fetchRoles = useCallback(async () => {
    try {
      const response = await axiosInstance.post('/api/admin/FetchUserRoles');
      if (response.status === 200 && response.data.status === 'Success') {
        const activeRoles = (response.data.data || []).filter((r) => r.status === true);
        setRoles(activeRoles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  }, []);

  // ----------------------------
  // FETCH ROLE SUMMARIES (NO SORTING)
  // ----------------------------
  const fetchRoleSummaries = useCallback(async () => {
    try {
      const isSeller = Number(userInfo?.role_id) === 4;

      if (isSeller) {
        const response = await axiosInstance.get('/api/admin/users/counts/by-district', { 
          params: { district: userInfo?.district } 
        });
        if (response.status === 200 && response.data.status === 'Success') {
          const data = response.data.data;
          if (Array.isArray(data) && data.length > 0) {
            const districtData = data[0];
            const summaries = [
              { role_id: 1, role_name: 'Admin', count: districtData.admin || 0 },
              { role_id: 2, role_name: 'Technician', count: districtData.technician || 0 },
              { role_id: 3, role_name: 'End User', count: districtData.endUser || 0 },
              { role_id: 4, role_name: 'Seller', count: districtData.seller || 0 }
            ];
            setAllRoleSummaries(summaries);
          }
        }
      } else {
        const response = await axiosInstance.get('/api/admin/users/counts/by-role');
        if (response.status === 200 && response.data.status === 'Success') {
          const counts = response.data.data;
          const summaries = [
            { role_id: 1, role_name: 'Admin', count: counts.admin || 0 },
            { role_id: 2, role_name: 'Technician', count: counts.technician || 0 },
            { role_id: 3, role_name: 'End User', count: counts.endUser || 0 },
            { role_id: 4, role_name: 'Seller', count: counts.seller || 0 }
          ];
          setAllRoleSummaries(summaries);
        }
      }
    } catch (err) {
      console.error('Error fetching role summaries:', err);
    }
  }, [userInfo?.role_id, userInfo?.district]);

  // ----------------------------
  // FETCH USERS WITH SEARCH SUPPORT
  // ----------------------------
  const fetchUsers = useCallback(
    async (pageNum = 1, pageLimit = 10, searchTerm = '') => {
      try {
        setTableLoading(true);

        const isSeller = Number(userInfo?.role_id) === 4;

        // Use UserSearchService for search operations, fallback to regular fetch for empty search
        let result;
        if (searchTerm && searchTerm.trim()) {
          result = await UserSearchService.performSearch(
            searchTerm.trim(),
            pageNum,
            pageLimit,
            isSeller,
            userInfo?.district
          );
        } else {
          // Regular fetch without search
          const url = isSeller ? '/api/admin/users/by-district' : '/api/admin/FetchUsers';

          const response = isSeller
            ? await axiosInstance.get(url, { params: { district: userInfo?.district, page: pageNum, limit: pageLimit } })
            : await axiosInstance.post(url, { page: pageNum, limit: pageLimit });

          if (response.status === 200 && response.data.status === 'Success') {
            result = {
              data: response.data.data || [],
              pagination: response.data.pagination || {
                currentPage: pageNum,
                pageSize: pageLimit,
                totalRecords: 0,
                totalPages: 0
              },
              totalCount: response.data.pagination?.totalRecords || 0
            };
          } else {
            result = {
              data: [],
              pagination: {
                currentPage: pageNum,
                pageSize: pageLimit,
                totalRecords: 0,
                totalPages: 0
              },
              totalCount: 0
            };
          }
        }

        // Update state with results
        setData(result.data);
        setPosts(result.data);
        setCurrentPage(result.pagination.currentPage);
        setPageSize(result.pagination.pageSize);
        setTotalRecords(result.pagination.totalRecords);
        setTotalPages(result.pagination.totalPages);

        // Fetch role summaries if available
        if (result.roleSummaries) {
          setAllRoleSummaries(result.roleSummaries);
        }

      } catch (err) {
        console.error('Error fetching users:', err);
        setData([]);
        setPosts([]);
        setTotalRecords(0);
        setTotalPages(0);
      } finally {
        setTableLoading(false);
      }
    },
    [userInfo?.role_id, userInfo?.district]
  );

  // ----------------------------
  // INITIAL FETCH
  // ----------------------------
  useEffect(() => {
    if (!fetchUsersCalled.current) {
      fetchUsers(1, 10, ''); // Initial fetch with no search
      fetchRoles();
      fetchRoleSummaries();
      fetchUsersCalled.current = true;
    }
  }, [fetchUsers, fetchRoles, fetchRoleSummaries]);

  // ----------------------------
  // ROLE SUMMARIES (REMOVED ALL SORTING)
  // ----------------------------
  useEffect(() => {
    if (!Array.isArray(roles) || roles.length === 0) {
      setRoleSummaries([]);
      return;
    }

    let summaries;

    if (allRoleSummaries?.length > 0) {
      summaries = allRoleSummaries.map((item) => ({
        roleId: item.role_id,
        roleName: item.role_name,
        count: item.count || 0
      }));
    } else {
      const counts = data.reduce((acc, item) => {
        const key = String(item.role_id || '').trim();
        acc.set(key, (acc.get(key) || 0) + 1);
        return acc;
      }, new Map());

      summaries = roles.map((r) => ({
        roleId: r.role_id,
        roleName: r.role_name,
        count: counts.get(String(r.role_id)) || 0
      }));
    }

    setRoleSummaries(summaries);
  }, [roles, data, allRoleSummaries]);

  // ----------------------------
  // SERVER-SIDE SEARCH WITH DEBOUNCING
  // ----------------------------
  const debouncedSearch = useCallback(
    UserSearchService.debounceSearch(async (searchTerm) => {
      await fetchUsers(1, pageSize, searchTerm);
    }, 300),
    [fetchUsers, pageSize]
  );

  useEffect(() => {
    // Trigger search when searchText changes
    if (searchText !== undefined) {
      debouncedSearch(searchText);
    }
  }, [searchText, debouncedSearch]);

  // ----------------------------
  // PAGINATION
  // ----------------------------
  const getPaginatedData = () => posts;
  const getTotalPages = () => totalPages;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchUsers(newPage, pageSize, searchText);
    }
  };

  const handlePageSizeChange = (newSize) => {
    fetchUsers(1, newSize, searchText);
  };

  // ----------------------------
  // USER ACTIONS
  // ----------------------------
  const handleViewUser = (item) => navigate('/superadmin/ViewManageUser', { state: { dataItem: item } });
  const handleEditUser = (item) => navigate('/superadmin/EditManageUsers', { state: { dataItem: item } });



  // Open assignment modal for sellers (role_id === 4)
  const openAssignSellerModal = (user, mode = 'assign') => {
    setSelectedSeller(user);
    setAssignMode(mode);
    // Pre-fill
    const existingState = user?.assigned_state || user?.state || '';
    const existingDistrict = user?.assigned_district || user?.district || '';
    setAssignState(existingState);
    setAssignDistrict(existingDistrict);
    setAssignStatus(Boolean(user?.assigned_status));
    setAssignModalOpen(true);
  };

  const closeAssignSellerModal = () => {
    setAssignModalOpen(false);
    setSelectedSeller(null);
    setAssignState('');
    setAssignDistrict('');
    setAssignStatus(false);
    setAssignLoading(false);
  };

  // ----------------------------
  // HANDLE ADD USER SUBMIT
  // ----------------------------
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      if (!name || !email || !password || !phone || !role) {
        setFormError('Please fill all required fields');
        setFormLoading(false);
        return;
      }

      if (!addressline1 || !city || !district || !stateField || !country || !pincode) {
        setFormError('Please fill all address fields (Address Line1, City, District, State, Country, Pincode)');
        setFormLoading(false);
        return;
      }

      const userData = {
        name,
        email: email.toLowerCase(),
        password,
        phone,
        role_id: role,
        addressline1,
        addressline2,
        city,
        district,
        state: stateField,
        country,
        pincode,
        createdby: userInfo?.name || userInfo?.email || 'admin'
      };

      const response = await axiosInstance.post('/api/admin/AddUsers', userData);

      if (response.status === 200 && response.data.status === 'Success') {
        showSuccessAlert('User created successfully!');
        resetForm();
        closeAddModal();
        fetchUsers(1, pageSize, '');
      } else {
        setFormError(response.data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setFormError(error.response?.data?.message || error.message || 'Failed to create user');
      showErrorAlert(error.response?.data?.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setRole(userInfo?.role_id === 4 ? 2 : 3);
    setAddress('');
    setAddressline1('');
    setAddressline2('');
    setCity('');
    setDistrict('');
    setStateField('');
    setPincode('');
    setCountry('');
  };

  return {
    posts,
    isLoading: tableLoading,
    error: tableError,
    handleSearchInputChange: (e) => setSearchText(e.target.value),
    searchText,
    handleRoleSelect: (roleId) => setSelectedRole(String(roleId)),
    resetRoleFilter: () => setSelectedRole(''),

    selectedRole,

    roleSummaries,
    allRoleSummaries,

    totalUsers: totalRecords || data.length,

    handleViewUser,
    handleEditUser,

    currentPage,
    pageSize,
    totalRecords,
    totalPages,
    getPaginatedData,
    getTotalPages,
    handlePageChange,
    handlePageSizeChange,

    // Add User modal
    openAddModal,
    closeAddModal,
    isAddModalOpen,
    handleAddUserSubmit,
    name, setName,
    email, setEmail,
    password, setPassword,
    phone, setPhone,
    role, setRole,
    address, setAddress,
    addressline1, setAddressline1,
    addressline2, setAddressline2,
    city, setCity,
    district, setDistrict,
    stateField, setStateField,
    pincode, setPincode,
    country, setCountry,
    formLoading,
    formError,

    roles,

    // Seller assignment modal
    assignModalOpen,
    assignMode,
    selectedSeller,
    assignState, setAssignState,
    assignDistrict, setAssignDistrict,
    assignStatus, setAssignStatus,
    assignLoading,
    openAssignSellerModal,
    closeAssignSellerModal
  };
};

export default useManageUsers;
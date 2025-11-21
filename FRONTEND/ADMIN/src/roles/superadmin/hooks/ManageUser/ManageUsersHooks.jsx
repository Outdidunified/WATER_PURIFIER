import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/utils';
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
      const url = isSeller ? '/api/admin/users/by-district/summaries' : '/api/admin/FetchUsersSummaries';

      const response = isSeller
        ? await axiosInstance.get(url, { params: { district: userInfo?.district } })
        : await axiosInstance.post(url);

      if (response.status === 200 && response.data.status === 'Success') {
        setAllRoleSummaries(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching role summaries:', err);
    }
  }, [userInfo?.role_id]);

  // ----------------------------
  // FETCH USERS (REMOVED SORTING)
  // ----------------------------
  const fetchUsers = useCallback(
    async (pageNum = 1, pageLimit = 10) => {
      try {
        setTableLoading(true);

        const isSeller = Number(userInfo?.role_id) === 4;
        const url = isSeller ? '/api/admin/users/by-district' : '/api/admin/FetchUsers';

        const response = isSeller
          ? await axiosInstance.get(url, { params: { district: userInfo?.district, page: pageNum, limit: pageLimit } })
          : await axiosInstance.post(url, { page: pageNum, limit: pageLimit });

        if (response.status === 200 && response.data.status === 'Success') {
          const fetchedData = response.data.data || [];

          // **NO SORTING — KEEP BACKEND ORDER**
          setData(fetchedData);
          setPosts(fetchedData);

          if (response.data.pagination) {
            setCurrentPage(response.data.pagination.currentPage);
            setPageSize(response.data.pagination.pageSize);
            setTotalRecords(response.data.pagination.totalRecords);
            setTotalPages(response.data.pagination.totalPages);
          }

          if (response.data.roleSummaries) {
            setAllRoleSummaries(response.data.roleSummaries);
          }
        } else {
          setData([]);
          setPosts([]);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setData([]);
        setPosts([]);
      } finally {
        setTableLoading(false);
      }
    },
    [userInfo?.role_id]
  );

  // ----------------------------
  // INITIAL FETCH
  // ----------------------------
  useEffect(() => {
    if (!fetchUsersCalled.current) {
      fetchUsers();
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
  // SEARCH + FILTER
  // ----------------------------
  useEffect(() => {
    if (!Array.isArray(data)) {
      setPosts([]);
      return;
    }

    const search = searchText.trim().toUpperCase();
    const selected = String(selectedRole || '').trim();

    const filtered = data.filter((item) => {
      const matchesSearch =
        !search ||
        (item.name || '').toUpperCase().includes(search) ||
        (item.email || '').toUpperCase().includes(search) ||
        String(item.phone || '').includes(search) ||
        (item.city || '').toUpperCase().includes(search) ||
        (item.district || '').toUpperCase().includes(search) ||
        (item.country || '').toUpperCase().includes(search);

      const matchesRole = !selected || String(item.role_id) === selected;

      return matchesSearch && matchesRole;
    });

    setPosts(filtered);
  }, [data, searchText, selectedRole]);

  // ----------------------------
  // PAGINATION
  // ----------------------------
  const getPaginatedData = () => posts;
  const getTotalPages = () => totalPages;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchUsers(newPage, pageSize);
    }
  };

  const handlePageSizeChange = (newSize) => {
    fetchUsers(1, newSize);
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
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

  const fetchRoles = useCallback(async () => {
    try {
      const response = await axiosInstance.post('/api/admin/FetchUserRoles');
      if (response.status === 200 && response.data.status === 'Success') {
        const activeRoles = (response.data.data || []).filter(r => r.status === true);
        setRoles(activeRoles);
      } else {
        showErrorAlert('Error', 'Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      showErrorAlert('Error', 'Failed to fetch roles');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setTableLoading(true);
      setTableError(null);

      const isSeller = Number(userInfo?.role_id) === 4;
      const url = isSeller ? '/api/admin/users/by-district' : 'api/admin/FetchUsers';
      const response = isSeller
        ? await axiosInstance.get(url, { params: { district: userInfo?.district } })
        : await axiosInstance.post(url);

      if (response.status === 200 && response.data.status === 'Success') {
        const fetchedData = response.data.data || [];
        const parseSortableValue = (value) => {
          if (!value && value !== 0) {
            return 0;
          }
          if (value instanceof Date) {
            return value.getTime();
          }
          if (typeof value === 'number') {
            return value;
          }
          const numericValue = Number(value);
          if (!Number.isNaN(numericValue)) {
            return numericValue;
          }
          const parsedDate = new Date(value);
          const time = parsedDate.getTime();
          return Number.isNaN(time) ? 0 : time;
        };

        const sortedData = [...fetchedData].sort((a, b) => {
          const getPrimaryTime = (item) =>
            parseSortableValue(
              item?.created_at ||
                item?.createdAt ||
                item?.created_date ||
                item?.createdDate ||
                item?.updated_at ||
                item?.updatedAt ||
                item?.modified_at ||
                item?.modifiedAt
            );

          const aTime = getPrimaryTime(a);
          const bTime = getPrimaryTime(b);
          if (aTime !== bTime) {
            return bTime - aTime;
          }

          const fallbackA = parseSortableValue(a?.user_id || a?.id || a?._id);
          const fallbackB = parseSortableValue(b?.user_id || b?.id || b?._id);
          return fallbackB - fallbackA;
        });

        setData(sortedData);
        setPosts(sortedData);
      } else {
        setTableError('Failed to fetch users');
        setData([]);
        setPosts([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setTableError('Error fetching users. Please try again.');
      setData([]);
      setPosts([]);
    } finally {
      setTableLoading(false);
    }
  }, [userInfo?.role_id]);

  useEffect(() => {
    if (!fetchUsersCalled.current) {
      fetchUsers();
      fetchRoles(); // fetch roles once
      fetchUsersCalled.current = true;
    }
  }, [fetchUsers, fetchRoles]);

  useEffect(() => {
    if (!Array.isArray(roles) || roles.length === 0) {
      setRoleSummaries([]);
      return;
    }

    const counts = data.reduce((acc, item) => {
      const key = String(item.role_id || '').trim();
      if (!key) {
        return acc;
      }
      const currentCount = acc.get(key) || 0;
      acc.set(key, currentCount + 1);
      return acc;
    }, new Map());

    const summaries = roles
      .map((roleItem) => {
        const key = String(roleItem.role_id || '').trim();
        const count = counts.get(key) || 0;
        return {
          roleId: roleItem.role_id,
          roleName: roleItem.role_name,
          count,
        };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => {
        const nameA = (a.roleName || '').toLowerCase();
        const nameB = (b.roleName || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

    setRoleSummaries((prev) => {
      if (
        prev.length === summaries.length &&
        prev.every((item, index) =>
          item.roleId === summaries[index].roleId &&
          item.count === summaries[index].count &&
          item.roleName === summaries[index].roleName
        )
      ) {
        return prev;
      }
      return summaries;
    });
  }, [roles, data]);

  useEffect(() => {
    if (!selectedRole) {
      return;
    }
    const stillExists = roleSummaries.some((item) => String(item.roleId) === String(selectedRole));
    if (!stillExists) {
      setSelectedRole('');
    }
  }, [roleSummaries, selectedRole]);

  // Common modal container style to match other modals
  const modalAddStyle = {
    display: 'block',
    backgroundColor: 'rgba(0,0,0,0.5)',
    pointerEvents: 'auto',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: '100vw',
    zIndex: 1050,
  };

  const handleSearchInputChange = (e) => {
    setSearchText(e.target.value);
  };

  useEffect(() => {
    if (!Array.isArray(data)) {
      setPosts([]);
      return;
    }

    const normalizedSearch = searchText.trim().toUpperCase();
    const normalizedRole = String(selectedRole || '').trim();

    const filtered = data.filter((item) => {
      const name = (item.name || '').toUpperCase();
      const email = (item.email || '').toUpperCase();
      const phoneValue = String(item.phone || '');
      const districtValue = (item.district || '').toUpperCase();
      const cityValue = (item.city || '').toUpperCase();
      const countryValue = (item.country || '').toUpperCase();
      const roleValue = String(item.role_id || '').trim();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        name.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        phoneValue.includes(normalizedSearch) ||
        districtValue.includes(normalizedSearch) ||
        cityValue.includes(normalizedSearch) ||
        countryValue.includes(normalizedSearch);

      const matchesRole =
        normalizedRole.length === 0 ||
        roleValue === normalizedRole;

      return matchesSearch && matchesRole;
    });

    setPosts(filtered);
  }, [data, searchText, selectedRole]);

  const handleRoleSelect = (roleId) => {
    setSelectedRole(String(roleId || '').trim());
  };

  const resetRoleFilter = () => {
    setSelectedRole('');
  };

  const handleViewUser = (dataItem) => {
    navigate('/superadmin/ViewManageUser', { state: { dataItem } });
  };

  const handleEditUser = (dataItem) => {
    navigate('/superadmin/EditManageUsers', { state: { dataItem } });
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setFormError(null);

      const payload = {
        role_id: role,
        name,
        email,
        password,
        phone,
        createdby: userInfo.email,
        address,
        addressline1,
        addressline2,
        city,
        district,
        state: stateField,
        pincode,
        country
      };

      const response = await axiosInstance.post('api/admin/AddUsers', payload);

      if (response.status === 200 && response.data.status === 'Success') {
        await fetchUsers();
        closeAddModal();
        resetForm();
        showSuccessAlert('Success', 'User added successfully');
        return { success: true };
      } else {
        const msg = response.data.message || 'Failed to add user';
        setFormError(msg);
        showErrorAlert('Error', msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error adding user. Please try again.';
      setFormError(msg);
      showErrorAlert('Error', msg);
    } finally {
      setFormLoading(false);
    }
  };

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

  const handleSellerAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSeller) return;

    // For first-time assignment ensure state/district are present
    if (assignMode === 'assign') {
      if (!assignState?.trim() || !assignDistrict?.trim()) {
        showErrorAlert('Validation', 'State and District are required for assignment');
        return;
      }
    }

    try {
      setAssignLoading(true);
      const payload = {
        seller_id: selectedSeller.user_id,
        assign_state: String(assignState || '').trim(),
        assign_district: String(assignDistrict || '').trim(),
        assign_status: !!assignStatus,
      };

      const url = assignMode === 'reassign' ? '/api/admin/ReAssignSeller' : '/api/admin/AssignSeller';
      const resp = await axiosInstance.post(url, payload);

      if (resp.status === 200 && resp.data.status === 'Success') {
        await fetchUsers();
        closeAssignSellerModal();
        showSuccessAlert('Success', assignMode === 'reassign' ? 'Seller reassigned successfully' : 'Seller assigned successfully');
      } else {
        const msg = resp.data?.message || 'Assignment failed';
        showErrorAlert('Error', msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Assignment failed';
      showErrorAlert('Error', msg);
    } finally {
      setAssignLoading(false);
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

  const totalUsers = data.length;

  return {
    // table
    posts,
    isLoading: tableLoading,
    error: tableError,
    handleSearchInputChange,
    searchText,
    handleRoleSelect,
    resetRoleFilter,
    selectedRole,
    roleSummaries,
    totalUsers,
    handleViewUser,
    handleEditUser,

    // add user modal
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
    handleAddUserSubmit,
    roles,

    // seller assignment modal
    assignModalOpen,
    assignMode,
    selectedSeller,
    assignState, setAssignState,
    assignDistrict, setAssignDistrict,
    assignStatus, setAssignStatus,
    assignLoading,
    openAssignSellerModal,
    closeAssignSellerModal,
    handleSellerAssignSubmit,

    // styles
    modalAddStyle,
  };
};

export default useManageUsers;
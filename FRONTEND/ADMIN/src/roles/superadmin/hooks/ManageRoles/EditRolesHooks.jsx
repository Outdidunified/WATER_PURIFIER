//EditRoles
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/utils';
import { showSuccessAlert, showErrorAlert } from '../../../../utils/alert';

const useEditRoles = (userInfo) => {
    const location = useLocation();
    const navigate = useNavigate();

    const storedData = localStorage.getItem('editRoleData');
    const dataItem = location.state?.role || (storedData ? JSON.parse(storedData) : null);

    useEffect(() => {
        if (dataItem) {
            localStorage.setItem('editRoleData', JSON.stringify(dataItem));
        }
    }, [dataItem]);

    const [errorMessage, setErrorMessage] = useState('');
    const [selectStatus, setSelectedStatus] = useState(dataItem?.status ? 'true' : 'false');
    const [isloading, setIsLoading] = useState(false);
    const [name, setName] = useState(dataItem?.role_name || '');

    const [initialValues, setInitialValues] = useState({
        role_name: dataItem?.role_name || '',
        status: dataItem?.status ? 'true' : 'false'
    });

    const isModified = (
        name.trim() !== initialValues.role_name.trim() ||
        selectStatus !== initialValues.status
    );

    const handleStatusChange = (e) => {
        setSelectedStatus(e.target.value);
    };

    const backManageUser = () => {
        navigate('/superadmin/ManageRoles');
    };

    const editManageUser = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setErrorMessage("Role name can't be empty.");
            return;
        }

        try {
            setIsLoading(true);

            const updatedRole = {
                role_id: dataItem.role_id,
                role_name: name.trim(),
                modified_by: userInfo?.email,
                status: selectStatus === 'true',
            };

            const response = await axiosInstance.post('/api/admin/UpdateUserRoles', updatedRole);

            if (response.status === 200) {
                showSuccessAlert('Role updated successfully');
                backManageUser();
            } else {
                showErrorAlert('Error', response?.data?.message || 'Failed to update role');
            }
        } catch (error) {
            showErrorAlert('Error', 'An error occurred while updating the role');
        } finally {
            setIsLoading(false);
        }
    };

    const goBack = () => navigate(-1);

    return {
        dataItem,
        name, setName,
        selectStatus, setSelectedStatus,
        errorMessage, setErrorMessage,
        handleStatusChange,
        editManageUser,
        isModified,
        goBack,
        backManageUser,
        isloading
    };
};

export default useEditRoles;

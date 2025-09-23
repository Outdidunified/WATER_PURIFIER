//ViewRoles
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const useViewRoles = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [role, setRole] = useState({
        _id: '',
        role_id: '',
        role_name: '',
        created_date: '',
        created_by: '',
        modified_by: '',
        modified_date: '',
        status: false,
    });

    useEffect(() => {
        const { dataItem } = location.state || {};

        if (dataItem) {
            const formattedRole = {
                _id: dataItem._id || '',
                role_id: dataItem.role_id || '',
                role_name: dataItem.role_name || '',
                created_date: dataItem.created_date || '',
                created_by: dataItem.created_by || '',
                modified_by: dataItem.modified_by || '',
                modified_date: dataItem.modified_date || '',
                status: dataItem.status || false,
            };

            setRole(formattedRole);
            localStorage.setItem('roleData', JSON.stringify(formattedRole));
        } else {
            const savedData = JSON.parse(localStorage.getItem('roleData'));
            if (savedData) {
                setRole(savedData);
            }
        }
    }, [location]);

    const handleBack = () => {
        navigate('/superadmin/ManageRoles');
    };

    const handleEditRole = (role) => {
        navigate('/superadmin/EditRoles', { state: { role } });
    };

    return {
        role,
        setRole,
        handleBack,
        handleEditRole,
    };
};

export default useViewRoles;

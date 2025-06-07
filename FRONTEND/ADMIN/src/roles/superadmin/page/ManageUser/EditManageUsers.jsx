import React from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';
import useEditManageUsers from '../../hooks/ManageUser/EditManageUsersHooks';

const EditManageUsers = ({ userInfo, handleLogout }) => {
    const navigate = useNavigate();

    const {
        editManageUser,
        setPhone,
        handleStatusChange,
        isModified,
        name,
        setName,
        email,
        setEmail,
        password,
        setPassword,
        phone,
        city,
        setCity,
        errorMessage,
        selectStatus,
        setSelectedStatus,
        dataItem,
        goBack,
        isloading: loading,
        setErrorMessage
    } = useEditManageUsers(userInfo);

    const backManageDevice = () => {
        navigate('/superadmin/ViewManageUser');
    };

    return (
        <div className='container-scroller'>
            {/* Header */}
            <Header userInfo={userInfo} handleLogout={handleLogout} />
            <div className="container-fluid page-body-wrapper">
                {/* Sidebar */}
                <Sidebar />
                <div className="main-panel">
                    <div className="content-wrapper">
                        <div className="row">
                            <div className="col-md-12 grid-margin">
                                <div className="row">
                                    <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                                        <h3 className="font-weight-bold">Edit User List</h3>
                                    </div>
                                    <div className="col-12 col-xl-4">
                                        <div className="justify-content-end d-flex">
                                            <button type="button" className="btn btn-success" onClick={backManageDevice}>Back</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-lg-12 grid-margin stretch-card">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="col-12 grid-margin">
                                            <div className="card">
                                                <div className="card-body">
                                                    <h4 className="card-title">Manage User</h4>
                                                    <form className="form-sample" onSubmit={editManageUser}>
                                                        <div className="row">
                                                            {/* Name (Read-only) */}
                                                            <div className="col-md-6">
                                                                <div className="form-group row">
                                                                    <label className="col-sm-12 col-form-label labelInput">Name</label>
                                                                    <div className="col-sm-12">
                                                                        <InputField
                                                                            value={name}
                                                                            maxLength={50}
                                                                            readOnly
                                                                            required
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Email (Read-only) */}
                                                            <div className="col-md-6">
                                                                <div className="form-group row">
                                                                    <label className="col-sm-12 col-form-label labelInput">Email</label>
                                                                    <div className="col-sm-12">
                                                                        <InputField
                                                                            type="email"
                                                                            value={email}
                                                                            readOnly
                                                                            maxLength={50}
                                                                            required
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Phone Number - Only 10 digits */}
                                                            <div className="col-md-6">
                                                                <div className="form-group row">
                                                                    <label className="col-sm-12 col-form-label labelInput">Phone Number</label>
                                                                    <div className="col-sm-12">
                                                                        <InputField
                                                                            value={phone}
                                                                            maxLength={10}
                                                                            pattern="[1-9][0-9]{9}" // optional if you want extra browser validation
                                                                            title="Phone number must be 10 digits and should not start with 0"
                                                                            onChange={(e) => {
                                                                                let value = e.target.value.replace(/[^0-9]/g, '');
                                                                                // Prevent entering a number starting with 0
                                                                                if (value.length === 1 && value === '0') {
                                                                                    return;
                                                                                }
                                                                                setPhone(value);
                                                                            }}
                                                                            required
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>


                                                            {/* Password - Only 4 digits */}
                                                            <div className="col-md-6">
                                                                <div className="form-group row">
                                                                    <label className="col-sm-12 col-form-label labelInput">Password (4-digit)</label>
                                                                    <div className="col-sm-12">
                                                                        <InputField
                                                                            type="text"
                                                                            value={password}
                                                                            maxLength={4}
                                                                            pattern="\d{4}"
                                                                            title="Password must be exactly 4 digits"
                                                                            onChange={(e) => {
                                                                                const value = e.target.value.replace(/[^0-9]/g, '');
                                                                                setPassword(value);
                                                                            }}
                                                                            required
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* City - Only alphabets, min 2 characters */}
                                                            <div className="col-md-6">
                                                                <div className="form-group row">
                                                                    <label className="col-sm-12 col-form-label labelInput">City</label>
                                                                    <div className="col-sm-12">
                                                                        <InputField
                                                                            value={city}
                                                                            maxLength={50}
                                                                            pattern="^[a-zA-Z ]{2,}$"
                                                                            title="City name should contain at least 2 letters and only alphabets"
                                                                            onChange={(e) => {
                                                                                const value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                                                                                setCity(value);
                                                                            }}
                                                                            required
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Status Dropdown */}
                                                            <div className="col-md-6">
                                                                <div className="form-group row">
                                                                    <label className="col-sm-12 col-form-label labelInput">Status</label>
                                                                    <div className="col-sm-12">
                                                                        <select
                                                                            className="form-control"
                                                                            value={selectStatus}
                                                                            onChange={handleStatusChange}
                                                                            required
                                                                        >
                                                                            <option value="true">Active</option>
                                                                            <option value="false">Inactive</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {errorMessage && <div className="text-danger">{errorMessage}</div>}<br />

                                                        <ReusableButton
                                                            type="submit"
                                                            disabled={loading || !isModified}
                                                            loading={loading}
                                                        >
                                                            Update
                                                        </ReusableButton>
                                                    </form>

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Footer */}
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default EditManageUsers;

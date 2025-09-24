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
        setPassword,
        setCity,
        setName,
        setEmail,
        setAddressLine1,
        setAddressLine2,
        setDistrict,
        setState,
        setCountry,
        setPincode,
        handleStatusChange,
        isModified,
        name,
        email,
        password,
        phone,
        city,
        addressline1,
        addressline2,
        district,
        state,
        country,
        pincode,
        selectStatus,
        errorMessage,
        isloading: loading,
        backManageUser
    } = useEditManageUsers(userInfo);

    return (
        <div className='container-scroller'>
            <Header userInfo={userInfo} handleLogout={handleLogout} />
            <div className="container-fluid page-body-wrapper">
                <Sidebar />
                <div className="main-panel">
                    <div className="content-wrapper">
                        <div className="row mb-3">
                            <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                                <h3 className="font-weight-bold">Edit User List</h3>
                            </div>
                            <div className="col-12 col-xl-4 d-flex justify-content-end">
                                <button type="button" className="btn btn-success" onClick={backManageUser}>Back</button>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-lg-12 grid-margin stretch-card">
                                <div className="card">
                                    <div className="card-body">
                                        <h4 className="card-title">Manage User</h4>
                                        <form className="form-sample" onSubmit={editManageUser}>
                                            <div className="row">

                                                {/* Name */}
                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label">Name</label>
                                                        <div className="col-sm-12">
                                                            <InputField value={name} readOnly maxLength={50} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Email */}
                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label">Email</label>
                                                        <div className="col-sm-12">
                                                            <InputField type="email" value={email} readOnly maxLength={50} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Phone */}
                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label">Phone Number</label>
                                                        <div className="col-sm-12">
                                                            <InputField
                                                                value={phone}
                                                                maxLength={10}
                                                                pattern="[1-9][0-9]{9}"
                                                                title="Phone must be 10 digits and cannot start with 0"
                                                                onChange={(e) => {
                                                                    let value = e.target.value.replace(/[^0-9]/g, '');
                                                                    if (value.length === 1 && value === '0') return;
                                                                    setPhone(value);
                                                                }}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Password */}
                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label">Password (4-digit)</label>
                                                        <div className="col-sm-12">
                                                            <InputField
                                                                type="text"
                                                                value={password}
                                                                maxLength={4}
                                                                pattern="\d{4}"
                                                                title="Password must be exactly 4 digits"
                                                                onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, ''))}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Address Line 1 */}
                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label">Address Line 1</label>
                                                        <div className="col-sm-12">
                                                            <InputField
                                                                value={addressline1}
                                                                maxLength={100}
                                                                onChange={(e) => setAddressLine1(e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Address Line 2 */}
                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label">Address Line 2</label>
                                                        <div className="col-sm-12">
                                                            <InputField
                                                                value={addressline2}
                                                                maxLength={100}
                                                                onChange={(e) => setAddressLine2(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* City */}
                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label">City</label>
                                                        <div className="col-sm-12">
                                                            <InputField
                                                                value={city}
                                                                maxLength={50}
                                                                pattern="^[a-zA-Z ]{2,}$"
                                                                title="City should have at least 2 letters and only alphabets"
                                                                onChange={(e) => setCity(e.target.value.replace(/[^a-zA-Z ]/g, ''))}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* District */}
                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label">District</label>
                                                        <div className="col-sm-12">
                                                            <InputField
                                                                value={district}
                                                                maxLength={50}
                                                                onChange={(e) => setDistrict(e.target.value.replace(/[^a-zA-Z ]/g, ''))}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* State */}
                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label">State</label>
                                                        <div className="col-sm-12">
                                                            <InputField
                                                                value={state}
                                                                maxLength={50}
                                                                onChange={(e) => setState(e.target.value.replace(/[^a-zA-Z ]/g, ''))}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Country */}
                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label">Country</label>
                                                        <div className="col-sm-12">
                                                            <InputField
                                                                value={country}
                                                                maxLength={50}
                                                                onChange={(e) => setCountry(e.target.value.replace(/[^a-zA-Z ]/g, ''))}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Pincode */}
                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label">Pincode</label>
                                                        <div className="col-sm-12">
                                                            <InputField
                                                                value={pincode}
                                                                maxLength={6}
                                                                pattern="\d{6}"
                                                                title="Pincode must be exactly 6 digits"
                                                                onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status Dropdown */}
                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label">Status</label>
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

                                            {errorMessage && <div className="text-danger mb-2">{errorMessage}</div>}

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
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default EditManageUsers;

//EditRoles
import React from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';
import useEditRoles from '../../hooks/ManageRoles/EditRolesHooks';
const EditRoles = ({ userInfo, handleLogout }) => {
    const navigate = useNavigate();

    const {
        editManageUser,
        name,
        setName,
        selectStatus,
        handleStatusChange,
        isModified,
        errorMessage,
        setErrorMessage,
        goBack,
        backManageUser,
        isloading: loading
    } = useEditRoles(userInfo);

    return (
        <div className='container-scroller'>
            <Header userInfo={userInfo} handleLogout={handleLogout} />
            <div className="container-fluid page-body-wrapper">
                <Sidebar />
                <div className="main-panel">
                    <div className="content-wrapper">
                        <div className="row">
                            <div className="col-md-12 grid-margin">
                                <div className="row">
                                    <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                                        <h3 className="font-weight-bold">Edit Role</h3>
                                    </div>
                                    <div className="col-12 col-xl-4">
                                        <div className="justify-content-end d-flex">
                                            <button type="button" className="btn btn-success" onClick={backManageUser}>Back</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-lg-12 grid-margin stretch-card">
                                <div className="card">
                                    <div className="card-body">
                                        <h4 className="card-title">Manage Role</h4>
                                        <form className="form-sample" onSubmit={editManageUser}>
                                            <div className="row">

                                                {/* ✅ Role Name (Read-only) */}
                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label labelInput">Role Name</label>
                                                        <div className="col-sm-12">
                                                            <InputField
                                                                value={name}
                                                                maxLength={50}
                                                                readOnly
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    const sanitizedValue = value.replace(/[^a-zA-Z0-9 ]/g, '');
                                                                    setName(sanitizedValue);
                                                                }}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ✅ Status */}
                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label labelInput">Status</label>
                                                        <div className="col-sm-12">
                                                            <select
                                                                className="form-control"
                                                                value={selectStatus}
                                                                onChange={handleStatusChange}
                                                            >
                                                                <option value="true">Active</option>
                                                                <option value="false">Inactive</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>

                                            {/* Error message */}
                                            {errorMessage && <div className="text-danger">{errorMessage}</div>}
                                            <br />

                                            {/* Submit button */}
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

export default EditRoles;

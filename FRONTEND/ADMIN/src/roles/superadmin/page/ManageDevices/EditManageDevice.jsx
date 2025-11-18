//EditManageDevice
import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Sidebar from '../../components/Sidebar';
import InputField from '../../../../utils/InputField';
import ReusableButton from '../../../../utils/ReusableButton';
import useEditDevice from '../../hooks/ManageDevices/EditManageDeviceHooks';

const EditManageDevice = ({ userInfo, handleLogout }) => {
    const {
        wpDeviceId, setWpDeviceId,
        modelId, setModelId,
        modelName, setModelName,
        status, setStatus,
        initialStatus,
        loading,
        updateDevice,
        goBackToManageDevices,
        errorMessage
    } = useEditDevice(userInfo);

    return (
        <div className="container-scroller">
            <Header userInfo={userInfo} handleLogout={handleLogout} />
            <div className="container-fluid page-body-wrapper">
                <Sidebar />
                <div className="main-panel">
                    <div className="content-wrapper">
                        <div className="row">
                            <div className="col-md-12 grid-margin">
                                <div className="row">
                                    <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                                        <h3 className="font-weight-bold">Edit Device Details</h3>
                                    </div>
                                    <div className="col-12 col-xl-4">
                                        <div className="justify-content-end d-flex">
                                            <button
                                                type="button"
                                                className="btn btn-success"
                                                onClick={goBackToManageDevices}
                                            >
                                                Back
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-lg-12 grid-margin stretch-card" >
                                <div className="card">
                                    <div className="card-body">
                                        <h4 className="card-title">Manage Device</h4>
                                        <form className="form-sample" onSubmit={updateDevice}>
                                            {errorMessage && (
                                                <p className="text-danger">{errorMessage}</p>
                                            )}

                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label labelInput">WP Device ID</label>
                                                        <div className="col-sm-12">
                                                            <InputField
                                                                value={wpDeviceId}
                                                                onChange={(e) => {
                                                                    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                                                                    setWpDeviceId(value);
                                                                }}
                                                                maxLength={50}
                                                                placeholder="Enter WP Device ID"
                                                                required
                                                                readOnly
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label labelInput">Model ID</label>
                                                        <div className="col-sm-12">
                                                            <InputField
                                                                type="number"
                                                                min="1"
                                                                value={modelId}
                                                                onChange={(e) => {
                                                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                                                    setModelId(value);
                                                                }}
                                                                placeholder="Enter Model ID"
                                                                required
                                                                readOnly
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label labelInput">Model Name</label>
                                                        <div className="col-sm-12">
                                                            <InputField
                                                                value={modelName}
                                                                onChange={(e) => {
                                                                    const value = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '');
                                                                    setModelName(value);
                                                                }}
                                                                maxLength={100}
                                                                placeholder="Enter Model Name"
                                                                required
                                                                readOnly
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <div className="form-group row">
                                                        <label className="col-sm-12 col-form-label labelInput">Status</label>
                                                        <div className="col-sm-12">
                                                            <select
                                                                className="form-control"
                                                                value={status}
                                                                onChange={(e) => setStatus(e.target.value)}
                                                                required
                                                            >
                                                                <option value="">Select Status</option>
                                                                <option value="active">Active</option>
                                                                <option value="inactive">Inactive</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="d-flex justify-content-center">
                                                <ReusableButton
                                                    type="submit"
                                                    loading={loading}
                                                    disabled={loading || status === initialStatus || !status}
                                                >
                                                    Update
                                                </ReusableButton>
                                            </div>
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

export default EditManageDevice;

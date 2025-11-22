//ManageDevice
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';
import useManageDevice from '../../hooks/ManageDevices/ManageDeviceHooks';
import Pagination from '../../components/Pagination/Pagination';

const ManageDevice = ({ userInfo, handleLogout }) => {
    const navigate = useNavigate();

    const {
        stationData,
        setStationData,
        loading,
        error,
        modalAddStyle,
        handleAddStationToggle,
        closeAddModal,
        addStation,
        handleSearchInputChange,
        isLoading,
        filteredStations,
        models,
        fetchModels,
        currentPage,
        pageSize,
        totalRecords,
        getPaginatedData,
        getTotalPages,
        handlePageChange,
        handlePageSizeChange,
    } = useManageDevice(userInfo);

    const handleViewStation = (dataItem) => {
        navigate('/superadmin/ViewManageDevice', { state: { dataItem } });
    };

    const summaryCardStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #4c5bfd 0%, #7c8bff 100%)',
        color: '#ffffff',
        borderRadius: '18px',
        padding: '9px 16px',
        boxShadow: '0 10px 22px rgba(76, 91, 253, 0.25)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        width: 'auto',
        minHeight: '44px',
        minWidth: '160px',
        border: 'none',
        outline: 'none',
    };

    const summaryCardContentStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: '12px',
    };

    const summaryTextStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        lineHeight: 1.1,
    };

    const summaryLabelStyle = {
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'none',
        opacity: 0.9,
        whiteSpace: 'nowrap',
    };

    const summaryValueStyle = {
        fontSize: '20px',
        fontWeight: 700,
        lineHeight: 1,
    };

    const summaryCaretStyle = {
        fontSize: '18px',
        opacity: 0.85,
    };

    return (
        <div className="container-scroller">
            <Header userInfo={userInfo} handleLogout={handleLogout} />
            <div className="container-fluid page-body-wrapper">
                <Sidebar />
                <div className="main-panel">
                    <div className="content-wrapper">
                        <div className="row">
                            <div className="col-md-12 grid-margin" style={{ marginBottom: '10px' }}>
                                <div className="row align-items-center gx-3 gy-2 flex-wrap" >
                                    <div className="col-auto">
                                        <h3 className="font-weight-bold mb-0" style={{ fontSize: '22px' }}>Manage Device</h3>
                                    </div>
                                    <div className="col-auto">
                                        <div
                                            style={summaryCardStyle}
                                        >
                                            <div style={summaryCardContentStyle}>
                                                <div style={summaryTextStyle}>
                                                    <span style={summaryLabelStyle}>Total Devices</span>
                                                    <span style={summaryValueStyle}>{totalRecords}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col ms-auto d-flex flex-column align-items-end gap-2">
                                        <div className="d-flex justify-content-end">
                                            <button
                                                type="button"
                                                className="btn btn-success btn-sm"
                                                onClick={() => { handleAddStationToggle(); fetchModels(); }}
                                                style={{ padding: '9px 28px', fontSize: '14px', borderRadius: '12px' }}
                                            >
                                                Create Device
                                            </button>
                                        </div>

                                        <div className="modalStyle" style={modalAddStyle}>
                                            <div className="modalContStyle">
                                                <span
                                                    onClick={closeAddModal}
                                                    style={{
                                                        float: 'right',
                                                        cursor: 'pointer',
                                                        fontSize: '30px',
                                                        color: '#333',
                                                    }}
                                                >
                                                    &times;
                                                </span>
                                                <form className="card" onSubmit={addStation}>
                                                    <div className="card-body">
                                                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                            <h4 className="card-title" style={{ color: '#222' }}>
                                                                Create Device
                                                            </h4>
                                                        </div>
                                                        <div className="input-group mb-3">
                                                            <div className="input-group-prepend">
                                                                <span className="input-group-text" style={{ width: '120px' }}>Model</span>
                                                            </div>
                                                            <select
                                                                className="form-control"
                                                                name="model_name"
                                                                value={stationData.model_name || ''}
                                                                onChange={(e) => setStationData(prev => ({ ...prev, model_name: e.target.value }))}
                                                                required
                                                            >
                                                                <option value="">Select Model</option>
                                                                {models
                                                                    .filter(model => model.status && model.wp_device_quantity > 0)
                                                                    .map(model => (
                                                                        <option key={model.id} value={model.model_name}>
                                                                            {model.model_name}
                                                                        </option>
                                                                    ))}

                                                            </select>
                                                        </div>

                                                        <div className="input-group mb-3">
                                                            <div className="input-group-prepend">
                                                                <span className="input-group-text" style={{ width: '120px' }}>WP Device ID</span>
                                                            </div>
                                                            <InputField
                                                                type="text"
                                                                name="wp_device_id"
                                                                placeholder="Enter WP Device ID"
                                                                value={stationData.wp_device_id || ''}
                                                                onChange={(e) => {
                                                                    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                                                                    setStationData(prev => ({ ...prev, wp_device_id: value }));
                                                                }}
                                                                maxLength={50}
                                                                required
                                                            />
                                                        </div>

                                                        

                                                        {error && <div className="text-danger mt-2">{error}</div>}

                                                        <div className="text-center mt-4 mr-5">
                                                            <ReusableButton type="submit" loading={loading} disabled={loading || !stationData.wp_device_id || !stationData.model_name}>
                                                                Create Device
                                                            </ReusableButton>
                                                        </div>
                                                    </div>
                                                </form>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-lg-12 grid-margin stretch-card">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="row mb-2">
                                            <div className="col-md-8">
                                                <h4 className="card-title">List Of Devices</h4>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="input-group">
                                                    <div className="input-group-prepend hover-cursor">
                                                        <span className="input-group-text">
                                                            <i className="icon-search" />
                                                        </span>
                                                    </div>
                                                    <InputField
                                                        placeholder="Search now"
                                                        ariaLabel="search"
                                                        ariadescribedby="search"
                                                        autoComplete="off"
                                                        onChange={handleSearchInputChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                           <div className="table-responsive dynamic-table">
                                            <table className="table table-striped text-center">
                                                <thead style={{ textAlign: 'center', position: 'sticky', tableLayout: 'fixed', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                                                    <tr>
                                                        <th>Sl.No</th>
                                                        <th>WP Device ID</th>
                                                        <th>Model Name</th>
                                                        <th>Created By</th>
                                                        <th>Created Date</th>
                                                        <th>Status</th>
                                                        <th>Options</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {isLoading ? (
                                                        <tr>
                                                            <td colSpan="7">Loading...</td>
                                                        </tr>
                                                    ) : filteredStations.length > 0 ? (
                                                        getPaginatedData().map((station, index) => (
                                                            <tr key={station._id || index}>
                                                                <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                                                <td>{station.wp_device_id || '-'}</td>
                                                                <td style={{
                                                                    whiteSpace: 'pre-wrap',
                                                                    wordBreak: 'break-word',
                                                                    maxWidth: '250px',
                                                                    textAlign: 'center'
                                                                }}>
                                                                    {station.model_name || '-'}
                                                                </td>
                                                                <td>{station.createdby || '-'}</td>
                                                                <td>{station.createddate ? new Date(station.createddate).toLocaleString() : '-'}</td>
                                                                <td>
                                                                    <span className={station.status ? 'text-success' : 'text-danger'}>
                                                                        {station.status ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-success btn-icon-text"
                                                                        onClick={() => handleViewStation(station)}
                                                                    >
                                                                        <i className="mdi mdi-eye"></i> View
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="7">{error ? `Error: ${error}` : 'No Devices found.'}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {totalRecords > 0 && (
                                            <Pagination
                                                currentPage={currentPage}
                                                totalPages={getTotalPages()}
                                                pageSize={pageSize}
                                                onPageChange={handlePageChange}
                                                onPageSizeChange={handlePageSizeChange}
                                                totalRecords={totalRecords}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Footer />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageDevice;

//ManageDevice
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';
import useManageDevice from '../../hooks/ManageDevices/ManageDeviceHooks';
//manage device 
const ManageDevice = ({ userInfo, handleLogout }) => {
    const navigate = useNavigate();

    const {
        stationData,
        setStationData,
        loading,
        error,
        modalAddStyle,
        theadsticky,
        theadfixed,
        theadBackgroundColor,
        handleAddStationToggle,
        closeAddModal,
        addStation,
        handleSearchInputChange,
        setSelectedChargerId,
        handleInputChange,
        isLoading,
        filteredStations,
        models,
        fetchModels,
    } = useManageDevice(userInfo);

    const handleViewStation = (dataItem) => {
        navigate('/superadmin/ViewManageDevice', { state: { dataItem } });
    };

    const handleModelChange = (e) => {
        const selectedModel = models.find(model => model.model_name === e.target.value);
        if (selectedModel) {
            setStationData(prev => ({
                ...prev,
                model_id: selectedModel.id,
                model_name: selectedModel.model_name
            }));
        }
    };

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
                                        <h3 className="font-weight-bold">Manage Device</h3>
                                    </div>
                                    <div className="col-12 col-xl-4">
                                        <div className="justify-content-end d-flex">
                                            <button type="button" className="btn btn-success" onClick={() => { handleAddStationToggle(); fetchModels(); }}>
                                                Add Device
                                            </button>

                                            {/* Add Device Modal */}
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
                                                                    Add Device
                                                                </h4>
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
  .filter(model => model.status) // only include models with status === true
  .map(model => (
    <option key={model.id} value={model.model_name}>
      {model.model_name}
    </option>
))}

                                                                </select>
                                                            </div>

                                                            {error && <div className="text-danger mt-2">{error}</div>}

                                                            <div className="text-center mt-4">
                                                                <ReusableButton type="submit" loading={loading} disabled={loading}>
                                                                    Add Device
                                                                </ReusableButton>
                                                            </div>
                                                        </div>
                                                    </form>

                                                </div>
                                            </div>
                                            {/* End Modal */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Station Table */}
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

                                        <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                            <table className="table table-striped text-center">
                                                <thead style={{ textAlign: 'center', position: 'sticky', tableLayout: 'fixed', top: 0, backgroundColor: 'white', zIndex: 1 }}>

                                                    <tr>
                                                        <th>Sl.No</th>
                                                        <th>WP Device ID</th>
                                                        <th>Model ID</th>
                                                        <th>Model Name</th>
                                                        <th>Created By</th>
                                                        <th>Created Date</th>
                                                        <th>Status</th>
                                                        <th>Options</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredStations.length > 0 ? (
                                                        filteredStations.map((station, index) => (
                                                            <tr key={station._id || index}>
                                                                <td>{index + 1}</td>
                                                                <td>{station.wp_device_id || '-'}</td>
                                                                <td>{station.model_id || '-'}</td>
                                                                <td>{station.model_name || '-'}</td>
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
                                                            <td colSpan="8">No Devices found.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

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

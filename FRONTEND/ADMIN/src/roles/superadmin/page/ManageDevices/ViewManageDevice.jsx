//ViewManageDevice
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import { formatTimestamp } from '../../../../utils/formatTimestamp';
import useViewDevice from '../../hooks/ManageDevices/ViewManageDeviceHooks';

const ViewManageDevice = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const device = useViewDevice();
  const planConfig = device.plan_config || {};
  const connectivity = planConfig.connectivity || {};

  const handleBack = () => {
    navigate('/superadmin/ManageDevice');
  };

  const handleEditDevice = () => {
    navigate('/superadmin/EditManageDevice', { state: { deviceData: device } });
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
                    <h3 className="font-weight-bold">Device Details</h3>
                  </div>
                  <div className="col-12 col-xl-4">
                    <div className="justify-content-end d-flex">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-icon-text"
                        onClick={handleEditDevice}
                        style={{ marginRight: '10px' }}
                      >
                        <i className="mdi mdi-pencil btn-icon-prepend"></i>Edit
                      </button>
                      <button type="button" className="btn btn-success" onClick={handleBack}>
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title" style={{ textAlign: 'center', paddingBottom: '10px' }}>
                      Device Information
                    </h4>
                    <hr />

                    <div className="row viewDataCss">
                      <div className="col-md-4 view-data-item">
                        <span className="view-data-label">Device ID</span> <span className="view-data-value">{device.wp_device_id || '-'}</span>
                      </div>
                      <div className="col-md-4 view-data-item">
                        <span className="view-data-label">Model Name</span> <span className="view-data-value">{device.model_name || '-'}</span>
                      </div>
                      <div className="col-md-4 view-data-item">
                        <span className="view-data-label">Model ID</span> <span className="view-data-value">{device.model_id || '-'}</span>
                      </div>
                    </div>

                    <div className="row viewDataCss" style={{ marginTop: '10px' }}>
                      <div className="col-md-4 view-data-item">
                        <span className="view-data-label">Status</span>
                        <span className="view-data-value" style={{color: device.status === true ? '#28a745' : device.status === false ? '#dc3545' : '#000'}}>
                          {device.status === true ? 'Active' : device.status === false ? 'Inactive' : '-'}
                        </span>
                      </div>
                      <div className="col-md-4 view-data-item">
                        <span className="view-data-label">Created By</span> <span className="view-data-value">{device.createdby || '-'}</span>
                      </div>
                      <div className="col-md-4 view-data-item">
                        <span className="view-data-label">Model Assigned By</span> <span className="view-data-value">{device.model_assigned_by || '-'}</span>
                      </div>
                    </div>

                    <div className="row viewDataCss" style={{ marginTop: '10px' }}>
                      <div className="col-md-4 view-data-item">
                        <span className="view-data-label">Modified By</span> <span className="view-data-value">{device.modifiedby || '-'}</span>
                      </div>
                      <div className="col-md-4 view-data-item">
                        <span className="view-data-label">Created Date</span>
                        <span className="view-data-value">{device.createddate ? formatTimestamp(device.createddate) : '-'}</span>
                      </div>
                      <div className="col-md-4 view-data-item">
                        <span className="view-data-label">Modified Date</span>
                        <span className="view-data-value">{device.modifieddate ? formatTimestamp(device.modifieddate) : '-'}</span>
                      </div>
                    </div>

                    <div className="row viewDataCss" style={{ marginTop: '10px' }}>
                      <div className="col-md-4 view-data-item">
                        <span className="view-data-label">Model Assigned Date</span>
                        <span className="view-data-value">{device.model_assigned_date ? formatTimestamp(device.model_assigned_date) : '-'}</span>
                      </div>
                       <div className="col-md-4 view-data-item">
                        <span className="view-data-label">MAC ID</span> <span className="view-data-value">{device.mac_id || device.enter_mac_id || '-'}</span>
                      </div>
                      <div className="col-md-4 view-data-item">
                        <span className="view-data-label">Plan Start Date</span> <span className="view-data-value">{device.plan_config?.startDate ? formatTimestamp(device.plan_config.startDate) : '-'}</span>
                      </div>
                    </div>

                    <div className="row viewDataCss" style={{ marginTop: '10px' }}>
                     
                      <div className="col-md-4 view-data-item">
                        <span className="view-data-label">Plan End Date</span> <span className="view-data-value">{device.plan_config?.endDate ? formatTimestamp(device.plan_config.endDate) : '-'}</span>
                      </div>
                    </div>

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

export default ViewManageDevice;

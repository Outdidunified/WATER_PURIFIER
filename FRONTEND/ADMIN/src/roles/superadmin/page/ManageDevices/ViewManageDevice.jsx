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
                      <div className="col-md-4">
                        <strong>Device ID:</strong> <span>{device.wp_device_id || '-'}</span>
                      </div>
                      <div className="col-md-4">
                        <strong>Model Name:</strong> <span>{device.model_name || '-'}</span>
                      </div>
                      <div className="col-md-4">
                        <strong>Model ID:</strong> <span>{device.model_id || '-'}</span>
                      </div>
                    </div>

                    <div className="row viewDataCss" style={{ marginTop: '10px' }}>
                      <div className="col-md-4">
                        <strong>Status:</strong>{' '}
                        <span className={device.status === true ? 'text-success' : device.status === false ? 'text-danger' : ''}>
                          {device.status === true ? 'Active' : device.status === false ? 'Inactive' : '-'}
                        </span>
                      </div>
                      <div className="col-md-4">
                        <strong>Created By:</strong> <span>{device.createdby || '-'}</span>
                      </div>
                      <div className="col-md-4">
                        <strong>Modified By:</strong> <span>{device.modifiedby || '-'}</span>
                      </div>
                    </div>

                    <div className="row viewDataCss" style={{ marginTop: '10px' }}>
                      <div className="col-md-4">
                        <strong>Model Assigned By:</strong> <span>{device.model_assigned_by || '-'}</span>
                      </div>
                      <div className="col-md-4">
                        <strong>Created Date:</strong>{' '}
                        <span>{device.createddate ? formatTimestamp(device.createddate) : '-'}</span>
                      </div>
                      <div className="col-md-4">
                        <strong>Modified Date:</strong>{' '}
                        <span>{device.modifieddate ? formatTimestamp(device.modifieddate) : '-'}</span>
                      </div>
                    </div>

                    <div className="row viewDataCss" style={{ marginTop: '10px' }}>
                      <div className="col-md-4">
                        <strong>Model Assigned Date:</strong>{' '}
                        <span>{device.model_assigned_date ? formatTimestamp(device.model_assigned_date) : '-'}</span>
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

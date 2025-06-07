import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import { formatTimestamp } from '../../../../utils/formatTimestamp';
import useViewRoles from '../../hooks/ManageRoles/ViewRolesHooks';
const ViewRoles = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();

  const { role, handleBack, handleEditRole } = useViewRoles(); // Updated to use "role"

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
                    <h3 className="font-weight-bold">Manage Roles</h3>
                  </div>
                  <div className="col-12 col-xl-4">
                    <div className="justify-content-end d-flex">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-icon-text"
                        onClick={() => handleEditRole(role)}
                        style={{ marginRight: '10px' }}
                      >
                        <i className="mdi mdi-pencil btn-icon-prepend"></i>Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={handleBack}
                      >
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
                      Role Details
                    </h4>
                    <hr />

                    <div className="row col-12 viewDataCss">
                      <div className="col-md-4"><strong>Role ID:</strong> {role.role_id || '-'}</div>
                      <div className="col-md-4"><strong>Role Name:</strong> {role.role_name || '-'}</div>
                      <div className="col-md-4">
                        <strong>Status:</strong>{' '}
                        {role.status ? (
                          <span className="text-success">Active</span>
                        ) : (
                          <span className="text-danger">DeActive</span>
                        )}
                      </div>
                    </div>

                    <div className="row col-12 viewDataCss">
                      <div className="col-md-4"><strong>Created By:</strong> {role.created_by || '-'}</div>
                      <div className="col-md-4"><strong>Created Date:</strong> {role.created_date ? formatTimestamp(role.created_date) : '-'}</div>
                      <div className="col-md-4"><strong>Modified By:</strong> {role.modified_by || '-'}</div>
                    </div>

                    <div className="row col-12 viewDataCss">
                      <div className="col-md-4"><strong>Modified Date:</strong> {role.modified_date ? formatTimestamp(role.modified_date) : '-'}</div>
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

export default ViewRoles;

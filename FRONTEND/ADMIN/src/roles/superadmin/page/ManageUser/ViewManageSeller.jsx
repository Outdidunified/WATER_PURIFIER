// ViewManageSeller
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { formatTimestamp } from '../../../../utils/formatTimestamp';
import useViewManageSeller from '../../hooks/ManageUser/ViewManageSellersHooks';

const ViewManageSeller = ({ userInfo, handleLogout }) => {
  const { seller, handleBack, handleEditSeller } = useViewManageSeller();

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
                    <h3 className="font-weight-bold">Manage Seller's</h3>
                  </div>
                  <div className="col-12 col-xl-4">
                    <div className="justify-content-end d-flex">
                      <button type="button" className="btn btn-outline-primary btn-icon-text" onClick={() => handleEditSeller(seller)} style={{ marginRight: '10px' }}>
                        <i className="mdi mdi-pencil btn-icon-prepend"></i>Edit
                      </button>
                      <button type="button" className="btn btn-success" onClick={handleBack}>Back</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title text-center pb-3">Seller Details</h4>
                    <hr />

                    <div className="row col-12 viewDataCss">
                      <div className="col-md-4"><strong>Name:</strong> {seller.name || '-'}</div>
                      <div className="col-md-4"><strong>Email:</strong> {seller.email || '-'}</div>
                      <div className="col-md-4"><strong>Phone:</strong> {seller.phone || '-'}</div>
                    </div>

                    <div className="row col-12 viewDataCss">
                      <div className="col-md-4"><strong>Password:</strong> {seller.password || '-'}</div>
                      <div className="col-md-4"><strong>District:</strong> {seller.district || '-'}</div>
                      <div className="col-md-4"><strong>Status:</strong> {seller.status ? <span className="text-success">Active</span> : <span className="text-danger">DeActive</span>}</div>
                    </div>

                    <div className="row col-12 viewDataCss">
                      <div className="col-md-4"><strong>Address Line 1:</strong> {seller.addressline1 || '-'}</div>
                      <div className="col-md-4"><strong>Address Line 2:</strong> {seller.addressline2 || '-'}</div>
                      <div className="col-md-4"><strong>City:</strong> {seller.city || '-'}</div>
                    </div>

                    <div className="row col-12 viewDataCss">
                      <div className="col-md-4"><strong>State:</strong> {seller.state || '-'}</div>
                      <div className="col-md-4"><strong>Country:</strong> {seller.country || '-'}</div>
                      <div className="col-md-4"><strong>Pincode:</strong> {seller.pincode || '-'}</div>
                    </div>

                    <div className="row col-12 viewDataCss">
                      <div className="col-md-4"><strong>User ID:</strong> {seller.user_id || '-'}</div>
                      <div className="col-md-4"><strong>Created By:</strong> {seller.createdby || '-'}</div>
                      <div className="col-md-4"><strong>Modified By:</strong> {seller.modifiedby || '-'}</div>
                    </div>

                    <div className="row col-12 viewDataCss">
                      <div className="col-md-4"><strong>Created Date:</strong> {seller.createddate || seller.createdDate ? formatTimestamp(seller.createddate || seller.createdDate) : '-'}</div>
                      <div className="col-md-4"><strong>Modified Date:</strong> {seller.modifieddate || seller.modifiedDate ? formatTimestamp(seller.modifieddate || seller.modifiedDate) : '-'}</div>
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

export default ViewManageSeller;
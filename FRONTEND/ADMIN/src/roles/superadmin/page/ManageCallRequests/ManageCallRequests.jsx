//ManageCallRequests
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import InputField from '../../../../utils/InputField';
import useManageCallRequests from '../../hooks/ManageCallRequests/ManageCallRequestsHooks';
import Pagination from '../../components/Pagination/Pagination';

const ManageCallRequests = ({ userInfo, handleLogout }) => {
  const {
    posts,
    loading,
    error,
    handleSearchInputChange,
    currentPage,
    pageSize,
    totalRecords,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
  } = useManageCallRequests(userInfo);

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString(); // Adjust formatting as needed
  };

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
                  <div className="col-12 col-xl-6 mb-4 mb-xl-0">
                    <h3 className="font-weight-bold">Manage Call Requests</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Table */}
            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    {/* Search */}
                    <div className="row">
                      <div className="col-md-12 grid-margin">
                        <div className="row">
                          <div className="col-4 col-xl-8">
                            <h4 className="card-title" style={{ paddingTop: '10px' }}>
                              Enquiries by End Users
                            </h4>
                          </div>
                          <div className="col-8 col-xl-4">
                            <div className="input-group">
                              <div className="input-group-prepend hover-cursor">
                                <span className="input-group-text" id="search">
                                  <i className="icon-search"></i>
                                </span>
                              </div>
                              <InputField
                                placeholder="Search now"
                                ariaLabel="search"
                                autoComplete="off"
                                ariadescribedby="search"
                                onChange={handleSearchInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Call Request Table */}
                       <div className="table-responsive dynamic-table">
                      <table className="table table-striped">
                        <thead style={{ textAlign: 'center', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                          <tr>
                            <th>Sl.No</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>City</th>
                            <th>Requested At</th>
                          </tr>
                        </thead>
                        <tbody style={{ textAlign: 'center' }}>
                          {loading ? (
                            <tr>
                              <td colSpan="5">Loading...</td>
                            </tr>
                          ) : error ? (
                            <tr>
                              <td colSpan="5">Error: {error}</td>
                            </tr>
                          ) : Array.isArray(posts) && posts.length > 0 ? (
                            posts.map((dataItem, index) => (
                              <tr key={dataItem._id}>
                                <td>{index + 1}</td>
                                <td>{dataItem.name || '-'}</td>
                                <td>{dataItem.phone || '-'}</td>
                                <td>{dataItem.city || '-'}</td>
                                <td>{formatDateTime(dataItem.requestedAt)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5">No call requests found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      totalRecords={totalRecords}
                    />
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

export default ManageCallRequests;

//ManageContact
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import InputField from '../../../../utils/InputField';
import useManageContact from '../../hooks/ManageContact/ManageContactHooks';
import Pagination from '../../components/Pagination/Pagination';

const ManageContact = ({ userInfo, handleLogout }) => {
  const {
    contacts,
    loading,
    error,
    handleSearchInputChange,
    currentPage,
    pageSize,
    totalRecords,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
  } = useManageContact(userInfo);

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
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
                    <h3 className="font-weight-bold">Manage Contact Enquiries</h3>
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

                    {/* Contact Table */}
                       <div className="table-responsive dynamic-table">
                      <table className="table table-striped">
                        <thead style={{ textAlign: 'center', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                          <tr>
                            <th style={{ minWidth: '60px' }}>Sl.No</th>
                            <th style={{ minWidth: '120px' }}>Name</th>
                            <th style={{ minWidth: '180px' }}>Email</th>
                            <th style={{ minWidth: '150px' }}>Subject</th>
                            <th style={{ minWidth: '300px' }}>Message</th>
                            <th style={{ minWidth: '180px' }}>Submitted At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan="6" className="text-center">Loading...</td>
                            </tr>
                          ) : error ? (
                            <tr>
                              <td colSpan="6" className="text-center">Error: {error}</td>
                            </tr>
                          ) : Array.isArray(contacts) && contacts.length > 0 ? (
                            contacts.map((item, index) => (
                              <tr key={item._id}>
                                <td>{index + 1}</td>
                                <td>{item.name || '-'}</td>
                                <td>{item.email || '-'}</td>
                                <td style={{
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  maxWidth: '250px',
                                  textAlign: 'center'
                                }}>{item.subject || '-'}</td>
                                <td style={{
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  maxWidth: '300px',
                                  textAlign: 'center'
                                }}>
                                  {item.message || '-'}
                                </td>
                                <td>{formatDateTime(item.submittedAt)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="text-center">No contact enquiries found</td>
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

export default ManageContact;

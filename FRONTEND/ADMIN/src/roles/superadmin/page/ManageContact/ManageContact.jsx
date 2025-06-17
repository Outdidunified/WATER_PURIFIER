//ManageContact
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import InputField from '../../../../utils/InputField';
import useManageContact from '../../hooks/ManageContact/ManageContactHooks';
const ManageContact = ({ userInfo, handleLogout }) => {
  const {
    contacts,
    loading,
    error,
    handleSearchInputChange,
  } = useManageContact();

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
                    <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <table className="table table-striped">
                        <thead style={{ textAlign: 'center', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                          <tr>
                            <th>Sl.No</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Subject</th>
                            <th>Message</th>
                            <th>Submitted At</th>
                          </tr>
                        </thead>
                        <tbody style={{ textAlign: 'center' }}>
                          {loading ? (
                            <tr>
                              <td colSpan="8">Loading...</td>
                            </tr>
                          ) : error ? (
                            <tr>
                              <td colSpan="8">Error: {error}</td>
                            </tr>
                          ) : Array.isArray(contacts) && contacts.length > 0 ? (
                            contacts.map((item, index) => (
                              <tr key={item._id}>
                                <td>{index + 1}</td>
                                <td>{item.name || '-'}</td>
                                <td>{item.email || '-'}</td>
                                                                <td>{item.subject || '-'}</td>
                                <td>{item.message || '-'}</td>
                                <td>{formatDateTime(item.submittedAt)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="8">No contact enquiries found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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

export default ManageContact;

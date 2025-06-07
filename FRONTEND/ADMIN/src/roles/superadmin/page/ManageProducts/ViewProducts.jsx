//ViewProducts
import React from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import { useViewProducts } from '../../hooks/ManageProducts/ViewProductsHooks';
import { formatTimestamp } from '../../../../utils/formatTimestamp';

const ViewProducts = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const { product } = useViewProducts();

  const handleBack = () => {
    navigate('/superadmin/ManageProducts');
  };

  const handleEditDeviceList = () => {
    navigate('/superadmin/EditProducts', { state: { newUser: product } });
  };

  return (
    <div className="container-scroller">
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="font-weight-bold">Product Details</h3>

              <div className="col-12 col-xl-4">
                <div className="justify-content-end d-flex">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-icon-text"
                    onClick={handleEditDeviceList}
                    style={{ marginRight: '10px' }}
                  >
                    <i className="mdi mdi-pencil btn-icon-prepend"></i>Edit
                  </button>

                  <button type="button" className="btn btn-success" onClick={handleBack}>Back</button>
                </div>
              </div>

            </div>

            <div className="card shadow-sm">
              <div className="card-body">
                <h4 className="card-title text-center mb-4">Product Information</h4>
                <hr />

                <div className="row justify-content-center mb-4">
                  {[
                    { key: 'main_img', label: 'Main Image' },
                    { key: 'sub_img_1', label: 'Sub Image 1' },
                    { key: 'sub_img_2', label: 'Sub Image 2' },
                    { key: 'sub_img_3', label: 'Sub Image 3' },
                    { key: 'sub_img_4', label: 'Sub Image 4' },
                  ].map((imgItem, idx) => (
                    product[imgItem.key] && (
                      <div className="col-md-2 col-4 mb-2 d-flex flex-column align-items-center" key={idx}>
                        <div
                          style={{
                            width: '120px',
                            height: '100px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f9f9f9',
                          }}
                        >
                          <img
                            src={`/upload/img/${product[imgItem.key]}`}
                            alt={imgItem.key}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </div>
                        <small className="mt-1 text-center">{imgItem.label}</small>
                      </div>
                    )
                  ))}
                </div>



                {/* First row: Model Name, Status, Quantity, Created By */}
                <div className="d-flex justify-content-between text-start mb-4 flex-wrap">
                  <div><strong>Model Name:</strong> {product.model_name || '-'}</div>
                  <div><strong>Status:</strong> {product.status ? 'Active' : 'Deactive'}</div>
                  <div><strong>Quantity:</strong> {product.wp_device_quantity || '-'}</div>
                  <div><strong>Created By:</strong> {product.createdby || '-'}</div>
                </div>

                {/* Second row: Created Date, Modified By, Modified Date */}


                {/* Product Details */}
                <div className="mb-3 text-start">
                  <strong>Product Details:</strong><br />
                  {product.product_details || '-'}
                </div>

                {/* Specifications PDF */}
                <div className="mb-4 text-start">
                  <strong>Specifications:</strong>{' '}
                  {product.product_specifications || '-'}
                </div>

                {/* Plans */}
                <h5 className="mt-4 mb-3">Available Plans</h5>
                {product.plans?.length > 0 ? (
                  <div className="table-responsive mb-4">
                    <table className="table table-bordered table-striped">
                      <thead className="table-light">
                        <tr>
                          <th>Plan</th>
                          <th>Capacity</th>
                          <th>Price (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.plans.map(plan => (
                          <tr key={plan.plans_id}>
                            <td>{plan.label}</td>
                            <td>{plan.capacity}</td>
                            <td>{plan.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p>No Plans Available</p>}

                {/* Durations */}
                <h5 className="mt-4 mb-3">Available Durations</h5>
                {product.duration?.length > 0 ? (
                  <div className="table-responsive mb-4">
                    <table className="table table-bordered table-striped">
                      <thead className="table-light">
                        <tr>
                          <th>Duration</th>
                          <th>GST (%)</th>
                          <th>Discount (%)</th>
                          <th>Security Deposit (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.duration.map(d => (
                          <tr key={d.duration_id}>
                            <td>{d.duration_time_limit}</td>
                            <td>{d.gst}</td>
                            <td>{d.discount}</td>
                            <td>{d.security_deposit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p>No Durations Available</p>}

              </div>
              <div className="d-flex justify-content-between text-center mb-4 flex-wrap px-3">
                <div className="mx-2">
                  <strong>Created Date:</strong><br />
                  <span>{formatTimestamp(product.createddate)}</span>
                </div>
                <div className="mx-2">
                  <strong>Modified By:</strong><br />
                  <span>{product.modifiedby || '-'}</span>
                </div>
                <div className="mx-2">
                  <strong>Modified Date:</strong><br />
                  <span>{product.modifieddate ? formatTimestamp(product.modifieddate) : '-'}</span>
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

export default ViewProducts;

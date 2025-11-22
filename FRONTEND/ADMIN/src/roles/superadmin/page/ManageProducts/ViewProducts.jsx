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
    navigate('/superadmin/EditProducts', { state: { dataItem: product } });
  };

  const renderPlansForDuration = (duration, allPlans) => {
    const plansToDisplay = duration.plans && duration.plans.length > 0 ? duration.plans : allPlans;
    
    if (!plansToDisplay?.length) {
      return <p className="text-muted mb-0">No plans configured.</p>;
    }

    return (
      <div className="detail-table mb-3">
        <table className="table table-bordered table-striped mb-1">
          <thead className="table-light">
            <tr>
              <th>Plan</th>
              <th>Capacity</th>
              <th>Price (₹)</th>
            </tr>
          </thead>
          <tbody>
            {plansToDisplay.map(plan => (
              <tr key={plan.plans_id}>
                <td>{plan.label || '-'}</td>
                <td>{plan.label === 'unlimited' ? 'Unlimited' : (plan.capacity || '-')}</td>
                <td>{plan.price ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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
                            src={
                              product[imgItem.key].startsWith('http') || product[imgItem.key].startsWith('https')
                                ? product[imgItem.key]
                                : product[imgItem.key].startsWith('/')
                                  ? `${import.meta.env.VITE_API_URL}${product[imgItem.key]}`
                                  : `${import.meta.env.VITE_API_URL}/upload/img/${product[imgItem.key]}`
                            }
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

                <div className="d-flex justify-content-between text-start mb-4 flex-wrap">
                  <div><strong>Model Name:</strong> {product.model_name || '-'}</div>
                  <div><strong>Model Type:</strong> {product.model_type || '-'}</div>
                  <div><strong>Status:</strong> {product.status ? 'Active' : 'Deactive'}</div>
                  <div><strong>Quantity:</strong> {product.wp_device_quantity || '-'}</div>
                  <div><strong>Created By:</strong> {product.createdby || '-'}</div>
                </div>
                <div className="mb-3 text-start">
                  <div><strong>Connectivity:</strong> {product.connectivity || '-'}</div>
                </div>

                <div className="mb-3 text-start">
                  <strong>Product Details:</strong><br />
                  {product.product_details || '-'}
                </div>

                <div className="mb-4 text-start">
                  <strong>Specifications:</strong>{' '}
                  {product.product_specifications ? (
                    <a href={
                      product.product_specifications.startsWith('http') || product.product_specifications.startsWith('https')
                        ? product.product_specifications
                        : product.product_specifications.startsWith('/')
                          ? `${import.meta.env.VITE_API_URL}${product.product_specifications}`
                          : `${import.meta.env.VITE_API_URL}/upload/pdf/${product.product_specifications}`
                    } target="_blank" rel="noopener noreferrer">
                      View PDF
                    </a>
                  ) : '-'}
                </div>

                <h5 className="mt-4 mb-3">Durations & Plans</h5>
                {product.duration?.length > 0 ? (
                  product.duration.map(duration => (
                    <div className="card mb-3" key={duration.duration_id}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">{duration.duration_time_limit || 'Duration'}</h6>
                        </div>

                        <div className="row text-start mt-3 mb-2 align-items-center">
                          <div className="col-12 col-md-4 mb-2 mb-md-0">
                            <div className="d-flex flex-column flex-md-row align-items-md-center">
                              <strong className="me-0 me-md-2">GST:</strong>
                              <span>{duration.gst ?? '-'}</span>
                            </div>
                          </div>
                          <div className="col-12 col-md-4 mb-2 mb-md-0 text-md-center">
                            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-center">
                              <strong className="me-0 me-md-2">Discount:</strong>
                              <span>{duration.discount ?? '-'}</span>
                            </div>
                          </div>
                          <div className="col-12 col-md-4 text-md-end">
                            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-end">
                              <strong className="me-0 me-md-2">Security Deposit:</strong>
                              <span>{duration.security_deposit ?? '-'}</span>
                            </div>
                          </div>
                        </div>

                        {renderPlansForDuration(duration, product.plans)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No durations available.</p>
                )}

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
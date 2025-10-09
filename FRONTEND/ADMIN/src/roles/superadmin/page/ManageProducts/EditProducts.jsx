import React from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';
import useEditProducts from '../../hooks/ManageProducts/EditProductsHooks';

const EditProducts = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const {
    loading,
    modelName,
    wpDeviceQuantity,
    productDetails,
    productSpecifications,
    mainImage,
    subImages,
    connectivity,
    setConnectivity,
    plans,
    durations,
    setModelName,
    setWpDeviceQuantity,
    setProductDetails,
    setProductSpecifications,
    setMainImage,
    handleSubImageChange,
    addPlan,
    handlePlanChange,
    addDuration,
    handleDurationChange,
    removeDuration,
    removePlan,
    handleAddProduct,
    status,
    setStatus,
    errorMessage
  } = useEditProducts(userInfo);

  const backManageDevice = () => navigate('/superadmin/ManageProducts');

  const planOptions = ["solo", "couple", "family", "unlimited"];

  return (
    <div className="container-scroller">
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="font-weight-bold">Edit Models</h3>
              <button type="button" className="btn btn-success" onClick={backManageDevice}>
                Back
              </button>
            </div>

            <div className="card">
              <div className="card-body">
                <form className="form-sample" onSubmit={handleAddProduct} noValidate>
                  {/* Model & Quantity */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label className="input-label" htmlFor="modelName">Model Name</label>
                      <InputField
                        id="modelName"
                        placeholder="Model Name"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        required
                        maxLength={100}
                        pattern="^[a-zA-Z0-9\s\-]+$"
                        title="Model Name must contain only letters, numbers, spaces, or hyphens."
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="input-label" htmlFor="wpDeviceQuantity">WP Device Quantity</label>
                      <InputField
                        type="text"
                        placeholder="Device Quantity"
                        value={wpDeviceQuantity}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setWpDeviceQuantity(val);
                        }}
                        maxLength={20}
                        required
                      />
                    </div>
                  </div>

                  {/* Connectivity */}
                  <div className="row mb-4">
                    <div className="col-md-12">
                      <label className="input-label">Connectivity *</label>
                      <div className="form-control" style={{ minHeight: '38px', display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
                        {connectivity.map((item, index) => (
                          <span key={index} style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '14px'
                          }}>
                            {item}
                            <span
                              onClick={() => setConnectivity(prev => prev.filter((_, i) => i !== index))}
                              style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}
                            >
                              ×
                            </span>
                          </span>
                        ))}
                        <select
                          style={{
                            border: 'none',
                            outline: 'none',
                            flex: 1,
                            minWidth: '150px',
                            backgroundColor: 'transparent'
                          }}
                          value=""
                          onChange={(e) => {
                            if (e.target.value && !connectivity.includes(e.target.value)) {
                              setConnectivity(prev => [...prev, e.target.value]);
                            }
                          }}
                        >
                          <option value="">Select Connectivity</option>
                          {['Bluetooth', 'Wifi', '4G', 'Ethernet']
                            .filter(option => !connectivity.includes(option))
                            .map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Product Details & Specs */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label className="input-label" htmlFor="productDetails">Product Details</label>
                      <textarea
                        id="productDetails"
                        className="form-control"
                        style={{ minHeight: '130px' }}
                        value={productDetails}
                        onChange={(e) => setProductDetails(e.target.value)}
                        required
                        maxLength={500}
                        placeholder="Enter product details (10-500 chars)"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="input-label" htmlFor="productSpecifications">Product Specifications (PDF)</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="form-control"
                        onChange={(e) => setProductSpecifications(e.target.files[0])}
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                      <label className="input-label">Main Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="mainImageInput"
                        onChange={(e) => setMainImage(e.target.files[0])}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => document.getElementById('mainImageInput').click()}
                      >
                        Choose File
                      </button>
                      <span style={{ marginLeft: '10px' }}>
                        {mainImage ? (mainImage instanceof File ? mainImage.name : mainImage) : 'No file chosen'}
                      </span>
                    </div>

                    {subImages.slice(0, 3).map((img, i) => (
                      <div className="col-md-6 mb-3" key={i}>
                        <label className="input-label">{`Sub Image ${i + 1}`}</label>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          id={`subImg${i}`}
                          onChange={(e) => handleSubImageChange(i, e.target.files[0])}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => document.getElementById(`subImg${i}`).click()}
                        >
                          Choose File
                        </button>
                        <span style={{ marginLeft: '10px' }}>
                          {img ? (img instanceof File ? img.name : img) : 'No file chosen'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Plans */}
                  <div className="mb-4">
                    <h5>Plans</h5>
                    {plans.map((plan, index) => {
                      const used = plans.map((p, i) => (i === index ? null : p.label)).filter(Boolean);
                      const availableOptions = planOptions.filter(opt => opt === plan.label || !used.includes(opt));
                      return (
                        <div className="row mb-3" key={index}>
                          <div className="col-md-4">
                            <select
                              className="form-control"
                              value={plan.label}
                              onChange={(e) => {
                                handlePlanChange(index, 'label', e.target.value);
                                if (e.target.value === 'solo') handlePlanChange(index, 'capacity', '1');
                                if (e.target.value === 'couple') handlePlanChange(index, 'capacity', '2');
                                if (e.target.value === 'family') handlePlanChange(index, 'capacity', '4');
                                if (e.target.value === 'unlimited') handlePlanChange(index, 'capacity', '');
                              }}
                              required
                            >
                              <option value="">Select Plan</option>
                              {availableOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                              ))}
                            </select>
                          </div>

                          {plan.label !== 'unlimited' && (
                            <div className="col-md-4">
                              <InputField
                                placeholder="Capacity"
                                value={plan.capacity}
                                onChange={(e) => handlePlanChange(index, 'capacity', e.target.value)}
                                required
                              />
                            </div>
                          )}

                          <div className="col-md-3">
                            <InputField
                              placeholder="Price"
                              value={plan.price}
                              onChange={(e) => handlePlanChange(index, 'price', e.target.value)}
                              required
                            />
                          </div>

                          {index !== 0 && (
                            <div className="col-md-1">
                              <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removePlan(index)}>Remove</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={addPlan} disabled={plans.length >= 4}>Add Plan</button>
                  </div>

                  {/* Durations */}
                  <div className="mb-4">
                    <h5>Durations</h5>
                    {durations.map((dur, i) => (
                      <div className="row mb-3" key={i}>
                        <div className="col-md-3">
                          <select
                            className="form-control"
                            value={dur.duration_time_limit}
                            onChange={(e) => handleDurationChange(i, 'duration_time_limit', e.target.value)}
                            required
                          >
                            <option value="28 days">28 days</option>
                            <option value="60 days">60 days</option>
                            <option value="90 days">90 days</option>
                            <option value="180 days">180 days</option>
                            <option value="360 days">360 days</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <InputField
                            placeholder="GST (%)"
                            value={dur.gst}
                            onChange={(e) => handleDurationChange(i, 'gst', e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-3">
                          <InputField
                            placeholder="Discount (%)"
                            value={dur.discount}
                            onChange={(e) => handleDurationChange(i, 'discount', e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-3">
                          <InputField
                            placeholder="Security Deposit"
                            value={dur.security_deposit}
                            onChange={(e) => handleDurationChange(i, 'security_deposit', e.target.value)}
                            required
                          />
                        </div>
                        {i !== 0 && (
                          <div className="col-md-12 d-flex justify-content-end mt-2">
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeDuration(i)}>Remove</button>
                          </div>
                        )}
                      </div>
                    ))}
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={addDuration}>Add Duration</button>
                  </div>

                  {/* Status */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label>Status</label>
                      <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: '200px' }}>
                        <option value="true">Active</option>
                        <option value="false">Deactive</option>
                      </select>
                    </div>
                  </div>

                  {errorMessage && <div className="text-danger mb-3">{errorMessage}</div>}

                  <div className="mt-4">
                    <ReusableButton type="submit" loading={loading}>Update</ReusableButton>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default EditProducts;

//AddProducts
import React from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';
import useAddProducts from '../../hooks/ManageProducts/AddProductsHooks';

const planOptions = ['solo', 'couple', 'family', 'unlimited'];
const durationOptions = ['28 days', '60 days', '90 days', '180 days', '360 days'];
const connectivityOptions = ['Bluetooth', 'Wifi', '4G', 'Ethernet'];

const AddProducts = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();

  const {
    loading,
    modelName,
    modelType,
    wpDeviceQuantity,
    productDetails,
    productSpecifications,
    mainImage,
    subImages,
    connectivity,
    durations,
    errorMessage,
    setModelName,
    setModelType,
    setWpDeviceQuantity,
    setProductDetails,
    setProductSpecifications,
    setMainImage,
    handleSubImageChange,
    setConnectivity,
    addDuration,
    removeDuration,
    handleDurationChange,
    addPlan,
    removePlan,
    handlePlanChange,
    handleAddProduct,
    removeSubImage,
    allDurationsUsed,
  } = useAddProducts(userInfo);

  const backManageDevice = () => {
    navigate('/superadmin/ManageProducts');
  };

  const handleConnectivityAdd = (value) => {
    const normalizedValue = typeof value === 'string' ? value.trim() : '';
    if (!normalizedValue || !connectivityOptions.includes(normalizedValue)) {
      return;
    }
    if (!connectivity.includes(normalizedValue)) {
      setConnectivity(prev => [...prev, normalizedValue]);
    }
  };

  const renderPlanControls = (duration, durationIndex) => {
    const usedOptions = duration.plans.map(plan => plan.label);

    return (
      <div className="card border" style={{ marginTop: '15px' }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Plans for {duration.duration_time_limit || 'Selected Duration'}</h6>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => addPlan(durationIndex)}
              disabled={duration.plans.length >= planOptions.length}
            >
              Add Plan
            </button>
          </div>

          {duration.plans.map((plan, planIndex) => {
            const availableOptions = planOptions.filter(
              option => option === plan.label || !usedOptions.includes(option)
            );

            return (
              <div className="row align-items-end mb-3" key={plan.plans_id || `${durationIndex}-${planIndex}`}>
                <div className="col-md-4">
                  <label className="input-label">Plan Type</label>
                  <select
                    className="form-control"
                    value={plan.label}
                    onChange={(e) => handlePlanChange(durationIndex, planIndex, 'label', e.target.value)}
                    required
                  >
                    <option value="">Select Plan</option>
                    {availableOptions.map(option => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {plan.label !== 'unlimited' && (
                  <div className="col-md-3">
                    <label className="input-label">Capacity (Litres)</label>
                    <InputField
                      placeholder="Capacity (Litres)"
                      value={plan.capacity}
                      onChange={(e) => handlePlanChange(durationIndex, planIndex, 'capacity', e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="col-md-3">
                  <label className="input-label">Price (₹)</label>
                  <InputField
                    type="text"
                    placeholder="Price"
                    value={plan.price}
                    onChange={(e) => handlePlanChange(durationIndex, planIndex, 'price', e.target.value)}
                    required
                  />
                </div>

                {duration.plans.length > 1 && (
                  <div className="col-md-2 d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removePlan(durationIndex, planIndex)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
              <h3 className="font-weight-bold">Add Model</h3>
              <button type="button" className="btn btn-success" onClick={backManageDevice}>
                Back
              </button>
            </div>

            <div className="card">
              <div className="card-body">
                <form className="form-sample" onSubmit={handleAddProduct}>
                  {/* Model Name, Type & Quantity */}
                  <div className="row mb-4">
                    <div className="col-md-4">
                      <label className="input-label">Model Name</label>
                      <InputField
                        placeholder="Model Name"
                        value={modelName}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^a-zA-Z0-9\s\-]/g, '');
                          setModelName(value);
                        }}
                        maxLength={100}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="input-label">Model Type</label>
                      <select
                        className="form-control"
                        value={modelType}
                        onChange={(e) => setModelType(e.target.value)}
                        required
                      >
                        <option value="">Select Model Type</option>
                        <option value="Base">Base</option>
                        <option value="Smart">Smart</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="input-label">WP Device Quantity</label>
                      <InputField
                        type="text"
                        placeholder="Device Quantity"
                        value={wpDeviceQuantity}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9]/g, '');
                          value = value.replace(/^0+(?=\d)/, '');
                          setWpDeviceQuantity(value);
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
                          onChange={(e) => handleConnectivityAdd(e.target.value)}
                        >
                          <option value="">Select Connectivity</option>
                          {connectivityOptions
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
                      <label className="input-label">Product Details</label>
                      <textarea
                        className="form-control"
                        style={{ minHeight: '130px' }}
                        value={productDetails}
                        onChange={(e) => setProductDetails(e.target.value.trimStart())}
                        required
                        maxLength={500}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="input-label">Product Specifications (PDF)</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="form-control"
                        onChange={(e) => setProductSpecifications(e.target.files[0])}
                      />
                      <small className="form-text text-muted">Upload PDF specifications (optional)</small>
                    </div>
                  </div>

                  {/* Image Fields */}
                  <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                      <label className="input-label">Main Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={(e) => setMainImage(e.target.files[0])}
                        required
                      />
                    </div>

                    {[0, 1, 2, 3].map((idx) => (
                      <div className="col-md-6 mb-3" key={idx}>
                        <label className="input-label">{`Sub Image ${idx + 1}`}</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control"
                          onChange={(e) => handleSubImageChange(idx, e.target.files[0])}
                        />
                        {subImages[idx] && (
                          <button
                            type="button"
                            className="btn btn-link text-danger p-0"
                            onClick={() => removeSubImage(idx)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Durations and Plans */}
                  <div className="mb-4">
                    <h5 className="card-title">Durations & Plans</h5>
                    {durations.map((duration, index) => {
                      const normalizeDurationValue = (value) =>
                        typeof value === 'string' ? value.trim().toLowerCase() : '';
                      const selectedDurationValues = durations
                        .filter((_, idx) => idx !== index)
                        .map((d) => normalizeDurationValue(d.duration_time_limit))
                        .filter(Boolean);
                      const currentDurationValue = normalizeDurationValue(duration.duration_time_limit);
                      const availableDurationOptions = durationOptions.filter((option) => {
                        const normalizedOption = normalizeDurationValue(option);
                        return (
                          normalizedOption === currentDurationValue ||
                          !selectedDurationValues.includes(normalizedOption)
                        );
                      });

                      return (
                        <div className="card mb-3" key={duration.duration_id || index}>
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h5 className="mb-0">Duration {index + 1}</h5>
                              {durations.length > 1 && (
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => removeDuration(index)}
                                >
                                  Remove Duration
                                </button>
                              )}
                            </div>

                            <div className="row mb-3">
                              <div className="col-md-3">
                                <label className="input-label">Duration</label>
                                <select
                                  className="form-control"
                                  value={duration.duration_time_limit}
                                  onChange={(e) => handleDurationChange(index, 'duration_time_limit', e.target.value)}
                                  required
                                >
                                  <option value="">Select Duration</option>
                                  {availableDurationOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="input-label">GST (%)</label>
                                <InputField
                                  type="text"
                                  placeholder="GST (%)"
                                  value={duration.gst}
                                  onChange={(e) => handleDurationChange(index, 'gst', e.target.value)}
                                  required
                                />
                              </div>
                              <div className="col-md-3">
                                <label className="input-label">Discount (%)</label>
                                <InputField
                                  type="text"
                                  placeholder="Discount (%)"
                                  value={duration.discount}
                                  onChange={(e) => handleDurationChange(index, 'discount', e.target.value)}
                                  required
                                />
                              </div>
                              <div className="col-md-3">
                                <label className="input-label">Security Deposit</label>
                                <InputField
                                  type="text"
                                  placeholder="Security Deposit"
                                  value={duration.security_deposit}
                                  onChange={(e) => handleDurationChange(index, 'security_deposit', e.target.value)}
                                  required
                                />
                              </div>
                            </div>

                            {renderPlanControls(duration, index)}
                          </div>
                        </div>
                      );
                    })}

                    <button 
                      type="button" 
                      className="btn btn-outline-primary btn-sm" 
                      onClick={addDuration}
                      disabled={allDurationsUsed}
                    >
                      Add Duration
                    </button>
                  </div>

                  {/* Error Message */}
                  {errorMessage && <div className="text-danger mt-3">{errorMessage}</div>}

                  {/* Submit Button */}
                  <div className="mt-4">
                    <ReusableButton type="submit" loading={loading}>
                      Add
                    </ReusableButton>
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

export default AddProducts;
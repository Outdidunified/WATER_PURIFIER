//AddProducts
import React from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';
import useAddProducts from '../../hooks/ManageProducts/AddProductsHooks';

const AddProducts = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();

  const {
    loading,
    modelName,
    wpDeviceQuantity,
    productDetails,
    productSpecifications,
    mainImage,
    subImg1,
    subImg2,
    subImg3,
    plans,
    durations,
    setModelName,
    setWpDeviceQuantity,
    setProductDetails,
    setProductSpecifications,
    setMainImage, handleAddProduct,
    setSubImg1, handleSubImageChange,
    setSubImg2, handlePlanChange,
    setSubImg3,
    subImages,
    connectivity,
    setConnectivity,
    addPlan,
    removePlan,
    updatePlan,
    addDuration,
    removeDuration,
    handleDurationChange,
    handleSubmit,
    errorMessage
  } = useAddProducts(userInfo);


  const backManageDevice = () => {
    navigate('/superadmin/ManageProducts');
  };

  return (
    <div className="container-scroller">
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="font-weight-bold">Add Manage Device</h3>
              <button type="button" className="btn btn-success" onClick={backManageDevice}>
                Back
              </button>
            </div>

            <div className="card">
              <div className="card-body">
                <form className="form-sample" onSubmit={handleAddProduct}>
                  {/* Model Name & Quantity */}
                  <div className="row mb-4">
                    <div className="col-md-6">
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
                    <div className="col-md-6">
                      <label className="input-label">WP Device Quantity</label>
                      <InputField
                        type="text"
                        placeholder="Device Quantity"
                        value={wpDeviceQuantity}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
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

                    <div className="col-md-6 mb-3">
                      <label className="input-label">Sub Image 1</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={(e) => handleSubImageChange(0, e.target.files[0])}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="input-label">Sub Image 2</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={(e) => handleSubImageChange(1, e.target.files[0])}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="input-label">Sub Image 3</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={(e) => handleSubImageChange(2, e.target.files[0])}
                        required
                      />
                    </div>
                  </div>

                 {/* Plans Section */}
{/* Plans Section */}
{/* <div className="mb-4">
  <h5 className="card-title">Plans</h5>
  {plans.map((plan, index) => (
    <div className="row mb-3" key={index}>
      <div className="col-md-4">
        <InputField
          placeholder="Plan Label"
          value={plan.label}
          onChange={(e) =>
            handlePlanChange(index, 'label', e.target.value.replace(/[^a-zA-Z0-9 ]/g, ''))
          }
          required
          maxLength={15}
        />
      </div>
      <div className="col-md-4">
        <InputField
          placeholder="Capacity"
          value={plan.capacity}
          onChange={(e) => handlePlanChange(index, 'capacity', e.target.value)}
          required
          maxLength={15}
        />
      </div>
      <div className="col-md-3">
      <InputField
  type="text"
  placeholder="Price"
  value={plan.price || ''}
  maxLength={10}
  title="Enter a valid price (up to 2 decimal places)."
  onChange={(e) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');

    // Prevent more than one decimal point
    const dotCount = (val.match(/\./g) || []).length;
    if (dotCount > 1) return;

    // Optional: Limit to 2 decimal places
    if (val.includes('.')) {
      const [intPart, decimalPart] = val.split('.');
      if (decimalPart.length > 2) return;
    }

    // Optional: Prevent leading zeros before integer part (e.g., 00123)
    val = val.replace(/^0+(\d)/, '$1');

    handlePlanChange(index, 'price', val);
  }}
  required
/>

      </div>
      {index !== 0 && (
        <div className="col-md-1 d-flex align-items-center">
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => removePlan(index)}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  ))}
  <button
    type="button"
    className="btn btn-outline-primary btn-sm"
    onClick={addPlan}
  >
    Add Plan
  </button>
</div> */}

{/* Plans Section */}
<div className="mb-4">
  <h5 className="card-title">Plans</h5>
  {plans.map((plan, index) => {
    const allOptions = ["solo", "couple", "family", "unlimited"];
    const usedOptions = plans.map((p) => p.label);
    const availableOptions = allOptions.filter(
      (opt) => opt === plan.label || !usedOptions.includes(opt)
    );

    return (
      <div className="row mb-3" key={index}>
        {/* Plan Type Dropdown */}
        <div className="col-md-4">
          <select
            className="form-control"
            value={plan.label}
            onChange={(e) => {
              handlePlanChange(index, "label", e.target.value);

              // Reset capacity if switching to unlimited
              if (e.target.value === "unlimited") {
                handlePlanChange(index, "capacity", "");
              }
            }}
            required
          >
            <option value="">Select Plan</option>
            {availableOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Capacity - Hide if Unlimited */}
        {plan.label !== "unlimited" && (
          <div className="col-md-4">
            <InputField
              placeholder="Capacity"
              value={plan.capacity}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^0-9]/g, "");
                handlePlanChange(index, "capacity", numericValue);
              }}
              required
              maxLength={15}
            />
          </div>
        )}

        {/* Price */}
        <div className="col-md-3">
          <InputField
            type="text"
            placeholder="Price"
            value={plan.price || ""}
            maxLength={10}
            title="Enter a valid price (up to 2 decimal places)."
            onChange={(e) => {
              let val = e.target.value.replace(/[^0-9.]/g, "");

              // Prevent multiple decimal points
              const dotCount = (val.match(/\./g) || []).length;
              if (dotCount > 1) return;

              // Limit to 2 decimal places
              if (val.includes(".")) {
                const [intPart, decimalPart] = val.split(".");
                if (decimalPart.length > 2) return;
              }

              // Prevent leading zeros
              val = val.replace(/^0+(\d)/, "$1");

              handlePlanChange(index, "price", val);
            }}
            required
          />
        </div>

        {/* Remove Button */}
        {index !== 0 && (
          <div className="col-md-1 d-flex align-items-center">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => removePlan(index)}
            >
              Remove
            </button>
          </div>
        )}
      </div>
    );
  })}

  {/* Add Plan Button */}
  <button
    type="button"
    className="btn btn-outline-primary btn-sm"
    onClick={addPlan}
    disabled={plans.length >= 4} // prevent adding more than 4 (since only 4 unique options exist)
  >
    Add Plan
  </button>
</div>


{/* Durations Section */}
<div className="mb-4">
  <h5 className="card-title">Durations</h5>
  {durations.map((duration, index) => (
    <div className="row mb-3" key={index}>
      <div className="col-md-3">
     <select
  className="form-control"
  value={duration.duration_time_limit}
  onChange={(e) => handleDurationChange(index, 'duration_time_limit', e.target.value)}
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
  type="text"
  placeholder="GST (%)"
  value={duration.gst}
  maxLength={5} // e.g., 100.00 = 6 characters
  title="Enter GST percentage (0 to 100, up to 2 decimal places)"
  onChange={(e) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');

    // Allow only one decimal point
    if ((val.match(/\./g) || []).length > 1) return;

    // Limit to 2 decimal places
    if (val.includes('.')) {
      const [intPart, decimalPart] = val.split('.');
      if (decimalPart.length > 2) return;
    }

    // Prevent GST above 100
    if (parseFloat(val) > 100) return;

    handleDurationChange(index, 'gst', val);
  }}
  required
/>

      </div>
      <div className="col-md-3">
        <InputField
  type="text"
  placeholder="Discount (%)"
  value={duration.discount}
  maxLength={5} // e.g., 100.00 = 6 chars
  title="Enter discount percentage (0 to 100, up to 2 decimal places)"
  onChange={(e) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');

    // Allow only one decimal point
    if ((val.match(/\./g) || []).length > 1) return;

    // Limit to 2 decimal places
    if (val.includes('.')) {
      const [intPart, decimalPart] = val.split('.');
      if (decimalPart.length > 2) return;
    }

    // Prevent discount above 100
    if (parseFloat(val) > 100) return;

    handleDurationChange(index, 'discount', val);
  }}
  required
/>

      </div>
      <div className="col-md-3">
        <InputField
  type="text"
  placeholder="Security Deposit"
  value={duration.security_deposit}
  maxLength={10} // Adjust as needed
  title="Enter a positive amount (up to 2 decimal places)"
  onChange={(e) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');

    // Allow only one decimal point
    if ((val.match(/\./g) || []).length > 1) return;

    // Limit to 2 decimal places
    if (val.includes('.')) {
      const [intPart, decimalPart] = val.split('.');
      if (decimalPart.length > 2) return;
    }

    // Avoid leading multiple zeroes
    if (/^0\d+/.test(val)) return;

    // Prevent negative values (only positive numbers allowed)
    if (val === '' || parseFloat(val) >= 0) {
      handleDurationChange(index, 'security_deposit', val);
    }
  }}
  required
/>

      </div>
      {index !== 0 && (
        <div className="col-md-12 d-flex justify-content-end mt-2">
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => removeDuration(index)}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  ))}
  <button
    type="button"
    className="btn btn-outline-primary btn-sm"
    onClick={addDuration}
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
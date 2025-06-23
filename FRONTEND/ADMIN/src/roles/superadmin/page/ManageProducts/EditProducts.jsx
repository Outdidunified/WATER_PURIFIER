//EditProducts
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
    mainImage, isModified,
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
    addPlan,
    removePlan,
    updatePlan,
    addDuration,
    removeDuration,
    handleDurationChange,
    handleSubmit, setStatus, status,
    errorMessage
  } = useEditProducts(userInfo);


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
              <h3 className="font-weight-bold">Edit Products</h3>
              <button type="button" className="btn btn-success" onClick={backManageDevice}>
                Back
              </button>
            </div>

            <div className="card">
              <div className="card-body">
                <form className="form-sample" onSubmit={handleAddProduct} noValidate>

                  {/* Model Name & Quantity */}
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
                        pattern="^[a-zA-Z0-9\s\-]+$"  // allows letters, numbers, spaces, hyphens
                        title="Model Name must be 2-50 characters and contain only letters, numbers, spaces or hyphens."
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="input-label" htmlFor="wpDeviceQuantity">WP Device Quantity</label>
                     
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
      placeholder="Enter detailed product description (10 to 500 characters)"
      title="Product Details must be 10-500 characters."
    />
  </div>
  <div className="col-md-6">
    <label className="input-label" htmlFor="productSpecifications">Product Specifications</label>
    <textarea
      id="productSpecifications"
      className="form-control"
      style={{ minHeight: '130px' }}
      value={productSpecifications}
      onChange={(e) => setProductSpecifications(e.target.value)}
      required
      minLength={10}
      maxLength={500}
      placeholder="Enter product specifications (10 to 500 characters)"
      title="Product Specifications must be 10-500 characters."
    />
  </div>
</div>



                  {/* Image Fields */}
                  <div className="row mb-4">
                    {/* Main Image */}
                    <div className="col-md-6 mb-3">
                      <label className="input-label" htmlFor="mainImageInput">Main Image</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Hidden file input */}
                        <input
                          id="mainImageInput"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setMainImage(e.target.files[0])}
                          style={{ display: 'none' }}
                          required={!mainImage}  // require if no existing image
                          title="Please upload a main image."
                        />

                        {/* Choose File button */}
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => document.getElementById('mainImageInput').click()}
                          style={{ flexShrink: 0 }}
                        >
                          Choose File
                        </button>

                        {/* Filename or previous image name */}
                        <div
                          style={{
                            flexGrow: 1,
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            height: '38px',
                            lineHeight: '24px',
                            color: '#6c757d',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            userSelect: 'none',
                            backgroundColor: '#e9ecef',
                          }}
                        >
                          {mainImage
                            ? mainImage instanceof File
                              ? mainImage.name
                              : mainImage // string filename
                            : 'No file chosen'}
                        </div>

                        {/* Thumbnail preview */}
                        {(mainImage && typeof mainImage === 'string') && (
                          <img
                            src={mainImage.startsWith('/upload/img/') ? mainImage : `/upload/img/${mainImage}`}
                            alt="Main"
                            style={{ width: '50px', height: '50px', borderRadius: '5px', objectFit: 'cover', border: '1px solid #ccc' }}
                            title={mainImage}
                          />
                        )}

                        {(mainImage && mainImage instanceof File) && (
                          <img
                            src={URL.createObjectURL(mainImage)}
                            alt="Main"
                            style={{ width: '50px', height: '50px', borderRadius: '5px', objectFit: 'cover', border: '1px solid #ccc' }}
                            title={mainImage.name}
                          />
                        )}
                      </div>
                    </div>

                    {/* Sub Images */}
{subImages.slice(0, 3).map((img, index) => (
                      <div className="col-md-6 mb-3" key={index}>
                        <label className="input-label" htmlFor={`subImageInput${index}`}>{`Sub Image ${index + 1}`}</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            id={`subImageInput${index}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSubImageChange(index, e.target.files[0])}
                            style={{ display: 'none' }}
                            // not required, optional images
                            required
                            title="Upload a sub image"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => document.getElementById(`subImageInput${index}`).click()}
                            style={{ flexShrink: 0 }}
                          >
                            Choose File
                          </button>
                          <div
                            style={{
                              flexGrow: 1,
                              border: '1px solid #ced4da',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              height: '38px',
                              lineHeight: '24px',
                              color: '#6c757d',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              userSelect: 'none',
                              backgroundColor: '#e9ecef',
                            }}
                          >
                            {img
                              ? img instanceof File
                                ? img.name
                                : img
                              : 'No file chosen'}
                          </div>
                          {(img && typeof img === 'string') && (
                            <img
                              src={img.startsWith('/upload/img/') ? img : `/upload/img/${img}`}
                              alt={`Sub ${index + 1}`}
                              style={{ width: '50px', height: '50px', borderRadius: '5px', objectFit: 'cover', border: '1px solid #ccc' }}
                              title={img}
                            />
                          )}
                          {(img && img instanceof File) && (
                            <img
                              src={URL.createObjectURL(img)}
                              alt={`Sub ${index + 1}`}
                              style={{ width: '50px', height: '50px', borderRadius: '5px', objectFit: 'cover', border: '1px solid #ccc' }}
                              title={img.name}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Plans Section (with Price) */}
                 <div className="mb-4">
  <h5 className="card-title">Plans</h5>
  {plans.map((plan, index) => (
    <div className="row mb-3" key={index}>
      <div className="col-md-4">
        <InputField
          placeholder="Plan Label"
          value={plan.label}
          onChange={(e) => handlePlanChange(index, 'label', e.target.value)}
          required
          minLength={1}
          maxLength={15}
          title="Plan label is required and should be max 30 characters."
        />
      </div>
      <div className="col-md-4">
        <InputField
          placeholder="Capacity"
          value={plan.capacity}
          onChange={(e) => handlePlanChange(index, 'capacity', e.target.value)}
          required
          minLength={1}
          maxLength={15}
          title="Capacity is required and should be max 20 characters."
        />
      </div>
      <div className="col-md-3">
        <InputField
          type="text"
          placeholder="Price"
          value={plan.price || ''}
          onChange={(e) => handlePlanChange(index, 'price', e.target.value)}
          required
          maxLength={10}
          title="Price."
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
  <button type="button" className="btn btn-outline-primary btn-sm" onClick={addPlan}>
    Add Plan
  </button>
</div>


                  {/* Durations Section (without Price) */}
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
  maxLength={5}
  title="Enter GST percentage (0 - 100)"
  onChange={(e) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');

    // Allow only one decimal
    if ((val.match(/\./g) || []).length > 1) return;

    // Convert to float to validate range
    if (val !== '' && parseFloat(val) > 100) return;

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
  maxLength={5}
  title="Enter discount percentage (0 - 100)"
  onChange={(e) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');

    // Allow only one decimal point
    if ((val.match(/\./g) || []).length > 1) return;

    // Validate the range 0–100
    if (val !== '' && parseFloat(val) > 100) return;

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
  maxLength={10}
  title="Security Deposit must be a positive number."
  onChange={(e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');

    // Allow only one decimal point
    if ((val.match(/\./g) || []).length > 1) return;

    // Optional: Prevent starting with multiple zeros like 000123
    const cleanedVal = val.replace(/^0+(\d)/, '$1');

    handleDurationChange(index, 'security_deposit', cleanedVal);
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
  <button type="button" className="btn btn-outline-primary btn-sm" onClick={addDuration}>
    Add Duration
  </button>
</div>


                  {/* Status dropdown with limited width */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label className="col-form-label" htmlFor="statusSelect">Status</label>
                      <select
                        id="statusSelect"
                        className="form-control"
                        style={{ maxWidth: '200px' }}
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        required
                      >
                        <option value="true">Active</option>
                        <option value="false">Deactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Error Message */}
                  {errorMessage && <div className="text-danger mt-3">{errorMessage}</div>}

                  {/* Submit Button */}
                  <div className="mt-4">
                    <ReusableButton type="submit" loading={loading} disabled={!isModified}>
                      Update
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

export default EditProducts;
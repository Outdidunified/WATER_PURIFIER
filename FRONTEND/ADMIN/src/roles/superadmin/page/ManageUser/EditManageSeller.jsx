// EditManageSeller
import React from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';
import useEditManageSellers from '../../hooks/ManageUser/EditManageSellersHooks';

const EditManageSeller = ({ userInfo, handleLogout }) => {
  const {
    editManageSeller,
    handleStatusChange,
    isModified,
    name,
    email,
    password, setPassword,
    phone, setPhone,
    addressline1, setAddressline1,
    addressline2, setAddressline2,
    city, setCity,
    district, setDistrict,
    state, setStateVal,
    country, setCountry,
    pincode, setPincode,
    errorMessage,
    selectStatus,
    isloading: loading,
    backManageSeller,
  } = useEditManageSellers(userInfo);

  return (
    <div className='container-scroller'>
      {/* Header */}
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        {/* Sidebar */}
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="row">
              <div className="col-md-12 grid-margin">
                <div className="row">
                  <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                    <h3 className="font-weight-bold">Edit Seller</h3>
                  </div>
                  <div className="col-12 col-xl-4">
                    <div className="justify-content-end d-flex">
                      <button type="button" className="btn btn-success" onClick={backManageSeller}>Back</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    <div className="col-12 grid-margin">
                      <div className="card">
                        <div className="card-body">
                          <h4 className="card-title">Manage Seller</h4>
                          <form className="form-sample" onSubmit={editManageSeller}>
                            <div className="row">
                              {/* Name (Read-only) */}
                              <div className="col-md-6">
                                <div className="form-group row">
                                  <label className="col-sm-12 col-form-label labelInput">Name</label>
                                  <div className="col-sm-12">
                                    <InputField value={name} maxLength={50} readOnly required />
                                  </div>
                                </div>
                              </div>

                              {/* Email (Read-only) */}
                              <div className="col-md-6">
                                <div className="form-group row">
                                  <label className="col-sm-12 col-form-label labelInput">Email</label>
                                  <div className="col-sm-12">
                                    <InputField type="email" value={email} readOnly maxLength={50} required />
                                  </div>
                                </div>
                              </div>

                              {/* Phone Number */}
                              <div className="col-md-6">
                                <div className="form-group row">
                                  <label className="col-sm-12 col-form-label labelInput">Phone Number</label>
                                  <div className="col-sm-12">
                                    <InputField
                                      value={phone}
                                      maxLength={10}
                                      pattern="[1-9][0-9]{9}"
                                      title="Phone number must be 10 digits and should not start with 0"
                                      onChange={(e) => {
                                        let value = e.target.value.replace(/[^0-9]/g, '');
                                        if (value.length === 1 && value === '0') {
                                          return;
                                        }
                                        setPhone(value);
                                      }}
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Password */}
                              <div className="col-md-6">
                                <div className="form-group row">
                                  <label className="col-sm-12 col-form-label labelInput">Password (4-digit)</label>
                                  <div className="col-sm-12">
                                    <InputField
                                      type="text"
                                      value={password}
                                      maxLength={4}
                                      pattern="\d{4}"
                                      title="Password must be exactly 4 digits"
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        setPassword(value);
                                      }}
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Address Line 1 */}
                              <div className="col-md-6">
                                <div className="form-group row">
                                  <label className="col-sm-12 col-form-label labelInput">Address Line 1</label>
                                  <div className="col-sm-12">
                                    <InputField value={addressline1} maxLength={100} onChange={(e) => setAddressline1(e.target.value)} required />
                                  </div>
                                </div>
                              </div>

                              {/* Address Line 2 (optional) */}
                              <div className="col-md-6">
                                <div className="form-group row">
                                  <label className="col-sm-12 col-form-label labelInput">Address Line 2</label>
                                  <div className="col-sm-12">
                                    <InputField value={addressline2} maxLength={100} onChange={(e) => setAddressline2(e.target.value)} />
                                  </div>
                                </div>
                              </div>

                              {/* City */}
                              <div className="col-md-6">
                                <div className="form-group row">
                                  <label className="col-sm-12 col-form-label labelInput">City</label>
                                  <div className="col-sm-12">
                                    <InputField
                                      value={city}
                                      maxLength={50}
                                      pattern="^[a-zA-Z ]{2,}$"
                                      title="City name should contain at least 2 letters and only alphabets"
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                                        setCity(value);
                                      }}
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* District */}
                              <div className="col-md-6">
                                <div className="form-group row">
                                  <label className="col-sm-12 col-form-label labelInput">District</label>
                                  <div className="col-sm-12">
                                    <InputField
                                      value={district}
                                      maxLength={50}
                                      pattern="^[a-zA-Z ]{2,}$"
                                      title="District name should contain at least 2 letters and only alphabets"
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                                        setDistrict(value);
                                      }}
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* State */}
                              <div className="col-md-6">
                                <div className="form-group row">
                                  <label className="col-sm-12 col-form-label labelInput">State</label>
                                  <div className="col-sm-12">
                                    <InputField
                                      value={state}
                                      maxLength={50}
                                      pattern="^[a-zA-Z ]{2,}$"
                                      title="State name should contain at least 2 letters and only alphabets"
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                                        setStateVal(value);
                                      }}
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Country */}
                              <div className="col-md-6">
                                <div className="form-group row">
                                  <label className="col-sm-12 col-form-label labelInput">Country</label>
                                  <div className="col-sm-12">
                                    <InputField
                                      value={country}
                                      maxLength={50}
                                      pattern="^[a-zA-Z ]{2,}$"
                                      title="Country name should contain at least 2 letters and only alphabets"
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^a-zA-Z ]/g, '');
                                        setCountry(value);
                                      }}
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Pincode */}
                              <div className="col-md-6">
                                <div className="form-group row">
                                  <label className="col-sm-12 col-form-label labelInput">Pincode</label>
                                  <div className="col-sm-12">
                                    <InputField
                                      value={pincode}
                                      maxLength={6}
                                      pattern="^[1-9][0-9]{5}$"
                                      title="Pincode must be 6 digits and not start with 0"
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        setPincode(value);
                                      }}
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Status */}
                              <div className="col-md-6">
                                <div className="form-group row">
                                  <label className="col-sm-12 col-form-label labelInput">Status</label>
                                  <div className="col-sm-12">
                                    <select
                                      className="form-control"
                                      value={selectStatus}
                                      onChange={handleStatusChange}
                                      required
                                    >
                                      <option value="true">Active</option>
                                      <option value="false">Inactive</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {errorMessage && <div className="text-danger">{errorMessage}</div>}<br />

                            <ReusableButton type="submit" disabled={loading || !isModified} loading={loading}>
                              Update
                            </ReusableButton>
                          </form>

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default EditManageSeller;
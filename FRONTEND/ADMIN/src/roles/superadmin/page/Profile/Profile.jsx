//Profile
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import useProfile from '../../hooks/Profile/ProfileHooks';
import ReusableButton from '../../../../utils/ReusableButton';
import InputField from '../../../../utils/InputField';

const Profile = ({ userInfo, handleLogout }) => {
  const {
  name, setName,
  email, phone, setPhone,
  password, setPassword,
  errorMessage, userModified,
  loading, ProfileUpdate
} = useProfile(userInfo);


  return (
    <div className='container-scroller'>
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper content-center">
            <div className="mb-4 text-left">
              <h3 className="font-weight-bold">Profile</h3>
            </div>

               <div className="card p-4 profile-card-compact">
        <form onSubmit={ProfileUpdate}>
  {/* User Name */}
  <div className="form-section">
    <label className="input-label">User Name</label>
    <InputField
      placeholder="Username"
      value={name}
      maxLength={25}
      onChange={(e) => {
        const value = e.target.value;
        const sanitizedValue = value.replace(/[^a-zA-Z0-9 ]/g, '');
        setName(sanitizedValue);
      }}
      readOnly
      required
    />
  </div>

  {/* Email */}
  <div className="form-section">
    <label className="input-label">Email</label>
    <InputField
      type="email"
      placeholder="Email"
      value={email}
      readOnly
      required
    />
  </div>

  {/* Phone Number */}
  <div className="form-section">
  <label className="input-label">Phone</label>
  <InputField
    type="text"
    placeholder="Phone number"
    value={phone}
    maxLength={10}
    onChange={(e) => {
      let value = e.target.value.replace(/[^0-9]/g, ''); // Allow only numbers
      if (value.length === 1 && value === '0') return; // Prevent if first digit is 0
      if (value.length <= 10) setPhone(value); // Limit to 10 digits
    }}
    required
  />
</div>


  {/* Password */}
  <div className="form-section">
    <label className="input-label">Password</label>
    <InputField
      type="text"
      placeholder="4-digit Password"
      value={password}
      maxLength={4}
      onChange={(e) => {
        const value = e.target.value;
        const sanitizedValue = value.replace(/[^0-9]/g, '');
        if (sanitizedValue.length <= 4) {
          setPassword(sanitizedValue);
        }
      }}
      required
    />
    {password.length > 0 && password.length < 4 && (
      <small className="text-danger">Password must be 4 digits</small>
    )}
  </div>

  {/* Error Message */}
  {errorMessage && <div className="text-danger mb-3">{errorMessage}</div>}

  {/* Submit Button */}
  <ReusableButton
    type="submit"
    loading={loading}
    disabled={loading || !userModified || phone.length !== 10 || password.length !== 4}
  >
    Update
  </ReusableButton>
</form>

            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Profile;

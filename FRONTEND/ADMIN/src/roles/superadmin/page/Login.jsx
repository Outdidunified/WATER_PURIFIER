//login
import React from 'react';
import { useSuperAdminLogin } from '../hooks/login/SuperadminloginHooks';
import ReusableButton from '../../../utils/ReusableButton';

const Login = ({ handleLogin }) => {
  const {
    email,
    passwords,
    errorMessage,
    successMessage,
    setEmail,
    setPassword,
    handleLoginFormSubmit,
    loading,
  } = useSuperAdminLogin(handleLogin);

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Sign in to your super admin dashboard</p>

        <form onSubmit={handleLoginFormSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, '');
                const validChars = value.replace(/[^a-zA-Z0-9@.]/g, '');
                const lowerCaseEmail = validChars.toLowerCase();
                const atCount = (lowerCaseEmail.match(/@/g) || []).length;
                const sanitizedEmail = atCount <= 1 ? lowerCaseEmail : lowerCaseEmail.replace(/@.*@/, '@');
                setEmail(sanitizedEmail);
              }}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="4-digit password"
              value={passwords}
              maxLength={4}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setPassword(value);
              }}
              required
            />
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}

          <ReusableButton
            type="submit"
            loading={loading}
            className="btn btn-login"
          >
            SIGN IN
          </ReusableButton>
        </form>
      </div>
    </div>
  );
};

export default Login;

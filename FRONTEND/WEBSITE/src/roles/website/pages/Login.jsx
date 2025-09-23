import React from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import useLogin from "../hooks/useLogin";
const Login = ({ userInfo, handleLogout, token, handleLogin }) => {
    const { step, setStep, phone, setPhone, otp, setOtp, name, setName, emailID, setEmailID, city, setCity, password, setPassword, loading,
        loadingVotp, loadingReg, loginType, setLoginType, handleEmailLogin, handleSendOtp, handleVerifyOtp, handleRegister, commonInputStyle,
    } = useLogin(handleLogin);

    const indianCities = [
        "Bangalore", "Hyderabad", "Mumbai", "Delhi", "Chennai", "Kolkata", "Pune",
        "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore",
        "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad"
    ];

    // Email validation
    const sanitizeEmail = (value) => {
        // Remove spaces and keep only valid characters for an email
        const noSpaces = value.replace(/\s/g, "");
        const validChars = noSpaces.replace(/[^a-zA-Z0-9@.]/g, ""); // Allow letters, digits, @, ., _, and -

        // Convert to lowercase
        const lowerCaseEmail = validChars.toLowerCase();

        // Handle multiple @ symbols by keeping only the first part of the email
        const atIndex = lowerCaseEmail.indexOf("@");
        if (atIndex !== -1) {
            const firstPart = lowerCaseEmail.slice(0, atIndex + 1); // Include first '@'
            const domainPart = lowerCaseEmail.slice(atIndex + 1).replace(/@/g, ""); // Remove additional '@'
            const sanitizedEmail = `${firstPart}${domainPart}`;

            // Limit the email address to 50 characters
            return sanitizedEmail.slice(0, 50);
        }

        // No @ symbol: Limit to 50 characters and return
        return lowerCaseEmail.slice(0, 50);
    };

    return (
        <div>
            <Header userInfo={userInfo} handleLogout={handleLogout} />

            <main className="main">
                <section id="hero" className="hero section">
                    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                        {/* LOGIN */}
                        {step === "login" && (
                            <div>
                                <img alt="img" src="assets/img/login.png" style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '10px', marginBottom: '0.5rem', }} />
                                <h2 style={{ textAlign: 'center' }}>Login</h2>

                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                    <button onClick={() => setLoginType("email")} style={{ marginRight: '10px', padding: '8px 16px', background: loginType === "email" ? '#007bff' : '#ccc', color: '#fff', border: 'none', borderRadius: '5px' }}>
                                        Email Login
                                    </button>
                                    {/* <button onClick={() => setLoginType("phone")} style={{ padding: '8px 16px', background: loginType === "phone" ? '#007bff' : '#ccc', color: '#fff', border: 'none', borderRadius: '5px' }}>
                                        Phone Login
                                    </button> */}
                                </div>

                                {/* Phone Login */}
                                {loginType === "phone" && (
                                    <>
                                        <input
                                            type="tel"
                                            placeholder="Phone Number"
                                            style={commonInputStyle}
                                            value={phone}
                                            minLength={10}
                                            maxLength={10}
                                            onChange={(e) => {
                                                let val = e.target.value.replace(/\D/g, "");
                                                if (val.length === 1 && !/[6-9]/.test(val)) val = "";
                                                setPhone(val.slice(0, 10));
                                            }}
                                            required
                                        />
                                        <button
                                            onClick={handleSendOtp}
                                            disabled={loading}
                                            style={{ ...commonInputStyle, background: '#007bff', color: '#fff', opacity: loading ? 0.7 : 1 }}
                                        >
                                            {loading ? "Sending..." : "Send OTP"}
                                        </button>
                                    </>
                                )}

                                {/* Email Login */}
                                {loginType === "email" && (
                                    <>
                                        <input
                                            type="email"
                                            placeholder="Enter Email"
                                            style={commonInputStyle}
                                            value={emailID}
                                            onChange={(e) => setEmailID(sanitizeEmail(e.target.value))}
                                            required
                                        />
                                        <input
                                            type="password"
                                            placeholder="4 Digit Password"
                                            style={commonInputStyle}
                                            value={password}
                                            minLength={4}
                                            maxLength={4}
                                            onChange={(e) => {
                                                let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                                                if (val.length === 1 && val === "0") val = "";
                                                setPassword(val);
                                            }}
                                            required
                                        />
                                        <button
                                            onClick={handleEmailLogin}
                                            disabled={loading}
                                            style={{ ...commonInputStyle, background: '#007bff', color: '#fff', opacity: loading ? 0.7 : 1 }}
                                        >
                                            {loading ? "Logging in..." : "Login"}
                                        </button>
                                    </>
                                )}

                                <p style={{ textAlign: 'center' }}>
                                    New user? <button onClick={() => {
                                        setName('');
                                        setEmailID('');
                                        setPhone('');
                                        setPassword('');
                                        setCity('Bangalore');
                                        setStep("register");
                                    }} style={{ color: '#007bff', background: 'none', border: 'none' }}>Register here</button>

                                </p>
                            </div>

                        )}

                        {/* OTP VERIFICATION */}
                        {step === "otp" && (
                            <div>
                                <img alt="img" src="assets/img/Votp.png" style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '10px', marginBottom: '0.5rem', }} />
                                <h2 style={{ textAlign: 'center' }}>OTP Verification</h2>
                                <input
                                    type="text"
                                    placeholder="Enter OTP"
                                    style={commonInputStyle}
                                    minLength={6}
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={loadingVotp}
                                    style={{ ...commonInputStyle, background: '#28a745', color: '#fff', opacity: loadingVotp ? 0.7 : 1 }}
                                >
                                    {loadingVotp ? "Verifying..." : "Verify & Login"}
                                </button>
                                {/* <p style={{ textAlign: 'center' }}>
                                    Back to <button onClick={() => setStep("login")} style={{ color: '#007bff', background: 'none', border: 'none' }}>Login</button>
                                </p> */}
                            </div>
                        )}

                        {/* REGISTER */}
                        {step === "register" && (
                            <div>
                                <h2 style={{ textAlign: 'center' }}>Register</h2>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    style={commonInputStyle}
                                    value={name}
                                    // onChange={(e) => setName(e.target.value)}
                                    onChange={(e) => {
                                        if (/^[a-zA-Z\s]*$/.test(e.target.value)) setName(e.target.value);
                                    }}
                                    required
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    style={commonInputStyle}
                                    value={phone}
                                    minLength={10}
                                    maxLength={10}
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, "");
                                        if (val.length === 1 && !/[6-9]/.test(val)) val = "";
                                        setPhone(val.slice(0, 10));
                                    }}
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Enter Email"
                                    style={commonInputStyle}
                                    value={emailID}
                                    onChange={(e) => setEmailID(sanitizeEmail(e.target.value))}
                                />
                                <select
                                    style={commonInputStyle}
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                >
                                    {indianCities.map((cityName) => (
                                        <option key={cityName} value={cityName}>
                                            {cityName}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="password"
                                    placeholder="4 Digit Password"
                                    style={commonInputStyle}
                                    value={password}
                                    minLength={4}
                                    maxLength={4}
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                                        if (val.length === 1 && val === "0") val = "";
                                        setPassword(val);
                                    }}
                                    required
                                />
                                <button
                                    onClick={handleRegister}
                                    disabled={loadingReg}
                                    style={{ ...commonInputStyle, background: '#0d83fd', color: 'white', opacity: loadingReg ? 0.7 : 1 }}
                                >
                                    {loadingReg ? "Registering..." : "Register"}
                                </button>
                                <p style={{ textAlign: 'center' }}>
                                    Already have an account? <button onClick={() => {
                                        setName('');
                                        setEmailID('');
                                        setPhone('');
                                        setPassword('');
                                        setCity('Bangalore');
                                        setStep("login");
                                    }} style={{ color: '#007bff', background: 'none', border: 'none' }}>Login</button>

                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default Login;

import React, { useState, useEffect } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import useLogin from "../hooks/useLogin";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";

const Login = ({ userInfo, handleLogout, token, handleLogin }) => {

    const navigate = useNavigate();

    // If user already logged in → block access to /auth
    useEffect(() => {
        if (token) {
            navigate("/", { replace: true }); // remove /auth from history
        }
    }, [token]);

    const { step, setStep, phone, setPhone, otp, setOtp, name, setName, password, setPassword, emailID, setEmailID, city, setCity,
        district, setDistrict, state, setState, pincode, setPincode, country, setCountry,
        addressLine1, setAddressLine1, addressLine2, setAddressLine2,
        loading, loadingVotp, loadingReg, loginType, setLoginType,
        countryList, stateList, cityList, districtList,
        handleEmailLogin, handleSendOtp, handleVerifyOtp, handleRegister,
        commonInputStyle
    } = useLogin(handleLogin);

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

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleEmailLogin();
        }
    };

    return (
        <div>
            <Header userInfo={userInfo} handleLogout={handleLogout} />

            <main className="main">
                <section id="hero" className="hero section">
                    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                        {/* LOGIN */}
                        {step === "login" && (
                            <div>
                                <img alt="img" src="assets/img/login.png" style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '10px', marginBottom: '0.5rem', }} />
                                <h2 style={{ textAlign: 'center' }}>Login</h2>

                                {/* <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                    <button onClick={() => setLoginType("email")} style={{ marginRight: '10px', padding: '8px 16px', background: loginType === "email" ? '#007bff' : '#ccc', color: '#fff', border: 'none', borderRadius: '5px' }}>
                                        Email Login
                                    </button>
                                </div> */}

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
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "100%",
                                        }}
                                    >
                                        {/* Email Input — 60% width */}
                                        <input
                                            type="email"
                                            placeholder="Enter Email"
                                            style={{
                                                ...commonInputStyle,
                                                width: "60%",
                                            }}
                                            value={emailID}
                                            onChange={(e) => setEmailID(sanitizeEmail(e.target.value))}
                                            required
                                        />

                                        {/* Password + Eye — 60% width */}
                                        <div style={{
                                            position: 'relative',
                                            width: "60%"
                                        }}>
                                            <input
                                                type={isPasswordVisible ? "text" : "password"}
                                                placeholder="4 Digit Password"
                                                style={{
                                                    ...commonInputStyle,
                                                    paddingRight: '40px',
                                                    width: "100%",
                                                }}
                                                value={password}
                                                onKeyDown={handleKeyPress}
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
                                                type="button"
                                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                                style={{
                                                    position: "absolute",
                                                    right: "10px",
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                {isPasswordVisible ? (
                                                    <FaEyeSlash style={{ color: "#007bff" }} />
                                                ) : (
                                                    <FaEye style={{ color: "#007bff" }} />
                                                )}
                                            </button>
                                        </div>

                                        {/* Login Button — 30% width */}
                                        <button
                                            onClick={handleEmailLogin}
                                            disabled={loading}
                                            style={{
                                                ...commonInputStyle,
                                                width: "30%",
                                                background: '#007bff',
                                                color: '#fff',
                                                opacity: loading ? 0.7 : 1,
                                                textAlign: "center",
                                            }}
                                        >
                                            {loading ? "Logging in..." : "Login"}
                                        </button>
                                    </div>
                                )}

                                <p style={{ textAlign: 'center' }}>
                                    New user? <button onClick={() => {
                                        setName('');
                                        setPhone('');
                                        setEmailID('');
                                        setCity('');
                                        setDistrict('');
                                        setState('');
                                        setCountry('IN');
                                        setAddressLine1('');
                                        setAddressLine2('');
                                        setPincode('');
                                        setPassword('');
                                        setStep("register");
                                    }} style={{ color: '#007bff', background: 'none', border: 'none' }}>Register here</button>

                                </p>
                            </div>

                        )}

                        {/* REGISTER */}
                        {step === "register" && (
                            <div>
                                <h2 style={{ textAlign: 'center' }}>Register</h2>

                                {/* Row 1: Name + Phone */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        style={{ ...commonInputStyle, flex: 1 }}
                                        value={name}
                                        onChange={(e) => /^[a-zA-Z\s]*$/.test(e.target.value) && setName(e.target.value)}
                                        required
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone Number"
                                        style={{ ...commonInputStyle, flex: 1 }}
                                        value={phone}
                                        maxLength={10}
                                        onChange={(e) => {
                                            let val = e.target.value.replace(/\D/g, "");
                                            if (val.length === 1 && !/[6-9]/.test(val)) val = "";
                                            setPhone(val.slice(0, 10));
                                        }}
                                        required
                                    />
                                </div>

                                {/* Row 2: Email + Password */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        style={{ ...commonInputStyle, flex: 1 }}
                                        value={emailID}
                                        onChange={(e) => setEmailID(e.target.value)}
                                        required
                                    />
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={isPasswordVisible ? "text" : "password"}
                                            placeholder="4 Digit Password"
                                            style={{ ...commonInputStyle, flex: 1 }}
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

                                        {/* Eye icon to toggle password visibility */}
                                        <button
                                            type="button"
                                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                            style={{
                                                position: "absolute",
                                                right: "10px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {isPasswordVisible ? (
                                                <FaEyeSlash style={{ color: "#007bff" }} />
                                            ) : (
                                                <FaEye style={{ color: "#007bff" }} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder="Address"
                                        style={{ ...commonInputStyle, flex: 1 }}
                                        value={addressLine1}
                                        onChange={(e) => setAddressLine1(e.target.value)} required
                                    />
                                    <input type="text"
                                        placeholder="Address optional"
                                        style={{ ...commonInputStyle, flex: 1 }}
                                        value={addressLine2}
                                        onChange={(e) => setAddressLine2(e.target.value)}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select style={{ ...commonInputStyle, flex: 1 }} value={country} onChange={(e) => setCountry(e.target.value)} required>
                                        {countryList.map((c) => (
                                            <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                                        ))}
                                    </select>
                                    <select style={{ ...commonInputStyle, flex: 1 }} value={state} onChange={(e) => setState(e.target.value)} required>
                                        {stateList.map((s) => (
                                            <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>


                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select
                                        style={{ ...commonInputStyle, flex: 1 }}
                                        value={district}
                                        onChange={(e) => setDistrict(e.target.value)} required
                                    >
                                        <option value="">Select District</option>
                                        {districtList.map((d, idx) => (
                                            <option key={idx} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    <select
                                        style={{ ...commonInputStyle, flex: 1 }}
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)} required
                                    >
                                        <option value="">Select City</option>
                                        {cityList.map((c) => (
                                            <option key={c.name} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Pincode"
                                        style={{ ...commonInputStyle, flex: 1 }}
                                        value={pincode}
                                        maxLength={6}
                                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))} required
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}></div>

                                <button
                                    onClick={handleRegister}
                                    disabled={loadingReg}
                                    style={{ ...commonInputStyle, background: '#0d83fd', color: 'white', opacity: loadingReg ? 0.7 : 1 }}
                                >
                                    {loadingReg ? "Registering..." : "Register"}
                                </button>
                                <p style={{ textAlign: 'center' }}>
                                    Already registered?  <button onClick={() => {
                                        setStep("login");
                                    }} style={{ color: '#007bff', background: 'none', border: 'none' }}>Login here</button>
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

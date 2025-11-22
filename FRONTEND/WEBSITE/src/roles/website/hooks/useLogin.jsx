import { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { Country, State, City } from "country-state-city";
// use the named helper from the package
import { getDistricts } from "india-state-district";

const useLogin = (handleLogin) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [step, setStep] = useState("login"); // login, otp, register
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [emailID, setEmailID] = useState("");
    const [city, setCity] = useState("");
    const [district, setDistrict] = useState("");
    const [state, setState] = useState("");
    const [pincode, setPincode] = useState("");
    const [country, setCountry] = useState("IN"); // ISO code
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");

    const [loading, setLoading] = useState(false);
    const [loadingVotp, setLoadingVotp] = useState(false);
    const [loadingReg, setLoadingReg] = useState(false);
    const [loginType, setLoginType] = useState("email");

    const [countryList, setCountryList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [cityList, setCityList] = useState([]);
    const [districtList, setDistrictList] = useState([]);

    const commonInputStyle = {
        padding: '12px',
        margin: '8px 0',
        width: '100%',
        fontSize: '16px',
        border: '1px solid #ccc',
        borderRadius: '8px'
    };

    // Load countries once
    useEffect(() => {
        setCountryList(Country.getAllCountries() || []);
    }, []);

    // Load states when country changes
    useEffect(() => {
        if (country) {
            setStateList(State.getStatesOfCountry(country) || []);
        } else {
            setStateList([]);
        }
        // reset dependent selects
        setState("");
        setCity("");
        setCityList([]);
        setDistrictList([]);
        setDistrict("");
    }, [country]);

    // When state changes: load cities (country-state-city) and districts (india-state-district)
    useEffect(() => {
        if (!state) {
            setCityList([]);
            setDistrictList([]);
            setCity("");
            setDistrict("");
            return;
        }

        // cities from country-state-city
        const cities = City.getCitiesOfState(country, state) || [];
        setCityList(cities);

        // districts using india-state-district helper
        try {
            const rawDistricts = getDistricts(state); // expect state isoCode like "TN", "KA", "MH"
            // normalize result: package might return array of strings OR array of {name, code}
            let normalized = [];
            if (Array.isArray(rawDistricts)) {
                if (rawDistricts.length === 0) normalized = [];
                else if (typeof rawDistricts[0] === "string") normalized = rawDistricts;
                else normalized = rawDistricts.map((d) => d.name || d);
            }
            setDistrictList(normalized);
        } catch (err) {
            // safe fallback - empty list
            console.error("getDistricts error:", err);
            setDistrictList([]);
        }

        // reset lower-level selections
        setCity("");
        setDistrict("");
    }, [state, country]);

    const validateEmail = (email) => {
        // Check for exactly one @ symbol and a basic Gmail pattern
        const atCount = (email.match(/@/g) || []).length;
        if (atCount !== 1) return false;

        // Validate Gmail pattern (letters, digits, ._%+- before @, domain with .com)
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[cC][oO][mM]$/.test(email);
    };

    const handleEmailLogin = async () => {
        if (!validateEmail(emailID)) {
            Swal.fire('Error', 'Enter a valid Gmail address', 'error');
            return;
        }
        if (!/^[0-9]{4}$/.test(password)) {
            Swal.fire('Error', 'Password must be 4 digits', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/website/auth/email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailID, password: parseInt(password), role_id: 3 }),
            });
            const data = await res.json();

            if (res.status === 200 && data.status.toLowerCase() === "success") {
                Swal.fire({
                    title: "Success",
                    text: data.message,
                    icon: "success",
                    timer: 1000,              // Auto close after 7 seconds
                    timerProgressBar: true,   // Optional progress bar
                });
                handleLogin(data);
                resetFields();
            } else {
                Swal.fire("Error", data.message || "Login failed", "error");
            }
        } catch (err) {
            Swal.fire("Error", "Server error", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (!/^[6-9][0-9]{9}$/.test(phone)) {
            Swal.fire('Error', 'Enter a valid 10-digit phone number', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone })
            });
            const data = await res.json();
            if (res.ok) {
                Swal.fire('Success', data.message || 'OTP sent', 'success');
                setStep("otp");
            } else {
                Swal.fire('Error', data.message || 'Login failed', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Server error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setLoadingVotp(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/website/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailID, otp, role_id: 3 })
            });
            const data = await res.json();
            if (res.ok && !data.error) {
                handleLogin({ user: data.data, token: data.token });
                Swal.fire('Success', data.message || 'OTP verified', 'success');
                resetFields();
            } else {
                Swal.fire('Error', data.message || 'Invalid OTP', 'error');
            }
        } catch {
            Swal.fire('Error', 'Verification failed', 'error');
        } finally {
            setLoadingVotp(false);
        }
    };

    const handleRegister = async () => {
        if (!name || !phone || !emailID || !city || !/^[0-9]{4}$/.test(password)) {
            Swal.fire('Error', 'Please fill all required fields', 'error');
            return;
        }
        // Validate email for multiple @ symbols
        if (!validateEmail(emailID)) {
            Swal.fire("Error", "Enter a valid Gmail address with exactly one @ symbol", "error");
            return;
        }

        setLoadingReg(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/website/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role_id: 3,
                    name, phone: parseInt(phone), email: emailID, city,
                    password: parseInt(password), createdby: emailID,
                    addressline1: addressLine1, addressline2: addressLine2,
                    district, state, pincode, country
                }),
            });
            const data = await res.json();
            if (res.ok && !data.error) {
                Swal.fire({
                    title: "Success",
                    text: data.message || 'Registered successfully',
                    icon: "success",
                    timer: 1000,              
                    timerProgressBar: true,  
                });
               // Swal.fire('Success', data.message || 'Registered successfully', 'success');
                setStep("login");   // go back to login screen
                // setStep("otp");
                resetFields();
            } else {
                Swal.fire('Error', data.message || 'Registration failed', 'error');
            }
        } catch {
            Swal.fire('Error', 'Server error', 'error');
        } finally {
            setLoadingReg(false);
        }
    };

    const resetFields = () => {
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
    };

    return {
        step, setStep, phone, setPhone, otp, setOtp, name, setName, password, setPassword, emailID, setEmailID, city, setCity,
        district, setDistrict, state, setState, pincode, setPincode, country, setCountry,
        addressLine1, setAddressLine1, addressLine2, setAddressLine2,
        loading, loadingVotp, loadingReg, loginType, setLoginType,
        countryList, stateList, cityList, districtList,
        handleEmailLogin, handleSendOtp, handleVerifyOtp, handleRegister,
        commonInputStyle
    };
};

export default useLogin;

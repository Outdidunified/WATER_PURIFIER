import { useState } from "react";
import Swal from 'sweetalert2';
const useLogin = () => {

    const [step, setStep] = useState("login"); // login, otp, register
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [name, setName] = useState("");
    const [emailID, setEmailID] = useState("");
    const [city, setCity] = useState("Bangalore");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingVotp, setLoadingVotp] = useState(false);
    const [loadingReg, setLoadingReg] = useState(false);
    const [loginType, setLoginType] = useState("phone"); // "phone" or "email"

    const handleEmailLogin = async () => {
        if (!emailID || !password || !/^[0-9]{6}$/.test(password)) {
            Swal.fire('Error', 'Enter valid email and 6-digit password.', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("http://192.168.1.14:5000/api/auth/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailID, password }),
            });
            const data = await res.json(); // Fix this line
            if (res.status === 200 && data.status === 'Success') {
                handleLogin(data);
                Swal.fire('Success', data.message || 'Login successful.', 'success');
                setTimeout(() => window.location.href = "/", 2000);
            } else {
                Swal.fire('Error', data.message || 'Login failed.', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Server error. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (!/^[1-9][0-9]{9}$/.test(phone)) {
            Swal.fire('Error', 'Enter a valid 10-digit phone number.', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone })
            });
            const data = await res.json();
            if (res.ok) {
                Swal.fire('Success', data.message || 'OTP sent to your phone.', 'success');
                setStep("otp");
            } else {
                Swal.fire('Error', data.message || 'Login failed.', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Server error. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setLoadingVotp(true);
        try {
            const res = await fetch("http://192.168.1.14:5000/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, otp })
            });
            const data = await res.json(); // Fix this line
            if (res.status === 200 && data.status === 'Success') {
                handleLogin(data);
                Swal.fire('Success', 'OTP verified. Redirecting...', 'success');
                setTimeout(() => window.location.href = "/", 2000);
            } else {
                Swal.fire('Error', data.message || 'Invalid OTP.', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Verification failed.', 'error');
        } finally {
            setLoadingVotp(false);
        }
    };

    const handleRegister = async () => {
        if (!name || !emailID || !city || !password || !/^[0-9]{6}$/.test(password)) {
            Swal.fire('Error', 'Please fill all fields and ensure password is 6 digits.', 'error');
            return;
        }

        const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(emailID)) {
            Swal.fire('Error', 'Invalid email format.', 'error');
            return;
        }

        setLoadingReg(true);
        try {
            const res = await fetch("http://192.168.1.9:5000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone, emailID, city, password }),
            });
            const data = await res.json();
            if (res.ok) {
                Swal.fire('Success', data.message || 'Registered successfully. OTP sent.', 'success');
                setStep("otp");
            } else {
                Swal.fire('Error', data.message || 'Registration failed.', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Server error during registration.', 'error');
        } finally {
            setLoadingReg(false);
        }
    };

    const commonInputStyle = {
        padding: '12px',
        margin: '8px 0',
        width: '100%',
        fontSize: '16px',
        border: '1px solid #ccc',
        borderRadius: '8px'
    };
    return {
        step, setStep, phone, setPhone, otp, setOtp, name, setName, emailID, setEmailID, city, setCity, password, setPassword, loading,
        loadingVotp, loadingReg, loginType, setLoginType, handleEmailLogin, handleSendOtp, handleVerifyOtp, handleRegister, commonInputStyle,
    };
};
export default useLogin;
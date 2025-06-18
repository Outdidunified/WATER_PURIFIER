import { useState } from "react";
import Swal from 'sweetalert2';
const useLogin = (handleLogin) => {

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
    const [loginType, setLoginType] = useState("email"); // "phone" or "email"

    const validateEmail = (email) =>
        /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);

    // const validateEmail = (email) =>
    //     /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleEmailLogin = async () => {
        if (!validateEmail(emailID)) {
            Swal.fire('Error', 'Enter a valid Gmail address (e.g. user@gmail.com).', 'error');
            return;
        }

        if (!/^[0-9]{4}$/.test(password)) {
            Swal.fire('Error', 'Password must be a 4-digit number.', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/api/website/auth/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailID, password: parseInt(password) }),
            });

            const data = await res.json();

            if (res.status === 200 && data.status.toLowerCase() === "success") {
                Swal.fire("Success", data.message || "Login successful.", "success");
                // setTimeout(() => window.location.href = "/", 2000);
                handleLogin(data);

                // setTimeout(() => {
                //     handleLogin(data); // this will redirect
                // }, 1000);

                setName('');
                setEmailID('');
                setCity('');
                setPassword('');
                setPhone('');
            } else {
                Swal.fire("Error", data.message || "Login failed.", "error");
            }
        } catch (err) {
            Swal.fire("Error", "Server error. Please try again.", "error");
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
                setName('');
                setEmailID('');
                setCity('');
                setPassword('');
                setPhone('');
            } else {
                Swal.fire('Error', data.message || 'Login failed.', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Server error. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // const handleVerifyOtp = async () => {
    //     setLoadingVotp(true);
    //     try {
    //         const res = await fetch("/api/api/website/auth/verify-otp", {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify({ email: emailID, otp })
    //         });
    //         const data = await res.json(); // Fix this line
    //         if (res.status === 200 && data.status?.toLowerCase() === 'success') {
    //             handleLogin(data);
    //             Swal.fire('Success', data.message || 'OTP verified. Redirecting...', 'success');
    //             setTimeout(() => window.location.href = "/", 2000);
    //             setName('');
    //             setEmailID('');
    //             setCity('');
    //             setPassword('');
    //             setPhone('');
    //         } else {
    //             Swal.fire('Error', data.message || 'Invalid OTP.', 'error');
    //         }            
    //     } catch (err) {
    //         Swal.fire('Error', 'Verification failed.', 'error');
    //     } finally {
    //         setLoadingVotp(false);
    //     }
    // };

    const handleVerifyOtp = async () => {
        setLoadingVotp(true);
        try {
            const res = await fetch("/api/api/website/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailID, otp })
            });

            const responseData = await res.json();

            if (res.status === 200 && responseData.error === false) {
                const user = {
                    user_id: responseData.data.user_id,
                    email: responseData.data.email,
                    role_id: responseData.data.role_id,
                    is_subscribed: responseData.data.is_subscribed
                };

                const loginPayload = {
                    user,
                    token: responseData.token
                };

                handleLogin(loginPayload);

                Swal.fire('Success', responseData.message || 'OTP verified. Redirecting...', 'success');
                // setTimeout(() => window.location.href = "/", 2000);
                setName('');
                setEmailID('');
                setCity('');
                setPassword('');
                setPhone('');
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
        if (!name.trim()) {
            Swal.fire('Error', 'Name is required.', 'error');
            return;
        }

        if (!/^[1-9][0-9]{9}$/.test(phone)) {
            Swal.fire('Error', 'Enter a valid 10-digit phone number.', 'error');
            return;
        }

        if (!validateEmail(emailID)) {
            Swal.fire('Error', 'Enter a valid Gmail address (e.g. user@gmail.com).', 'error');
            return;
        }

        if (!city.trim()) {
            Swal.fire('Error', 'City is required.', 'error');
            return;
        }

        if (!/^[0-9]{4}$/.test(password)) {
            Swal.fire('Error', 'Password must be a 4-digit number.', 'error');
            return;
        }

        setLoadingReg(true);
        try {
            const res = await fetch("/api/api/website/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    phone: parseInt(phone),
                    email: emailID,
                    city,
                    password: parseInt(password)
                }),
            });

            const data = await res.json();

            if (res.ok && data.error === false) {
                Swal.fire('Success', data.message || 'Registered successfully. OTP sent.', 'success');
                setStep("otp");

                // Clear fields
                setName('');
                // setEmailID('');
                setCity('');
                setPassword('');
                setPhone('');
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
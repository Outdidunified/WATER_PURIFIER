import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Swal from "sweetalert2";
import { Country, State, City } from "country-state-city";
import { getDistricts } from "india-state-district";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Profile = ({ userInfo: propUserInfo, token: propToken, handleLogout }) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    const sessionUser = (() => {
        try {
            const s = sessionStorage.getItem("WebUser");
            return s ? JSON.parse(s) : null;
        } catch {
            return null;
        }
    })();

    const sessionToken = sessionStorage.getItem("WebToken");
    const userInfo = propUserInfo || sessionUser || { user_id: 189, email: "kesavand99@gmail.com", role_id: 1 };
    const authToken = propToken || sessionToken || null;

    const [formData, setFormData] = useState({
        user_id: null,
        name: "",
        email: "",
        phone: "",
        password: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        district: "",
        state: "",
        country: "IN",
        pincode: "",
    });

    const [countryList, setCountryList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [districtList, setDistrictList] = useState([]);
    const [cityList, setCityList] = useState([]);
    const [originalData, setOriginalData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [error, setError] = useState(null);
    const [isChanged, setIsChanged] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [updatedAt, setUpdatedAt] = useState(null);

    useEffect(() => {
        setCountryList(Country.getAllCountries());
    }, []);

    useEffect(() => {
        if (formData.country) {
            setStateList(State.getStatesOfCountry(formData.country));
        } else {
            setStateList([]);
        }
        setFormData(prev => ({
            ...prev,
            state: "",
            district: "",
            city: "",
        }));
    }, [formData.country]);

    useEffect(() => {
        if (formData.state) {
            const districts = getDistricts(formData.state);
            setDistrictList(districts);
            if (!districts.includes(formData.district)) {
                setFormData((prev) => ({
                    ...prev,
                    district: "",
                }));
            }
        } else {
            setDistrictList([]);
            setFormData((prev) => ({
                ...prev,
                district: "",
            }));
        }
    }, [formData.state]);

    useEffect(() => {
        if (formData.state && formData.district) {
            setCityList(City.getCitiesOfState(formData.country, formData.state));
        } else {
            setCityList([]);
        }
    }, [formData.state, formData.district]);

    const formatDateToIST = (dateString) => {
        if (!dateString || isNaN(new Date(dateString).getTime())) return "N/A";
        return new Date(dateString).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    useEffect(() => {
        let isMounted = true;

        const fetchUserDetails = async () => {
            if (!userInfo || !userInfo.user_id) {
                setLoadingProfile(false);
                return;
            }
            if (!authToken) {
                setError("Missing authentication token. Please login.");
                setLoadingProfile(false);
                return;
            }
            try {
                setLoadingProfile(true);
                const { data: response } = await axios.post(
                    `${API_BASE_URL}/api/app/settings/fetchuserdetails`,
                    {
                        user_id: userInfo.user_id,
                        email: userInfo.email,
                        role_id: userInfo.role_id,
                    },
                    {
                        headers: { Authorization: `Bearer ${authToken}` },
                    }
                );

                const user = response?.data;
                if (!user) {
                    throw new Error("No user data returned");
                }

                if (!isMounted) return;

                const mapped = {
                    user_id: user.user_id,
                    name: user.name || "",
                    email: user.email || "",
                    phone: user.phone ? user.phone.toString() : "",
                    password: user.password || "", // Use the integer password from API
                    addressLine1: user.addressline1 || "",
                    addressLine2: user.addressline2 || "",
                    city: user.city || "",
                    district: user.district || "",
                    state: user.state || "",
                    country: user.country || "IN",
                    pincode: user.pincode || "",
                };

                setFormData(mapped);
                setOriginalData(mapped);
                setUpdatedAt(user.updatedAt || user.createdDate || "2025-10-08T13:56:00Z"); // Current time: 01:56 PM IST
                setError(null);
            } catch (err) {
                console.error("Error fetching user details:", err);
                if (isMounted) {
                    setError("Failed to fetch user details");
                }
            } finally {
                if (isMounted) {
                    setLoadingProfile(false);
                }
            }
        };

        fetchUserDetails();

        return () => {
            isMounted = false;
        };
    }, [userInfo?.user_id, authToken]);

    useEffect(() => {
        if (!originalData) {
            setIsChanged(false);
            return;
        }
        const changed =
            formData.name !== originalData.name ||
            formData.phone !== originalData.phone ||
            formData.password !== originalData.password ||
            formData.addressLine1 !== originalData.addressLine1 ||
            formData.addressLine2 !== originalData.addressLine2 ||
            formData.city !== originalData.city ||
            formData.district !== originalData.district ||
            formData.state !== originalData.state ||
            formData.pincode !== originalData.pincode;
        // Additional check for password length
        const isValidPassword = formData.password === "" || (formData.password.toString().length === 4);
        setIsChanged(changed && isValidPassword);
    }, [formData, originalData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Convert password to integer if it's the password field and validate length
        let updatedValue = value;
        if (name === "password") {
            const numericValue = parseInt(value) || "";
            updatedValue = numericValue.toString().length <= 4 ? numericValue : formData.password;
        }
        setFormData((prev) => ({
            ...prev,
            [name]: updatedValue,
        }));
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!isChanged) {
            Swal.fire({
                icon: "info",
                title: "No changes detected",
                text: "You haven't changed anything to update or password length is invalid.",
                timer: 5000,
                timerProgressBar: true,
            });
            return;
        }

        if (!authToken) {
            Swal.fire({
                icon: "error",
                title: "Authentication Error",
                text: "Please login again.",
                timer: 5000,
                timerProgressBar: true,
            });
            return;
        }

        const payload = {
            user_id: userInfo.user_id,
            email: userInfo.email,
            role_id: userInfo.role_id,
            name: formData.name,
            phone: formData.phone,
            password: formData.password || undefined, // Send as integer or undefined
            addressline1: formData.addressLine1,
            addressline2: formData.addressLine2,
            city: formData.city,
            district: formData.district,
            state: formData.state,
            country: formData.country,
            pincode: formData.pincode,
        };

        try {
            const { data: resp } = await axios.post(
                `${API_BASE_URL}/api/app/settings/updateuserdetails`,
                payload,
                {
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );

            if (resp.error) {
                Swal.fire({
                    icon: "error",
                    title: "Update Failed",
                    text: resp.message || "Failed to update profile",
                    timer: 5000,
                    timerProgressBar: true,
                });
            } else {
                Swal.fire({
                    icon: "success",
                    title: "Profile Updated",
                    text: resp.message || "Profile updated successfully",
                    timer: 5000,
                    timerProgressBar: true,
                });
                setOriginalData({ ...formData, password: formData.password }); // Keep the new password
                setFormData((prev) => ({ ...prev, password: formData.password })); // Retain edited password
                setIsChanged(false);
                setUpdatedAt(resp.data?.updatedAt || new Date().toISOString());
            }
        } catch (err) {
            console.error("Error updating user:", err);
            Swal.fire({
                icon: "error",
                title: "Update Failed",
                text: "An unexpected error occurred. Please try again.",
                timer: 5000,
                timerProgressBar: true,
            });
        }
    };

    return (
        <div>
            <Header userInfo={userInfo} handleLogout={handleLogout} />

            <main className="main">
                <section id="hero" className="hero contact section light-background">
                    <div className="container section-title" data-aos="fade-up">
                        <h2>Profile</h2>
                        <p>Your account details</p>
                    </div>

                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row g-4 g-lg-5">
                            <div
                                className="col-lg-5"
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    minHeight: "200px",
                                }}
                            >
                                <div
                                    className="info-box text-center"
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        width: "100%",
                                    }}
                                >
                                    <img
                                        src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                                        alt="Profile Icon"
                                        width="100"
                                        className="mb-3"
                                        style={{ display: "block" }}
                                    />
                                </div>
                            </div>

                            <div className="col-lg-7">
                                <div
                                    className="contact-form"
                                    data-aos="fade-up"
                                    data-aos-delay="300"
                                >
                                    <h3>Edit Profile</h3>
                                    {loadingProfile && (
                                        <div style={{ textAlign: "center", marginBottom: "1rem", color: "#007bff" }}>
                                            <span className="spinner" /> Loading profile details...
                                        </div>
                                    )}
                                    <form onSubmit={handleUpdate}>
                                        <div className="row gy-4">
                                            <div className="col-md-6">
                                                <input
                                                    type="text"
                                                    name="name"
                                                    className="form-control"
                                                    placeholder="User Name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <input
                                                    type="email"
                                                    name="email"
                                                    className="form-control"
                                                    value={formData.email}
                                                    readOnly
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <input
                                                    type="text"
                                                    name="phone"
                                                    className="form-control"
                                                    value={formData.phone}
                                                    readOnly
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6 position-relative">
                                                <input
                                                    type={isPasswordVisible ? "text" : "password"}
                                                    name="password"
                                                    className="form-control"
                                                    placeholder="Password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    minLength={4}
                                                    maxLength={4}
                                                />
                                                <span
                                                    onClick={togglePasswordVisibility}
                                                    style={{
                                                        position: "absolute",
                                                        right: "20px",
                                                        top: "50%",
                                                        transform: "translateY(-50%)",
                                                        cursor: "pointer",
                                                        zIndex: 1,
                                                    }}
                                                >
                                                    {isPasswordVisible ? (
                                                        <FaEyeSlash style={{ color: "#007bff" }} />
                                                    ) : (
                                                        <FaEye style={{ color: "#007bff" }} />
                                                    )}
                                                </span>
                                            </div>
                                            <div className="col-md-6">
                                                <input
                                                    type="text"
                                                    name="addressLine1"
                                                    className="form-control"
                                                    placeholder="Address"
                                                    value={formData.addressLine1}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <input
                                                    type="text"
                                                    name="addressLine2"
                                                    className="form-control"
                                                    placeholder="Address optional"
                                                    value={formData.addressLine2}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <select
                                                    name="country"
                                                    className="form-control"
                                                    value={formData.country}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    {countryList.map((c) => (
                                                        <option key={c.isoCode} value={c.isoCode}>
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <select
                                                    name="state"
                                                    className="form-control"
                                                    value={formData.state}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <option value="">Select State</option>
                                                    {stateList.map((s) => (
                                                        <option key={s.isoCode} value={s.isoCode}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <select
                                                    name="district"
                                                    className="form-control"
                                                    value={formData.district}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <option value="">Select District</option>
                                                    {districtList.map((d) => (
                                                        <option key={d} value={d}>
                                                            {d}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <select
                                                    name="city"
                                                    className="form-control"
                                                    value={formData.city}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <option value="">Select City</option>
                                                    {cityList.map((c) => (
                                                        <option key={c.name} value={c.name}>
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <input
                                                    type="text"
                                                    name="pincode"
                                                    className="form-control"
                                                    placeholder="Pin Code"
                                                    value={formData.pincode}
                                                    onChange={handleChange}
                                                    maxLength={6}
                                                    required
                                                />
                                            </div>
                                            <div className="col-12 text-center">
                                                <button
                                                    type="submit"
                                                    className={isChanged ? "btn btn-primary" : "btn btn-secondary"}
                                                    disabled={!isChanged}
                                                >
                                                    Update Profile
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Profile;
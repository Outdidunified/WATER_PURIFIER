import { useState, useEffect, useRef } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import Swal from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Country, State, City } from "country-state-city";
import { getDistricts } from "india-state-district";

const Home = ({ userInfo, token, handleLogout }) => {
    const durationRef = useRef(null);
    const [hoveredQR, setHoveredQR] = useState(null);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const baseStyle = {
        width: "150px",
        borderRadius: "12px",
        boxShadow: "0px 5px 15px rgba(0,0,0,0.15)",
        transition: "all 0.3s ease",
    };

    const hoverStyle = {
        boxShadow: "0px 0px 10px 4px #0d83fd",
        transform: "scale(1.05)",
    };

    const getStyle = (key) => ({
        ...baseStyle,
        ...(hoveredQR === key ? hoverStyle : {}),
    });

    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [selectedModelIndex, setSelectedModelIndex] = useState(0);
    const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
    const [selectedDurationIndex, setSelectedDurationIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [emailID, setEmailID] = useState("");
    const [street, setStreet] = useState("");
    const [landmark, setLandmark] = useState("");
    const [pincode, setPincode] = useState("");
    const [city, setCity] = useState("");
    const [district, setDistrict] = useState("");
    const [state, setState] = useState("");
    const [country, setCountry] = useState("IN");

    const [countryList, setCountryList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [districtList, setDistrictList] = useState([]);
    const [cityList, setCityList] = useState([]);
    const [subLoading, setSubLoading] = useState(false);
    const [selectedPaymentType, setSelectedPaymentType] = useState("online");

    const RAZORPAY_KEY = "rzp_test_oHoZ3Q1fF6pYEI";

    // Fetch products
    useEffect(() => {
        let hasFetched = false;

        const fetchProducts = async () => {
            if (hasFetched) return; // Prevent duplicate calls in dev Strict Mode
            hasFetched = true;

            try {
                const response = await axios.get('/api/website/products/productswithplan');
                const productArray = response.data?.data || [];
                const filteredProducts = productArray.filter(p => p.status === true);
                setProducts(filteredProducts);
            } catch (err) {
                setError(err.message || 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);


    // Load countries
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
        setState("");
        setCity("");
        setCityList([]);
        setDistrictList([]);
        setDistrict("");
    }, [country]);

    // Load cities and districts when state changes
    useEffect(() => {
        if (!state) {
            setCityList([]);
            setDistrictList([]);
            setCity("");
            setDistrict("");
            return;
        }

        const cities = City.getCitiesOfState(country, state) || [];
        setCityList(cities);

        try {
            const rawDistricts = getDistricts(state);
            let normalized = [];
            if (Array.isArray(rawDistricts)) {
                if (rawDistricts.length === 0) normalized = [];
                else if (typeof rawDistricts[0] === "string") normalized = rawDistricts;
                else normalized = rawDistricts.map((d) => d.name || d);
            }
            setDistrictList(normalized);
        } catch (err) {
            console.error("getDistricts error:", err);
            setDistrictList([]);
        }

        setCity("");
        setDistrict("");
    }, [state, country]);

    // Calculate price details
    const calculatePriceDetails = () => {
        const selectedProduct = products[selectedModelIndex];
        const selectedPlan = selectedProduct?.plans[selectedPlanIndex];
        const selectedDuration = selectedProduct?.duration[selectedDurationIndex];

        if (!selectedProduct || !selectedPlan || !selectedDuration) return null;

        // Base values
        const basePrice = selectedPlan?.price || 0;
        const gstRate = selectedDuration?.gst || 0;
        const discountRate = selectedDuration?.discount || 0;

        // Duration
        const durationText = selectedDuration?.duration_time_limit || "28 days";
        const durationDays = parseInt(durationText.replace(/[^\d]/g, ""), 10) || 28;
        const baseDays = 28;

        // Step — Base total for duration
        const totalPrice = (basePrice / baseDays) * durationDays;

        // Step — GST
        const gstAmount = (totalPrice * gstRate) / 100;
        const priceWithGST = totalPrice + gstAmount;

        // Step — Discount
        const discountAmount = (priceWithGST * discountRate) / 100;
        const subtotal = priceWithGST - discountAmount;

        // Step — Security Deposit
        const securityDeposit = !userInfo?.security_deposit ? selectedDuration?.security_deposit || 0 : 0;

        // Step — Final total
        const grandTotal = subtotal + securityDeposit;

        // Step — Monthly equivalent (for display only)
        const finalMonthlyPrice = (subtotal / durationDays) * 28;

        return {
            selectedProduct,
            selectedPlan,
            selectedDuration,

            // Base fields
            basePrice,
            gstRate,
            discountRate,

            // Calculated breakdown
            totalPrice, // base * days
            gstAmount,
            priceWithGST,
            discountAmount,
            subtotal,
            securityDeposit,
            grandTotal,
            finalMonthlyPrice,
            durationDays,
        };
    };

    // Handle subscribe click
    const handleSubscribeClick = () => {
        if (userInfo?.email) {
            setShowSummaryModal(true); // Show summary modal first
        } else {
            Swal.fire({
                title: 'Login Required',
                text: 'You need to log in to subscribe.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Login',
                cancelButtonText: 'Cancel',
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate('/auth');
                }
            });
        }
    };

    // Handle form submission for subscription
    const handleSubmit = async (e, paymentType = "online") => {
        e.preventDefault();

        const phoneRegex = /^[1-9][0-9]{9}$/;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!phoneRegex.test(phone)) {
            return Swal.fire({
                icon: 'error',
                title: 'Invalid Phone Number',
                text: 'Phone number must be 10 digits and not start with 0.',
            });
        }

        if (!emailRegex.test(emailID)) {
            return Swal.fire({
                icon: 'error',
                title: 'Invalid Email ID',
                text: 'Please enter a valid email address.',
            });
        }

        const priceDetails = calculatePriceDetails();
        if (!priceDetails) {
            return Swal.fire({
                icon: 'error',
                title: 'Selection Missing',
                text: 'Please make sure a model, plan, and duration are selected.',
            });
        }

        setSubLoading(true);

        try {
            //  Base calculations
            const codFee = paymentType === "cod" ? 100 : 0; // Add ₹100 only if COD
            const updatedGrandTotal = Number(priceDetails.grandTotal.toFixed(2)) + codFee;

            //  Construct payload
            const payload = {
                productModelId: String(priceDetails.selectedProduct._id),
                selectedPlanId: Number(priceDetails.selectedPlan?.plans_id || 0),
                selectedDurationId: Number(priceDetails.selectedDuration?.duration_id || 0),

                // Full price breakdown
                gstRate: Number(priceDetails.gstRate),
                gstAmount: Number(priceDetails.gstAmount.toFixed(2)),
                discountRate: Number(priceDetails.discountRate),
                discountAmount: Number(priceDetails.discountAmount.toFixed(2)),
                priceWithGST: Number(priceDetails.priceWithGST.toFixed(2)),
                finalMonthlyPrice: Number(priceDetails.finalMonthlyPrice.toFixed(2)),
                subtotal: Number(priceDetails.subtotal.toFixed(2)),
                securityDeposit: Number(priceDetails.securityDeposit.toFixed(2)),

                //  Include updated grand total
                grandTotal: updatedGrandTotal,

                wp_device_id: String(priceDetails.selectedProduct.wp_device_id || ""),
                durationDays: Number(priceDetails.durationDays),
                price: Number(priceDetails.totalPrice.toFixed(2)),

                //  Include COD fee only if applicable
                codFee: codFee > 0 ? codFee : undefined,

                //  Payment Type
                paymentType: paymentType, // "online" or "cod"

                //  Delivery details
                deliveryAddress: {
                    country: country || "IN",
                    name: name?.trim() || "",
                    street: street?.trim() || "",
                    landmark: landmark?.trim() || "",
                    district: district?.trim() || "",
                    city: city?.trim() || "",
                    state: state?.trim() || "",
                    phone: phone?.trim() || "",
                    pincode: pincode?.trim() || "",
                    email: emailID?.trim() || "",
                },
            };

            const token = sessionStorage.getItem("WebToken");

            const res = await fetch("/api/website/orders/orderplace", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            console.log("Orderplace response:", data);

            //  COD Flow
            if (paymentType === "cod") {
                if (data.status === "success") {
                    Swal.fire({
                        icon: "success",
                        title: "Order Placed Successfully",
                        text: "Your Cash on Delivery order has been placed successfully!",
                        iconHtml: '<i class="bi bi-bag-check-fill"></i>',
                        timer: 3000,
                        showConfirmButton: false,
                    }).then(() => {
                        setShowModal(false);
                        setName("");
                        setPhone("");
                        setEmailID("");
                        setStreet("");
                        setLandmark("");
                        setPincode("");
                        setCity("");
                        setDistrict("");
                        setState("");
                        window.location.href = "/";
                    });
                } else {
                    Swal.fire("Error", data.message || "COD order failed", "error");
                }
                return; //  Stop Razorpay flow for COD
            }

            if (data.status !== "success" || !data.data?.razorpayOrder?.id) {
                return Swal.fire("Error", data.message || "Order failed", "error");
            }

            const options = {
                key: RAZORPAY_KEY,
                amount: data.data.razorpayOrder.amount,
                currency: "INR",
                order_id: data.data.razorpayOrder.id,
                name: "Subscription Payment",
                description: `Subscription for ${priceDetails.durationDays} days`,
                handler: async (response) => {
                    // Show loading message during verification
                    Swal.fire({
                        title: 'Verifying Your Payment',
                        text: 'Please wait a few seconds while we verify your order payment...',
                        icon: 'info',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    try {
                        const verifyRes = await fetch("/api/website/orders/orderverify", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`,
                            },
                            body: JSON.stringify(response),
                        });
                        const verifyData = await verifyRes.json();

                        if (verifyData.status && verifyData.status.toLowerCase() === "success") {
                            Swal.fire({
                                icon: "success",
                                title: "Payment Successful",
                                text: "Subscription activated!",
                                iconHtml: '<i class="bi bi-bag-check-fill"></i>',
                                timer: 3000,
                                showConfirmButton: false,
                            }).then(() => {
                                setShowModal(false);
                                setName("");
                                setPhone("");
                                setEmailID("");
                                setStreet("");
                                setLandmark("");
                                setPincode("");
                                setCity("");
                                setDistrict("");
                                setState("");
                                window.location.href = "/";
                            });
                        } else {
                            Swal.fire("Error", "Verification failed", "error");
                        }
                    } catch (error) {
                        Swal.fire("Error", error.message || "Verification failed. Please try again.", "error");
                    }
                },
                modal: {
                    ondismiss: async () => {
                        await fetch("/api/website/orders/ordercancel", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`,
                            },
                            body: JSON.stringify({ reason: "User cancelled", orderId: data.data.orderId }),
                        });
                        Swal.fire("Payment Cancelled", "You cancelled the payment", "warning");
                    },
                },
                prefill: { name, email: emailID, contact: phone.trim() },
                theme: { color: "#3399cc" },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

            rzp.on('payment.failed', function (response) {
                Swal.fire("Payment Failed", response.error.description, "error");
            });
        } catch (error) {
            console.error("Error in handleSubmit:", error);
            Swal.fire("Error", error.message || "Something went wrong. Please try again later.", "error");
        } finally {
            setSubLoading(false);
        }
    };

    // Handle main image
    const [mainImage, setMainImage] = useState("");
    useEffect(() => {
        if (products.length > 0 && products[selectedModelIndex]) {
            setMainImage(products[selectedModelIndex].main_img);
        }
    }, [selectedModelIndex, products]);

    // Set the first item (index 0) as default open
    const [activeIndex, setActiveIndex] = useState(0);

    // FAQ data
    const faqs = [
        {
            question: "Why is subscribing to a ionHive water purifier for home better than buying?",
            answer: "Subscribing to home water purification eliminates upfront costs, AMC, and service charges. Enjoy hassle-free access to pure drinking water.",
        },
        {
            question: "Can I modify or upgrade my water purifier subscription plan later?",
            answer: "Yes, enjoy flexibility in modifying or upgrading your water purifier subscription plan using the ionHive mobile app based on your changing needs.",
        },
        {
            question: "How does ionHive ensure prompt RO water purifier service?",
            answer: "Enjoy hassle-free after-sales RO water purifier service with ionHive at no additional cost. Our IoT technology constantly monitors water quality, triggering proactive RO water purifier service alerts. The ionHive mobile app aids in diagnosing water dispensing issues, while our call center and company-operated technician network ensure speedy resolutions.",
        },
        {
            question: "Will my water purifier subscription balance be carried forward?",
            answer: "Your balance will be carried forward until you continue using the same water purifier subscription plan. The balance gets reset when you change plans.",
        },
        {
            question: "Does this require drilling/change in my water and power lines?",
            answer: "More than 85% of our customers choose to use the water purifier as a wall-hanging unit. However, you can choose to use the unit both as a wall-hanging and a countertop unit. Our experienced RO installation team will take care of all the necessary power/water line changes required during the process.",
        },
        {
            question: "What are the key features of the ionHive Alkaline water purifier?",
            answer: "The ionHive Alkaline purifier comes fully loaded with a multistage purification process that includes alkaline water purification, reverse osmosis purification and UV purification.",
        },
    ];

    const handleToggle = (index) => {
        // Close if already open, otherwise open the clicked item
        setActiveIndex(index === activeIndex ? null : index);
    };

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateEmail = (email) => {
        // Basic email validation
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    };

    const handleSubmits = async (e) => {
        e.preventDefault();

        const { name, email, subject, message } = formData;

        if (!validateEmail(email)) {
            Swal.fire("Invalid Email", "Please enter a valid email address.", "error");
            return;
        }

        try {
            const response = await fetch("/api/website/contact/submitcontact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, subject, message }),
            });

            const data = await response.json(); //  Parse server response

            if (response.ok) {
                Swal.fire("Success", data.message || "Your message has been sent.", "success");
                setFormData({ name: "", email: "", subject: "", message: "" });
            } else {
                Swal.fire("Error", data.message || "Something went wrong. Please try again.", "error");
            }
        } catch (error) {
            Swal.fire("Error", "Server error. Please try again later.", "error");
        }
    };

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

    const [districts, setDistricts] = useState([]);

    useEffect(() => {
        const fetchDistricts = async () => {
            try {
                const response = await axios.get("/api/admin/GetDistrictsWithSellers");
                if (response.data?.status === "Success" && Array.isArray(response.data.data)) {
                    setDistricts(response.data.data);
                } else {
                    console.warn("Unexpected API structure:", response.data);
                }
            } catch (error) {
                console.error("Error fetching districts:", error);
                Swal.fire("Error", "Failed to load city data", "error");
            }
        };

        fetchDistricts();
    }, []);

    // Dynamically build map using "country-state-city"
    const stateNameMap = {};
    const indianStates = State.getStatesOfCountry("IN"); // all states of India

    indianStates.forEach((s) => {
        // Example: { name: "Karnataka", isoCode: "KA" }
        stateNameMap[s.isoCode.toUpperCase()] = s.name;
    });


    return (
        <div>

            {/* Header */}
            <Header userInfo={userInfo} handleLogout={handleLogout} />

            <main className="main">

                {/* <!-- Hero Section --> */}
                <section id="hero" className="hero section">

                    <div className="container" data-aos="fade-up" data-aos-delay="100">

                        <div className="row align-items-center">
                            <div className="col-lg-6">
                                <div className="hero-content" data-aos="fade-up" data-aos-delay="200">
                                    {userInfo?.email && (
                                        <div className="company-badge mb-4">
                                            Welcome - {userInfo.email}
                                        </div>
                                    )}

                                    <h5>Smart Purifiers on Rent. Free Maintenance for Life.</h5>
                                    <p>IoT-enabled RO+UV water purifiers with Copper Filter, Alkaline Filter, & Mineraliser.</p>
                                    <p className="mb-md-5">Pay only rentals and get lifetime free maintenance. ZERO machine cost.</p>

                                    <div className="hero-buttons">
                                        <a href="#about" className="btn btn-primary me-0 me-sm-2 mx-1">BOOK NOW</a>
                                        <a href="https://www.youtube.com/watch?v=Y7f98aduVJ8" className="btn btn-link mt-2 mt-sm-0 glightbox">
                                            <i className="bi bi-play-circle me-1"></i>
                                            Play Video
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-6">
                                <div className="hero-image" data-aos="zoom-out" data-aos-delay="300">
                                    <img src="assets/img/water-purifier.png" alt="Hero Image" className="img-fluid" style={{ width: '100%', animation: 'float-badge 3s ease-in-out infinite' }} />
                                </div>
                            </div>
                        </div>

                        {/* <!-- Stats Section --> */}
                        <section id="stats" className="stats section" style={{ padding: '10px', borderRadius: '10px' }}>

                            <div className="container" data-aos="fade-up" data-aos-delay="100">

                                <div className="row gy-4">

                                    <div className="col-lg-3 col-md-6">
                                        <div className="stats-item text-center w-100 h-100">
                                            <p style={{ color: '#0d83fd' }}>₹0 Installation Cost</p>
                                        </div>
                                    </div>
                                    {/* <!-- End Stats Item --> */}

                                    <div className="col-lg-3 col-md-6">
                                        <div className="stats-item text-center w-100 h-100">
                                            <p style={{ color: '#0d83fd' }}>₹0 Machine Cost</p>
                                        </div>
                                    </div>
                                    {/* <!-- End Stats Item --> */}

                                    <div className="col-lg-3 col-md-6">
                                        <div className="stats-item text-center w-100 h-100">
                                            <p style={{ color: '#0d83fd' }}>₹0 Maintenance Cost</p>
                                        </div>
                                    </div>
                                    {/* <!-- End Stats Item --> */}

                                    <div className="col-lg-3 col-md-6">
                                        <div className="stats-item text-center w-100 h-100">
                                            <p style={{ color: '#0d83fd' }}>₹0 Relocation Cost</p>
                                        </div>
                                    </div>
                                    {/* <!-- End Stats Item --> */}

                                </div>

                            </div>

                        </section>
                        {/* <!-- /Stats Section --> */}

                        <div className="row stats-row gy-4 mt-5" data-aos="fade-up" data-aos-delay="500">
                            <div className="col-lg-4 col-md-6">
                                <div className="stat-item" style={{ padding: '0px' }}>
                                    <div className="stat-icon">
                                        <i className="bi bi-tools"></i>
                                    </div>
                                    <div className="stat-content">
                                        <h4>Lifetime Free Maintenance</h4>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6">
                                <div className="stat-item" style={{ padding: '0px' }}>
                                    <div className="stat-icon">
                                        <i className="bi bi-lightning-charge"></i>
                                    </div>
                                    <div className="stat-content">
                                        <h4>48-hour Installation</h4>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6">
                                <div className="stat-item" style={{ padding: '0px' }}>
                                    <div className="stat-icon">
                                        <i className="bi bi-currency-rupee"></i>
                                    </div>
                                    <div className="stat-content">
                                        <h4>Plans starting 299/month</h4>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </section>
                {/* <!-- /Hero Section --> */}

                {/* <!-- About Section --> */}
                <section id="about" className="about section">

                    <div className="container" data-aos="fade-up" data-aos-delay="100">

                        <div className="row gy-4 align-items-center justify-content-between">

                            <div className="col-xl-5" data-aos="fade-up" data-aos-delay="200">
                                <h2><span className="about-meta">Smart RO Water Purifiers On Subscription</span></h2>
                                <h2 className="about-title">Tired of running out of water cans in the middle of the night? Or burning a hole in your pocket trying to maintain your water purifier?</h2>
                                <p className="about-description">Switch to ionHive's IoT-enabled smart water purifiers on subscription, by choosing a rental plan for 28, 90 or 360 days.
                                    Get lifetime free maintenance with zero machine cost - pure water, hassle-free!</p>

                                <div className="info-wrapper">
                                    <div className="row gy-4">
                                        <div className="col-lg-7">
                                            <a href="#how-it-works" className="btn btn-primary me-0 me-sm-2 mx-1">Know How It Works</a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-xl-6" data-aos="fade-up" data-aos-delay="300">
                                <div className="image-wrapper">
                                    <div className="images position-relative" data-aos="zoom-out" data-aos-delay="400">
                                        <img src="assets/img/water-purifier2.webp" alt="Business Meeting" className="img-fluid main-image rounded-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </section>
                {/* <!-- /About Section --> */}

                {/* <!-- Features Section --> */}
                <section id="hero" className="features section">
                    <div className="container section-title" data-aos="fade-up" style={{ paddingBottom: '0px' }}>
                        <h2>Products That Fit Every Lifestyle And Budget</h2>
                        <p>Each of our smart water purifiers comes with advanced multi-stage purification and IoT technology.</p>
                    </div>

                    {products.length > 0 ? (
                        <div className="container">
                            <div className="tab-content">
                                <div className="tab-pane fade active show">
                                    <div className="container" data-aos="fade-up">
                                        <div className="row gy-4">
                                            <div className="col-lg-3 col-md-6">
                                                <div className="stats-item text-center w-100 h-100">
                                                    <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> Multistage Universal Water purifier</p>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6">
                                                <div className="stats-item text-center w-100 h-100">
                                                    <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> Goodness of copper</p>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6">
                                                <div className="stats-item text-center w-100 h-100">
                                                    <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> RO Purification</p>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6">
                                                <div className="stats-item text-center w-100 h-100">
                                                    <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> In-line UV purification</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row mt-4 align-items-start">
                                        <div className="col-lg-6 col-12" style={{ padding: '20px' }}>
                                            <div className="d-flex justify-content-center flex-column align-items-center section-title">
                                                <div className="text-center mb-3">
                                                    <h2>Select Model</h2>
                                                </div>
                                                <ul className="nav nav-tabs flex-wrap" style={{ justifyContent: 'center' }}>
                                                    {products.map((product, index) => {
                                                        const isSelected = selectedModelIndex === index;
                                                        return (
                                                            <li key={product._id} className="nav-item">
                                                                <button
                                                                    className={`nav-link text-center ${isSelected ? 'active' : ''}`}
                                                                    onClick={() => {
                                                                        setSelectedModelIndex(index);
                                                                        setSelectedPlanIndex(0);
                                                                        setSelectedDurationIndex(0);
                                                                        setTimeout(() => {
                                                                            durationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                                                        }, 100);
                                                                    }}
                                                                    style={{
                                                                        minWidth: '150px',
                                                                        margin: '5px',
                                                                        backgroundColor: isSelected ? '#0d6efd' : '#e8f1ff', // blue for active, light-blue for others
                                                                        color: isSelected ? '#fff' : '#0d6efd',              // white text for active, blue text for others
                                                                        border: '1px solid #0d6efd',
                                                                        borderRadius: '15px',
                                                                        fontWeight: '600',
                                                                        transition: 'all 0.3s ease'
                                                                    }}
                                                                >
                                                                    <h4 style={{ margin: 0, fontSize: '16px' }}>{product.model_name}</h4>
                                                                </button>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>

                                            </div>
                                        </div>

                                        <div className="col-lg-6 col-12 text-center" style={{ padding: '20px' }}>
                                            <img
                                                src={`/upload/img/${mainImage || products[selectedModelIndex]?.main_img}`}
                                                alt="Main Product"
                                                className="img-fluid mb-3"
                                                style={{
                                                    boxShadow: 'rgb(0 111 255 / 72%) 0px 8px 15px',
                                                    borderRadius: '20px',
                                                    maxWidth: '100%',
                                                    width: '400px',
                                                    height: '300px',
                                                    objectFit: 'contain',
                                                }}
                                            />
                                            <div className="d-flex justify-content-center align-items-center flex-wrap gap-3 mt-3">
                                                {[1, 2, 3, 4].map((num) => {
                                                    const subImg = products[selectedModelIndex]?.[`sub_img_${num}`];
                                                    return subImg ? (
                                                        <img
                                                            key={num}
                                                            src={`/upload/img/${subImg}`}
                                                            alt={`Sub ${num}`}
                                                            className="rounded"
                                                            style={{
                                                                width: "80px",
                                                                height: "80px",
                                                                objectFit: "cover",
                                                                border: mainImage === subImg ? "2px solid #0d83fd" : "1px solid #ccc",
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() => setMainImage(subImg)}
                                                        />
                                                    ) : null;
                                                })}
                                                {products[selectedModelIndex]?.main_img && (
                                                    <img
                                                        src={`/upload/img/${products[selectedModelIndex].main_img}`}
                                                        alt="Main Preview"
                                                        className="rounded"
                                                        style={{
                                                            width: "80px",
                                                            height: "80px",
                                                            objectFit: "cover",
                                                            border: mainImage === products[selectedModelIndex].main_img ? "2px solid #0d83fd" : "2px dashed #0d83fd",
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={() => setMainImage(products[selectedModelIndex].main_img)}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div ref={durationRef}>
                                        <div className="row mt-4">
                                            <div className="col-lg-12">
                                                <div style={{ textAlign: "center" }}>
                                                    <h2>Flexible Rental Plans</h2>
                                                    {/* --- BLUE CENTER BORDER --- */}
                                                    <div
                                                        style={{
                                                            width: "50px", height: "3px",
                                                            backgroundColor: "#0d6efd",
                                                            borderRadius: "2px", margin: "10px auto 0 auto",
                                                        }}
                                                    ></div>
                                                    <p className="fst-italic mt-2">
                                                        Security deposit of ₹{products[selectedModelIndex]?.duration[selectedDurationIndex]?.security_deposit || 0} will be 100% refundable
                                                    </p>
                                                    <h5>Choose Duration</h5>
                                                    <div className="d-flex flex-wrap gap-2 mb-3 justify-content-center" style={{ textAlign: "center" }}>
                                                        {products[selectedModelIndex]?.duration.map((duration, durationIndex) => (
                                                            <button
                                                                key={duration.duration_id}
                                                                className={`btn ${selectedDurationIndex === durationIndex
                                                                    ? "btn-primary"
                                                                    : "btn-outline-primary"
                                                                    }`}
                                                                onClick={() => setSelectedDurationIndex(durationIndex)}
                                                            >
                                                                {duration.duration_time_limit}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="row justify-content-center" style={{ padding: "20px" }}>
                                                    {products[selectedModelIndex]?.plans.map((plan, planIndex) => {
                                                        const priceDetails = calculatePriceDetails();
                                                        if (!priceDetails) return null;

                                                        const selectedDuration = priceDetails.selectedDuration?.duration_time_limit || "N/A";
                                                        const durationNumber = parseInt(selectedDuration);
                                                        const isPopular = plan.label.toLowerCase() === "couple";
                                                        const connectivity = products[selectedModelIndex]?.connectivity?.trim();

                                                        return (
                                                            <div className="col-md-3 mb-4" key={plan.plans_id}>
                                                                <div
                                                                    className="card h-100 shadow-sm position-relative"
                                                                    style={{
                                                                        borderRadius: "20px",
                                                                        overflow: "visible",
                                                                        border: isPopular ? "2px solid #0d6efd" : "2px solid #e0e0e0",
                                                                        transition: "all 0.3s ease-in-out",
                                                                        transform: "scale(1)",
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.transform = "scale(1.05)";
                                                                        e.currentTarget.style.boxShadow = "0 0 25px rgba(13, 110, 253, 0.3)";
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.transform = "scale(1)";
                                                                        e.currentTarget.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.1)";
                                                                    }}
                                                                >
                                                                    {/* --- MOST POPULAR BADGE --- */}
                                                                    {isPopular && (
                                                                        <div
                                                                            style={{
                                                                                position: "absolute",
                                                                                top: "-14px",
                                                                                left: "50%",
                                                                                transform: "translateX(-50%)",
                                                                                background: "#0d6efd",
                                                                                color: "#fff",
                                                                                borderRadius: "20px",
                                                                                padding: "4px 16px",
                                                                                fontSize: "13px",
                                                                                fontWeight: "600",
                                                                                boxShadow: "0 2px 6px rgba(13,110,253,0.3)",
                                                                                zIndex: "10",
                                                                            }}
                                                                        >
                                                                            Most Popular
                                                                        </div>
                                                                    )}

                                                                    {/* HEADER */}
                                                                    <div className="card-header bg-white text-center pt-4 border-0" style={{ borderRadius: '20px', }}>
                                                                        <h5
                                                                            style={{
                                                                                color: "#000",
                                                                                textTransform: "capitalize",
                                                                                fontWeight: "700",
                                                                                marginBottom: "5px",
                                                                                fontSize: "20px",
                                                                            }}
                                                                        >
                                                                            {plan.label} Plan
                                                                        </h5>
                                                                        <p style={{ fontWeight: "600" }}>
                                                                            {plan.label?.toLowerCase() === "unlimited" || !plan.capacity ? (
                                                                                <span style={{ color: "rgb(13, 110, 253)" }}>Unlimited</span>
                                                                            ) : (
                                                                                <>
                                                                                    {plan.capacity}/
                                                                                    <span style={{ color: "rgb(13, 110, 253)" }}>Ltr</span>
                                                                                </>
                                                                            )}
                                                                        </p>
                                                                    </div>

                                                                    {/* PRICE */}
                                                                    <div className="text-center mt-2">
                                                                        <h4
                                                                            style={{
                                                                                color: "#000", fontWeight: "700",
                                                                                fontSize: "32px", marginBottom: "5px",
                                                                            }}
                                                                        >
                                                                            {/* PRICE */}
                                                                            <div className="text-center mt-2">
                                                                                {(() => {
                                                                                    const basePrice = plan.price || 0;
                                                                                    const durationText = selectedDuration || "28 days";

                                                                                    // Extract number part from duration (e.g. "90 days" → 90)
                                                                                    const durationDays = parseInt(durationText);
                                                                                    const baseDays = 28; // base duration for price calculation

                                                                                    // Calculate multiplied total
                                                                                    const totalPrice = (basePrice / baseDays) * durationDays;

                                                                                    //  Format with Indian comma style and no decimals
                                                                                    const formattedPrice = new Intl.NumberFormat("en-IN", {
                                                                                        style: "currency",
                                                                                        currency: "INR",
                                                                                        minimumFractionDigits: 0,
                                                                                        maximumFractionDigits: 0,
                                                                                    }).format(totalPrice);

                                                                                    return (
                                                                                        <>
                                                                                            <span style={{ color: "#0d6efd", fontWeight: "700", fontSize: "32px" }}>
                                                                                                {formattedPrice}
                                                                                            </span>
                                                                                            <p
                                                                                                style={{
                                                                                                    color: "#666",
                                                                                                    fontWeight: "500",
                                                                                                    fontSize: "15px",
                                                                                                    marginBottom: "0px",
                                                                                                }}
                                                                                            >
                                                                                                / per {durationText.toLowerCase().includes("day") ? durationText : "month"}
                                                                                            </p>
                                                                                        </>
                                                                                    );
                                                                                })()}
                                                                            </div>

                                                                            <p
                                                                                style={{
                                                                                    marginTop: "8px", color: "#333",
                                                                                    fontWeight: "600", fontSize: "13px",
                                                                                }}
                                                                            >
                                                                                {priceDetails.discountRate ? `${priceDetails.discountRate}% OFF` : "No Discount"}
                                                                                <br />
                                                                                <span style={{ fontSize: "12px", color: "#777" }}>(Inclusive of GST)</span>
                                                                            </p>
                                                                            {/* --- BLUE CENTER BORDER --- */}
                                                                            <div
                                                                                style={{
                                                                                    width: "200px", height: "2px",
                                                                                    backgroundColor: "#0d6efd",
                                                                                    borderRadius: "2px", margin: "10px auto 0 auto",
                                                                                }}
                                                                            ></div>
                                                                        </h4>
                                                                    </div>
                                                                    {/* FEATURES */}
                                                                    <div className="card-body text-left px-4" style={{ paddingTop: "0px" }}>
                                                                        <ul style={{ listStyle: "none", paddingLeft: "0", margin: "5px 0" }}>
                                                                            <li className="mb-2">
                                                                                <span className="text-success">✓</span> Lifetime Maintenance
                                                                            </li>
                                                                            <li className="mb-2">
                                                                                <span className="text-success">✓</span> Security ₹{products[selectedModelIndex]?.duration[selectedDurationIndex]?.security_deposit || 0}
                                                                            </li>
                                                                            <li className="mb-2">
                                                                                <span className="text-success">✓</span> 24–48 Hour Installation
                                                                            </li>
                                                                            {durationNumber >= 90 && (
                                                                                <li className="mb-2">
                                                                                    <span className="text-success">✓</span> Filter Replacement Every 3 Months
                                                                                </li>
                                                                            )}

                                                                            {/* --- CONNECTIVITY --- */}
                                                                            {connectivity ? (
                                                                                <li className="mb-2">
                                                                                    <span className="text-success">✓</span> Connectivity:
                                                                                    <ul
                                                                                        style={{
                                                                                            listStyleType: "disc",
                                                                                            paddingLeft: "25px",
                                                                                            marginTop: "5px",
                                                                                        }}
                                                                                    >
                                                                                        {connectivity.split(",").map((conn, i) => (
                                                                                            <li key={i}>{conn.trim()}</li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </li>
                                                                            ) : (
                                                                                <li className="mb-2 text-danger">
                                                                                    ❌ No Connectivity
                                                                                </li>
                                                                            )}

                                                                            <li className="mb-2">
                                                                                <span className="text-success">✓</span> Discount: {priceDetails.discountRate || 0}%
                                                                            </li>
                                                                            <li className="mb-2">
                                                                                <span className="text-success">✓</span> GST:{" "}
                                                                                {products[selectedModelIndex]?.duration[selectedDurationIndex]?.gst || 0}%
                                                                            </li>
                                                                            <li className="text-warning">
                                                                                <span className="text-warning">✓</span> Includes ₹
                                                                                {priceDetails.securityDeposit || 0} refundable deposit
                                                                            </li>
                                                                        </ul>
                                                                    </div>

                                                                    {/* BUTTON */}
                                                                    <div className="card-footer text-center pb-4 border-0 bg-white" style={{ borderRadius: '20px' }}>
                                                                        {(() => {
                                                                            const product = products[selectedModelIndex];
                                                                            const isOutOfStock = !product?.wp_device_id;
                                                                            if (isOutOfStock) {
                                                                                return (
                                                                                    <button className="btn btn-danger px-4 py-2 rounded-pill" disabled>
                                                                                        Out of Stock
                                                                                    </button>
                                                                                );
                                                                            }
                                                                            return (
                                                                                <button
                                                                                    className="btn px-4 py-2 rounded-pill"
                                                                                    style={{
                                                                                        background: isPopular ? "#0d6efd" : "#0d6efd",
                                                                                        border: "none",
                                                                                        color: "#fff",
                                                                                        transition: "0.3s",
                                                                                    }}
                                                                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#0b5ed7")}
                                                                                    onMouseLeave={(e) => (e.currentTarget.style.background = "#0d6efd")}
                                                                                    onClick={() => {
                                                                                        setSelectedPlanIndex(planIndex);
                                                                                        handleSubscribeClick();
                                                                                    }}
                                                                                >
                                                                                    Subscribe Now
                                                                                </button>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="container text-center my-5">
                            <h3>No products available at the moment.</h3>
                        </div>
                    )}

                    {showSummaryModal && (
                        <div
                            className="modal show d-block"
                            tabIndex="-1"
                            style={{
                                backgroundColor: "rgba(0,0,0,0.5)",
                                padding: "20px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                position: "fixed",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                zIndex: 1050,
                                paddingTop: '5%'
                            }}
                        >
                            <div
                                className="modal-dialog modal-lg"
                                style={{
                                    maxWidth: "700px",
                                    width: "60%",
                                }}
                            >
                                <div
                                    className="modal-content"
                                    style={{
                                        border: "2px solid #0d6efd",
                                        borderRadius: "12px",
                                        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                                    }}
                                >
                                    <div className="modal-header" style={{ backgroundColor: 'aliceblue' }}>
                                        <h5 className="modal-title" style={{ color: "#0d6efd" }}>
                                            Subscription Summary
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setShowSummaryModal(false)}
                                        ></button>
                                    </div>

                                    <div
                                        className="modal-body"
                                        style={{
                                            fontSize: "16px",
                                            lineHeight: "1.8",
                                            padding: "20px 30px",
                                        }}
                                    >
                                        {(() => {
                                            const priceDetails = calculatePriceDetails();
                                            if (!priceDetails)
                                                return <p>Error loading summary. Please try again.</p>;

                                            const textRow = (label, value, isBold = false, isBlue = false) => (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        marginBottom: "6px",
                                                        alignItems: "baseline",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontWeight: 600,
                                                            color: "#000",
                                                            fontSize: "15px",
                                                        }}
                                                    >
                                                        {label}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontWeight: isBold ? "700" : "500",
                                                            color: isBlue ? "#0d6efd" : "#333",
                                                            fontSize: "14px", // smaller than label
                                                        }}
                                                    >
                                                        {value}
                                                    </span>
                                                </div>
                                            );

                                            //  Price Calculations
                                            const basePrice = priceDetails.basePrice || 0;
                                            const durationText = priceDetails.selectedDuration?.duration_time_limit || "28 days";
                                            const durationDays = parseInt(durationText) || 28;
                                            const baseDays = 28;
                                            const totalPrice = (basePrice / baseDays) * durationDays;

                                            const gstRate = priceDetails.gstRate || 0;
                                            const gstAmount = (totalPrice * gstRate) / 100;
                                            const priceWithGST = totalPrice + gstAmount;

                                            const discountRate = priceDetails.discountRate || 0;
                                            const discountAmount = (priceWithGST * discountRate) / 100;
                                            const subtotal = priceWithGST - discountAmount;
                                            const securityDeposit = priceDetails.securityDeposit || 0;

                                            //  COD Fee Logic
                                            const codFee = selectedPaymentType === "cod" ? 100 : 0;
                                            const grandTotal = subtotal + securityDeposit + codFee;

                                            const formatINR = (val) =>
                                                `₹${val.toLocaleString("en-IN", {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2,
                                                })}`;

                                            const formattedPrice = formatINR(totalPrice);

                                            return (
                                                <>
                                                    {textRow("Model", priceDetails.selectedProduct?.model_name, false, true)}
                                                    {textRow("Plan", priceDetails.selectedPlan?.label, false, true)}

                                                    {/* Capacity */}
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            marginBottom: "6px",
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: "600", color: "#000" }}>Capacity</span>
                                                        <span style={{ fontWeight: "500" }}>
                                                            {priceDetails.selectedPlan?.label?.toLowerCase() === "unlimited" ||
                                                                !priceDetails.selectedPlan?.capacity ? (
                                                                <span style={{ color: "rgb(13, 110, 253)" }}>Unlimited</span>
                                                            ) : (
                                                                <>
                                                                    {priceDetails.selectedPlan?.capacity}/
                                                                    <span style={{
                                                                        color: "rgb(13, 110, 253)"
                                                                    }}>Ltr</span>
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>

                                                    <hr style={{ color: "#0d6efd" }} />

                                                    {textRow("Price", formattedPrice)}
                                                    {textRow("Duration", `${durationDays} days`)}
                                                    {textRow(`GST (${gstRate}%)`, formatINR(gstAmount))}
                                                    {textRow("Price with GST", formatINR(priceWithGST))}
                                                    {textRow(`Discount (${discountRate}%)`, formatINR(discountAmount))}

                                                    <hr style={{ color: "#0d6efd" }} />

                                                    {textRow("Subtotal", formatINR(subtotal))}
                                                    {textRow("Security Deposit", formatINR(securityDeposit))}
                                                    {selectedPaymentType === "cod" && textRow("COD Fee", formatINR(codFee))}
                                                    {textRow("Grand Total", formatINR(grandTotal), true, true)}
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Footer Section */}
                                    {/* Footer Section */}
                                    <div
                                        className="modal-footer"
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: "15px",
                                            paddingBottom: "20px",
                                            backgroundColor: "aliceblue",
                                        }}
                                    >
                                        {/* Payment Type Selection */}
                                        <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
                                            {["online", "cod"].map((type) => (
                                                <label
                                                    key={type}
                                                    style={{
                                                        cursor: "pointer",
                                                        padding: "12px 20px",
                                                        border: selectedPaymentType === type
                                                            ? type === "online"
                                                                ? "2px solid #0d6efd"
                                                                : "2px solid #198754"
                                                            : "1px solid #ccc",
                                                        borderRadius: "10px",
                                                        backgroundColor:
                                                            selectedPaymentType === type
                                                                ? type === "online"
                                                                    ? "#e7f1ff"
                                                                    : "#e9f9ee"
                                                                : "#fff",
                                                        boxShadow:
                                                            selectedPaymentType === type
                                                                ? "0 0 10px rgba(13,110,253,0.3)"
                                                                : "none",
                                                        transition: "all 0.2s ease-in-out",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                        minWidth: "200px",
                                                        justifyContent: "center",
                                                        fontWeight: "600",
                                                        color:
                                                            selectedPaymentType === type
                                                                ? type === "online"
                                                                    ? "#0d6efd"
                                                                    : "#198754"
                                                                : "#333",
                                                    }}
                                                    onClick={() => setSelectedPaymentType(type)}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="paymentType"
                                                        value={type}
                                                        checked={selectedPaymentType === type}
                                                        onChange={() => setSelectedPaymentType(type)}
                                                        style={{ accentColor: type === "online" ? "#0d6efd" : "#198754" }}
                                                    />
                                                    {type === "online" ? "Online Payment" : "Cash on Delivery"}
                                                </label>
                                            ))}
                                        </div>

                                        {/* Dynamic Message */}
                                        {selectedPaymentType && (
                                            <div
                                                style={{
                                                    marginTop: "10px",
                                                    fontWeight: 600,
                                                    color: selectedPaymentType === "cod" ? "#198754" : "#0d6efd",
                                                }}
                                            >
                                                {selectedPaymentType === "cod"
                                                    ? "Cash on Delivery selected — ₹100 COD fee will be added to your total."
                                                    : "Online Payment selected — proceed to secure checkout."}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div style={{ marginTop: "20px", display: "flex", gap: "15px" }}>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => setShowSummaryModal(false)}
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                className={`btn ${selectedPaymentType ? "btn-primary" : "btn-outline-primary"}`}
                                                style={{
                                                    padding: "10px 30px",
                                                    fontWeight: "700",
                                                    opacity: selectedPaymentType ? 1 : 0.7,
                                                    cursor: selectedPaymentType ? "pointer" : "not-allowed",
                                                    boxShadow: selectedPaymentType ? "0 0 10px rgba(13,110,253,0.4)" : "none",
                                                    transition: "all 0.3s ease",
                                                }}
                                                disabled={!selectedPaymentType}
                                                onClick={() => {
                                                    setShowSummaryModal(false);
                                                    setShowModal(true);
                                                }}
                                            >
                                                {selectedPaymentType === "cod"
                                                    ? "Proceed to COD Checkout"
                                                    : selectedPaymentType === "online"
                                                        ? "Proceed to Online Checkout"
                                                        : "Select Payment Type"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {showModal && (
                        <div
                            className={`modal ${showModal ? "d-block" : "d-none"}`}
                            tabIndex="-1"
                            style={{
                                backgroundColor: "rgba(0,0,0,0.5)",
                                position: "fixed",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                zIndex: 1050,
                                padding: "20px",
                                paddingTop: '5%'
                            }}
                        >
                            <div
                                className="modal-dialog modal-lg"
                                style={{
                                    width: "60%",
                                    maxWidth: "800px",
                                }}
                            >
                                <div
                                    className="modal-content"
                                    style={{
                                        border: "2px solid #0d6efd",
                                        borderRadius: "12px",
                                        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                                    }}
                                >
                                    <div
                                        className="modal-header"
                                        style={{
                                            alignItems: "center",
                                            borderBottom: "1px solid #dee2e6",
                                            padding: "12px 20px",
                                            backgroundColor: 'aliceblue'
                                        }}
                                    >
                                        <h5 className="modal-title" style={{ color: "#0d6efd", fontWeight: 600 }}>
                                            Delivery Address
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setShowModal(false)}
                                        ></button>
                                    </div>

                                    <div
                                        className="modal-body"
                                        style={{
                                            height: "600px",
                                            overflowY: "auto",
                                            padding: "25px 30px",
                                            fontSize: "15px",
                                        }}
                                    >
                                        <form onSubmit={handleSubmit}>
                                            {/* 2-column layout grid */}
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                                                    gap: "20px 30px",
                                                }}
                                            >
                                                {/* Name */}
                                                <div>
                                                    <label style={{ fontWeight: 600 }}>Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        required
                                                        value={name}
                                                        onChange={(e) => {
                                                            if (/^[a-zA-Z\s]*$/.test(e.target.value)) setName(e.target.value);
                                                        }}
                                                    />
                                                </div>

                                                {/* Phone */}
                                                <div>
                                                    <label style={{ fontWeight: 600 }}>Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        className="form-control"
                                                        required
                                                        value={phone}
                                                        minLength={10}
                                                        maxLength={10}
                                                        onChange={(e) => {
                                                            let input = e.target.value.replace(/\D/g, '');
                                                            if (input.length === 1 && /^[0-5]$/.test(input)) {
                                                                input = '';
                                                            }
                                                            setPhone(input);
                                                        }}
                                                    />
                                                </div>

                                                {/* Email */}
                                                <div>
                                                    <label style={{ fontWeight: 600 }}>Email ID</label>
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        required
                                                        value={emailID}
                                                        onChange={(e) => setEmailID(sanitizeEmail(e.target.value))}
                                                    />
                                                </div>

                                                {/* Street */}
                                                <div>
                                                    <label style={{ fontWeight: 600 }}>Street Address</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        required
                                                        value={street}
                                                        onChange={(e) => setStreet(e.target.value)}
                                                    />
                                                </div>

                                                {/* Landmark */}
                                                <div>
                                                    <label style={{ fontWeight: 600 }}>Landmark</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={landmark}
                                                        onChange={(e) => setLandmark(e.target.value)}
                                                    />
                                                </div>

                                                {/* Country */}
                                                <div>
                                                    <label style={{ fontWeight: 600 }}>Country</label>
                                                    <select
                                                        className="form-control"
                                                        value={country}
                                                        onChange={(e) => setCountry(e.target.value)}
                                                    >
                                                        {countryList.map((c) => (
                                                            <option key={c.isoCode} value={c.isoCode}>
                                                                {c.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* State */}
                                                <div>
                                                    <label style={{ fontWeight: 600 }}>State</label>
                                                    <select
                                                        className="form-control"
                                                        value={state}
                                                        onChange={(e) => setState(e.target.value)}
                                                    >
                                                        <option>Select State</option>
                                                        {stateList.map((s) => (
                                                            <option key={s.isoCode} value={s.isoCode}>
                                                                {s.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* District */}
                                                <div>
                                                    <label style={{ fontWeight: 600 }}>District</label>
                                                    <select
                                                        className="form-control"
                                                        value={district}
                                                        onChange={(e) => setDistrict(e.target.value)}
                                                    >
                                                        <option>Select District</option>
                                                        {districtList.map((d) => (
                                                            <option key={d} value={d}>
                                                                {d}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* City */}
                                                <div>
                                                    <label style={{ fontWeight: 600 }}>City</label>
                                                    <select
                                                        className="form-control"
                                                        value={city}
                                                        onChange={(e) => setCity(e.target.value)}
                                                    >
                                                        <option>Select City</option>
                                                        {cityList.map((c) => (
                                                            <option key={c.name} value={c.name}>
                                                                {c.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Pincode */}
                                                <div>
                                                    <label style={{ fontWeight: 600 }}>Pin Code</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={pincode}
                                                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                                                        maxLength={6}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Bottom info & button */}
                                            <div
                                                style={{
                                                    marginTop: "30px",
                                                    textAlign: "center",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                }}
                                            >

                                                {/* Bottom info & button */}
                                                <div
                                                    style={{
                                                        marginTop: "30px",
                                                        textAlign: "center",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <p style={{ color: "#0d6efd", lineHeight: "1.6" }}>
                                                        <i className="bi bi-check2-circle"></i> Lifetime Free Maintenance<br />
                                                        <i className="bi bi-check2-circle"></i> 24-48 Hours Installation
                                                    </p>

                                                    <div style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
                                                        <button
                                                            className="btn"
                                                            style={{
                                                                background: "#6c757d",
                                                                color: "#fff",
                                                                border: "none",
                                                                padding: "8px 20px",
                                                                borderRadius: "6px",
                                                                fontWeight: "600",
                                                            }}
                                                            onClick={() => {
                                                                setShowSummaryModal(true);
                                                                setShowModal(false);
                                                            }}
                                                        >
                                                            Back
                                                        </button>
                                                        {/* Online Pay button */}
                                                        <button
                                                            type="button"
                                                            className="btn"
                                                            style={{
                                                                background: "#0d6efd",
                                                                color: "#fff",
                                                                border: "none",
                                                                padding: "10px 25px",
                                                                borderRadius: "8px",
                                                                fontWeight: 600,
                                                                display: selectedPaymentType === "online" ? "inline-block" : "none",
                                                            }}
                                                            disabled={subLoading}
                                                            onClick={(e) => handleSubmit(e, "online")}
                                                        >
                                                            {subLoading ? "Processing..." : "Online Pay"}
                                                        </button>

                                                        {/* COD button */}
                                                        <button
                                                            type="button"
                                                            className="btn"
                                                            style={{
                                                                background: "#198754",
                                                                color: "#fff",
                                                                border: "none",
                                                                padding: "10px 25px",
                                                                borderRadius: "8px",
                                                                fontWeight: 600,
                                                                display: selectedPaymentType === "cod" ? "inline-block" : "none",
                                                            }}
                                                            disabled={subLoading}
                                                            onClick={(e) => handleSubmit(e, "cod")}
                                                        >
                                                            {subLoading ? "Processing..." : "Cash on Delivery"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </section>
                {/* <!-- /Features Section --> */}

                {/* <!-- Start Product detail Section --> */}
                {products.length > 0 ? (
                    <section id="features" className="features section" style={{ padding: '0px' }}>

                        {/* <!-- Section Title --> */}
                        <div className="container section-title" data-aos="fade-up">

                            <h3 style={{ textAlign: 'left', }}>Product details</h3>
                            <p style={{ textAlign: 'left' }}> {products[selectedModelIndex].product_details}</p>
                            {products[selectedModelIndex]?.product_specifications && (
                                <p style={{ padding: '20px' }}>
                                    <a
                                        href={`/upload/pdf/${products[selectedModelIndex].product_specifications}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary mb-2"
                                    >
                                        Product More Details
                                    </a>
                                </p>
                            )}
                        </div>
                        {/* <!-- End Section Title --> */}
                    </section>
                ) : (
                    <div className="container text-center my-5">
                        <h3>No products available at the moment.</h3>
                    </div>
                )}
                {/* <!-- Start Product detail Section --> */}

                {/* <!-- Start Advantage Section --> */}
                <section id="features" className="features section">

                    {/* <!-- Section Title --> */}
                    <div className="container section-title" data-aos="fade-up">
                        <h2>The ionHive Advantage Next-gen Water Purification at Best Costs</h2>
                        <p>Experience the smartest water purification solutions with ionHive.</p>
                    </div>
                    {/* <!-- End Section Title --> */}

                    {/* <!-- Stats Section --> */}
                    <section id="stats" className="stats section" style={{ padding: '10px', borderRadius: '10px' }}>

                        <div className="container" data-aos="fade-up" data-aos-delay="100">

                            <div style={{ height: '100%', width: '100%', overflow: 'scroll', borderRadius: 'inherit', }} >
                                <div style={{ minWidth: '100%', display: 'table' }}>
                                    <table style={{ marginTop: '3rem', width: '100%', minWidth: '750px', borderCollapse: 'collapse', }} >
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ width: '150px', height: '160px', padding: '20px', fontSize: '1.5rem', fontWeight: 600, textAlign: 'center', lineHeight: '2rem', }} >
                                                    Choose <br /> Smart
                                                </th>
                                                <th style={{ width: '150px', padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', }} >
                                                        <img src="assets/img/download.webp" alt="water can" style={{ height: '90px', width: '74px' }} loading="lazy" />
                                                        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Water Can</p>
                                                    </div>
                                                </th>
                                                <th style={{ width: '150px', padding: '20px', textAlign: 'center', }} >
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', }} >
                                                        <img src="assets/img/other_purifier copy-production.webp" alt="other water purifier" style={{ height: '90px', width: '74px' }} loading="lazy" />
                                                        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Other Purifiers</p>
                                                    </div>
                                                </th>
                                                <th style={{ backgroundColor: '#F5F5F5', width: '150px', padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', top: '3px', }} >
                                                        <svg width="47" height="36" style={{ fill: '#292929' }}>
                                                            <use href="#dp-initials" />
                                                        </svg>
                                                        <p style={{ marginTop: '38px', fontSize: '0.75rem' }}>ionHive</p>
                                                    </div>
                                                </th>
                                                <th style={{ width: '150px', padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', top: '3px', }}>
                                                        <img src="assets/img/mark-success.jpg" alt="other water purifier" style={{ height: '90px' }} loading="lazy" />
                                                        <p style={{ marginTop: '28px', fontSize: '0.75rem' }}>ionHive Advantage</p>
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ fontWeight: 'bold', color: '#00AEEF', fontSize: '0.875rem', padding: '20px', }} >SAFE Drinking Water</td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-x-circle" style={{ color: "red" }}></i>
                                                        <span>Unfit for drinking</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }} >
                                                        <i className="bi bi-exclamation-circle" style={{ color: "red" }}></i>
                                                        <span>Under or Over Purified Water</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F5F5F5', }} >
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-check2-circle" style={{ color: "#2c8a00" }}></i>
                                                        <span>Perfectly purified water</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <span>Pure & healthy drinking water</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ fontWeight: 'bold', color: '#00AEEF', fontSize: '0.875rem', padding: '20px', }} >MULTISTAGE Purification</td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-x-circle" style={{ color: "red" }}></i>
                                                        <span>Unknown process</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }} >
                                                        <i className="bi bi-exclamation-circle" style={{ color: "red" }}></i>
                                                        <span>Options Available At High Costs</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F5F5F5', }} >
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-check2-circle" style={{ color: "#2c8a00" }}></i>
                                                        <span>RO + UV with Copper or Alkaline filter</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <span>Advanced purification at best prices</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ fontWeight: 'bold', color: '#00AEEF', fontSize: '0.875rem', padding: '20px', }} >AFFORDABLE Prices</td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-x-circle" style={{ color: "red" }}></i>
                                                        <span>₹2 - ₹4/litre No maintenance</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }} >
                                                        <i className="bi bi-exclamation-circle" style={{ color: "red" }}></i>
                                                        <span>₹20,000 to purchase ₹5,000/year to maintain</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F5F5F5', }} >
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-check2-circle" style={{ color: "#2c8a00" }}></i>
                                                        <span>Starts at ₹1/litre FREE maintenance</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <span>ZERO upfront cost Lifetime FREE maintenance</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ fontWeight: 'bold', color: '#00AEEF', fontSize: '0.875rem', padding: '20px', }} >RELIABLE Service</td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-x-circle" style={{ color: "red" }}></i>
                                                        <span>Hassle to order, replace, transport</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }} >
                                                        <i className="bi bi-exclamation-circle" style={{ color: "red" }}></i>
                                                        <span>Manual coordination</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F5F5F5', }} >
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-check2-circle" style={{ color: "#2c8a00" }}></i>
                                                        <span>App for easy recharge & service requests</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <span>Tech-enabled service</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ fontWeight: 'bold', color: '#00AEEF', fontSize: '0.875rem', padding: '20px', }} >TECH Enabled Features</td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-x-circle" style={{ color: "red" }}></i>
                                                        <span>NA</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }} >
                                                        <i className="bi bi-exclamation-circle" style={{ color: "red" }}></i>
                                                        <span>NA</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F5F5F5', }} >
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-check2-circle" style={{ color: "#2c8a00" }}></i>
                                                        <span>One-click tracking of consumption, water quality & filter health</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <span>IoT enabled SMART purifiers</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </section>
                    {/* <!-- /Stats Section --> */}

                </section>
                {/* <!-- End Advantage Section --> */}


                {/* <!-- Features 2 Section --> */}
                <section id="how-it-works" className="features-2 section">

                    {/* <!-- Section Title --> */}
                    <div className="container section-title" data-aos="fade-up">
                        <h2>The ionHive Experience: Simple, Smart & Seamless</h2>
                        <p>
                            Get started with ionHive in just a few easy steps. Buy your purifier, install our app,
                            and enjoy 24/7 access to live water quality, order history, payments, and more — all from your phone.
                        </p>
                        <h3 style={{ paddingTop: '20px' }}>How it works</h3>
                    </div>
                    {/* <!-- End Section Title --> */}

                    <div className="container" data-aos="fade-up" data-aos-delay="100">

                        <div className="row align-items-center">

                            <div className="col-lg-4">

                                <div className="feature-item text-end mb-5" data-aos="fade-right" data-aos-delay="200">
                                    <div className="d-flex align-items-center justify-content-end gap-4">
                                        <div className="feature-content">
                                            <h3>Step 1:</h3>
                                            <p>Purchase your ionHive Water Purifier from our website</p>
                                        </div>
                                        <div className="feature-icon flex-shrink-0">
                                            <i className="bi bi-laptop"></i>
                                        </div>
                                    </div>
                                </div>
                                {/* <!-- End .feature-item --> */}

                                <div className="feature-item text-end mb-5" data-aos="fade-right" data-aos-delay="300">
                                    <div className="d-flex align-items-center justify-content-end gap-4">
                                        <div className="feature-content">
                                            <h3>Step 2:</h3>
                                            <p>Download the ionHive App from Google Play / App Store</p>
                                        </div>
                                        <div className="feature-icon flex-shrink-0">
                                            <i className="bi bi-calendar-check"></i>
                                        </div>
                                    </div>
                                </div>
                                {/* <!-- End .feature-item --> */}

                                <div className="feature-item text-end" data-aos="fade-right" data-aos-delay="400">
                                    <div className="d-flex align-items-center justify-content-end gap-4">
                                        <div className="feature-content">
                                            <h3>Step 3:</h3>
                                            <p>Login & connect your purifier to the app</p>
                                        </div>
                                        <div className="feature-icon flex-shrink-0">
                                            <i className="bi bi-file-earmark-text"></i>
                                        </div>
                                    </div>
                                </div>
                                {/* <!-- End .feature-item --> */}

                            </div>

                            <div className="col-lg-4" data-aos="zoom-in" data-aos-delay="200">
                                <div className="phone-mockup text-center">
                                    <img src="assets/img/phone-app-screen.webp" alt="Phone Mockup" className="img-fluid" />
                                </div>
                            </div>
                            {/* <!-- End Phone Mockup --> */}

                            <div className="col-lg-4">

                                <div className="feature-item mb-5" data-aos="fade-left" data-aos-delay="200">
                                    <div className="d-flex align-items-center gap-4">
                                        <div className="feature-icon flex-shrink-0">
                                            <i className="bi bi-currency-rupee"></i>
                                        </div>
                                        <div className="feature-content">
                                            <h3>Step 4:</h3>
                                            <p>Access live purifier data & water quality</p>
                                        </div>
                                    </div>
                                </div>
                                {/* <!-- End .feature-item --> */}

                                <div className="feature-item mb-5" data-aos="fade-left" data-aos-delay="300">
                                    <div className="d-flex align-items-center gap-4">
                                        <div className="feature-icon flex-shrink-0">
                                            <i className="bi bi-clock"></i>
                                        </div>
                                        <div className="feature-content">
                                            <h3>Step 5:</h3>
                                            <p>Track order history & payments anytime</p>
                                        </div>
                                    </div>
                                </div>
                                {/* <!-- End .feature-item --> */}

                                <div className="feature-item" data-aos="fade-left" data-aos-delay="400">
                                    <div className="d-flex align-items-center gap-4">
                                        <div className="feature-icon flex-shrink-0">
                                            <i className="bi  bi-phone"></i>
                                        </div>
                                        <div className="feature-content">
                                            <h3>Step 6:</h3>
                                            <p>Enjoy smart, hassle-free water purification!</p>
                                        </div>
                                    </div>
                                </div>
                                {/* <!-- End .feature-item --> */}
                            </div>

                            <div className="container text-center" style={{ marginTop: "20px" }}>
                                <div
                                    className="d-flex justify-content-center align-items-center"
                                    style={{ gap: "40px" }} // Adjust this value to control space
                                >
                                    {/* Play Store QR */}
                                    <div className="phone-mockup text-center">
                                        <img
                                            src="assets/img/water_playStore.png"
                                            alt="Google Play QR"
                                            style={getStyle("play")}
                                            onMouseEnter={() => setHoveredQR("play")}
                                            onMouseLeave={() => setHoveredQR(null)}
                                        />
                                        <p style={{ marginTop: "10px" }}>Google Play Store Scan to Download</p>
                                    </div>

                                    {/* App Store QR */}
                                    <div className="phone-mockup text-center">
                                        <img
                                            src="assets/img/water_appStore.png"
                                            alt="App Store QR"
                                            style={getStyle("app")}
                                            onMouseEnter={() => setHoveredQR("app")}
                                            onMouseLeave={() => setHoveredQR(null)}
                                        />
                                        <p style={{ marginTop: "10px" }}>App Store Scan to Download</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
                {/* <!-- /Features 2 Section --> */}

                {/* <!-- Faq Section --> */}
                <section className="faq-9 faq section light-background" id="faq">
                    <div className="container">
                        <div className="row">

                            <div className="col-lg-5" data-aos="fade-up">
                                <h2 className="faq-title">Frequently asked questions</h2>
                                <div className="faq-arrow d-none d-lg-block" data-aos="fade-up" data-aos-delay="200">
                                    <svg className="faq-arrow" width="200" height="211" viewBox="0 0 200 211" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M198.804 194.488C189.279 189.596 179.529 185.52 169.407 182.07L169.384 182.049C169.227 181.994 169.07 181.939 168.912 181.884C166.669 181.139 165.906 184.546 167.669 185.615C174.053 189.473 182.761 191.837 189.146 195.695C156.603 195.912 119.781 196.591 91.266 179.049C62.5221 161.368 48.1094 130.695 56.934 98.891C84.5539 98.7247 112.556 84.0176 129.508 62.667C136.396 53.9724 146.193 35.1448 129.773 30.2717C114.292 25.6624 93.7109 41.8875 83.1971 51.3147C70.1109 63.039 59.63 78.433 54.2039 95.0087C52.1221 94.9842 50.0776 94.8683 48.0703 94.6608C30.1803 92.8027 11.2197 83.6338 5.44902 65.1074C-1.88449 41.5699 14.4994 19.0183 27.9202 1.56641C28.6411 0.625793 27.2862 -0.561638 26.5419 0.358501C13.4588 16.4098 -0.221091 34.5242 0.896608 56.5659C1.8218 74.6941 14.221 87.9401 30.4121 94.2058C37.7076 97.0203 45.3454 98.5003 53.0334 98.8449C47.8679 117.532 49.2961 137.487 60.7729 155.283C87.7615 197.081 139.616 201.147 184.786 201.155L174.332 206.827C172.119 208.033 174.345 211.287 176.537 210.105C182.06 207.125 187.582 204.122 193.084 201.144C193.346 201.147 195.161 199.887 195.423 199.868C197.08 198.548 193.084 201.144 195.528 199.81C196.688 199.192 197.846 198.552 199.006 197.935C200.397 197.167 200.007 195.087 198.804 194.488ZM60.8213 88.0427C67.6894 72.648 78.8538 59.1566 92.1207 49.0388C98.8475 43.9065 106.334 39.2953 114.188 36.1439C117.295 34.8947 120.798 33.6609 124.168 33.635C134.365 33.5511 136.354 42.9911 132.638 51.031C120.47 77.4222 86.8639 93.9837 58.0983 94.9666C58.8971 92.6666 59.783 90.3603 60.8213 88.0427Z" fill="currentColor"></path>
                                    </svg>
                                </div>
                            </div>

                            <div className="col-lg-7" data-aos="fade-up" data-aos-delay="300">
                                <div className="faq-container">
                                    {faqs.map((faq, index) => (
                                        <div
                                            key={index}
                                            className={`faq-item ${activeIndex === index ? 'faq-active' : ''}`}
                                            onClick={() => handleToggle(index)}
                                        >
                                            <h3>{faq.question}</h3>
                                            <div className="faq-content" style={{ display: activeIndex === index ? 'block' : 'none' }}>
                                                <p>{faq.answer}</p>
                                            </div>
                                            <i className={`faq-toggle bi ${activeIndex === index ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
                {/* <!-- /Faq Section --> */}

                {/* <!-- City Section --> */}
                <section id="contact" className="contact section light-background">
                    <div
                        className="container section-title"
                        data-aos="fade-up"
                        style={{ paddingBottom: "0px" }}
                    >
                        <h2>Cities We Are Present In</h2>
                    </div>

                    <div
                        className="container"
                        data-aos="fade-up"
                        data-aos-delay="100"
                    >
                        {(() => {
                            // Build dynamic state name map
                            const stateNameMap = {};
                            const indianStates = State.getStatesOfCountry("IN");
                            indianStates.forEach((s) => {
                                stateNameMap[s.isoCode.toUpperCase()] = s.name;
                            });

                            // Group districts by state
                            const grouped = districts.reduce((acc, item) => {
                                let state = item.state?.trim() || "Unknown";
                                const upper = state.toUpperCase();
                                if (stateNameMap[upper]) state = stateNameMap[upper];

                                if (!acc[state]) acc[state] = [];
                                acc[state].push(item.district);
                                return acc;
                            }, {});

                            const stateEntries = Object.entries(grouped).sort((a, b) =>
                                a[0].localeCompare(b[0])
                            );

                            const columnStyle = {
                                flex: "1 1 280px",
                                minWidth: "280px",
                                textAlign: "center",
                                background: "rgba(13,110,253,0.03)",
                                borderRadius: "12px",
                                padding: "20px",
                                boxShadow: "0 0 8px rgba(13,110,253,0.15)",
                            };

                            const stateTitleStyle = {
                                fontWeight: "bold",
                                fontSize: "18px",
                                color: "#0d6efd",
                                borderBottom: "2px solid #0d6efd",
                                paddingBottom: "5px",
                                marginBottom: "10px",
                            };

                            const pStyle = {
                                margin: "6px 0",
                                padding: "6px",
                                borderRadius: "8px",
                                transition: "all 0.3s ease",
                                backgroundColor: "rgba(13,110,253,0.05)",
                                cursor: "default",
                            };

                            // Split stateEntries into chunks of 3 with padding for last row
                            const rows = [];
                            for (let i = 0; i < stateEntries.length; i += 3) {
                                const chunk = stateEntries.slice(i, i + 3);
                                while (chunk.length < 3) {
                                    chunk.push(null); // Pad with nulls to keep 3 columns
                                }
                                rows.push(chunk);
                            }

                            return rows.map((row, rowIndex) => (
                                <div
                                    key={`row-${rowIndex}`}
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        gap: "40px",
                                        marginBottom: "30px",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {row.map((entry, colIndex) => {
                                        if (!entry) {
                                            // Empty column to maintain layout
                                            return (
                                                <div
                                                    key={`empty-${rowIndex}-${colIndex}`}
                                                    style={{ flex: "1 1 280px", minWidth: "280px" }}
                                                />
                                            );
                                        }

                                        const [state, cityList] = entry;
                                        return (
                                            <div key={`state-${rowIndex}-${colIndex}`} style={columnStyle}>
                                                <div className="footer-contact pt-3">
                                                    <h4 style={stateTitleStyle}>{state}</h4>
                                                    {cityList.map((city, j) => (
                                                        <p
                                                            key={`city-${rowIndex}-${colIndex}-${j}`}
                                                            style={pStyle}
                                                            onMouseEnter={(e) =>
                                                            (e.currentTarget.style.backgroundColor =
                                                                "rgba(13,110,253,0.15)")
                                                            }
                                                            onMouseLeave={(e) =>
                                                            (e.currentTarget.style.backgroundColor =
                                                                "rgba(13,110,253,0.05)")
                                                            }
                                                        >
                                                            {city}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ));
                        })()}
                    </div>
                </section>
                {/* <!-- /City Section --> */}

                {/* <!-- Contact Section --> */}
                <section id="contact" className="contact section light-background">

                    {/* <!-- Section Title --> */}
                    <div className="container section-title" data-aos="fade-up">
                        <h2>Contact</h2>
                        <p>Speak to a water-wellness expert today</p>
                    </div>
                    {/* <!-- End Section Title --> */}

                    <div className="container" data-aos="fade-up" data-aos-delay="100">

                        <div className="row g-4 g-lg-5">
                            <div className="col-lg-5">
                                <div className="info-box" data-aos="fade-up" data-aos-delay="200">
                                    <h3>Contact Info</h3>

                                    <div className="info-item" data-aos="fade-up" data-aos-delay="300">
                                        <div className="icon-box">
                                            <i className="bi bi-geo-alt"></i>
                                        </div>
                                        <div className="content">
                                            <h4>Our Location</h4>
                                            <p>Outdid Unified Private Limited,</p>
                                            <p>2nd Floor, Indian Water Works Association, 10(P),</p>
                                            <p>7th Main Road, BTM Layout, 2nd Stage,</p>
                                            <p>MICO HBCS(1st Stage), Bangalore-560076.</p>
                                        </div>
                                    </div>

                                    <div className="info-item" data-aos="fade-up" data-aos-delay="400">
                                        <div className="icon-box">
                                            <i className="bi bi-telephone"></i>
                                        </div>
                                        <div className="content">
                                            <h4>Phone Number</h4>
                                            <p>+91 80959 45298</p>
                                        </div>
                                    </div>

                                    <div className="info-item" data-aos="fade-up" data-aos-delay="500">
                                        <div className="icon-box">
                                            <i className="bi bi-envelope"></i>
                                        </div>
                                        <div className="content">
                                            <h4>Email Address</h4>
                                            <p>info@outdidunified.com</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-7">
                                <div className="contact-form" data-aos="fade-up" data-aos-delay="300">
                                    <h3>Get In Touch</h3>
                                    <p>How Can We Assist You Today?</p>

                                    <form className="php-email-form" onSubmit={handleSubmits}>
                                        <div className="row gy-4">
                                            <div className="col-md-6">
                                                <input type="text" name="name" className="form-control" placeholder="Your Name" required value={formData.name}
                                                    onChange={(e) => {
                                                        if (/^[a-zA-Z\s]*$/.test(e.target.value)) handleChange(e);
                                                    }}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <input type="email" name="email" className="form-control" placeholder="Your Email" required
                                                    value={formData.email}
                                                    onChange={(e) =>
                                                        handleChange({
                                                            target: {
                                                                name: 'email',
                                                                value: sanitizeEmail(e.target.value),
                                                            },
                                                        })
                                                    }
                                                />
                                            </div>

                                            <div className="col-12">
                                                <input type="text" name="subject" className="form-control" placeholder="Subject" required value={formData.subject} onChange={handleChange} />
                                            </div>

                                            <div className="col-12">
                                                <textarea name="message" rows="6" className="form-control" placeholder="Message" required value={formData.message} onChange={handleChange}></textarea>
                                            </div>

                                            <div className="col-12 text-center">
                                                <button type="submit" className="btn">Send Message</button>
                                            </div>
                                        </div>
                                    </form>

                                </div>
                            </div>

                        </div>

                    </div>

                </section>
                {/* <!-- /Contact Section --> */}
            </main>
            {/* Footer */}
            < Footer />
        </div>
    );
};

export default Home;
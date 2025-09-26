import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Swal from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProductList = ({ userInfo, token, handleLogout }) => {

    const [products, setProducts] = useState([]);
    const [selectedModelIndex, setSelectedModelIndex] = useState(0);
    const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
    const [selectedDurationIndex, setSelectedDurationIndex] = useState(0);

    const [loading, setLoading] = useState(true); // optional for loading UI
    const [error, setError] = useState(null);     // optional for error handling

    console.log(products, 'products...')
    console.log(loading, 'loading...')
    console.log(error, 'error...')

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('/api/website/products/productswithplan');
                const productArray = response.data?.data || [];
                const filteredProducts = productArray.filter(
                    (product) =>
                        parseInt(product.wp_device_quantity || "0", 10) > 0 &&
                        product.status === true
                );

                setProducts(filteredProducts);

                // setProducts(productArray);
            } catch (err) {
                setError(err.message || 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);


    const navigate = useNavigate();

    const heroRef = useRef(null);

    useEffect(() => {
        // Scroll to the hero section when the page loads
        heroRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    {/* Sub model */ }
    const [showModal, setShowModal] = useState(false);

    const handleSubscribeClick = () => {
        if (userInfo?.email) {
            setShowModal(true); // Open subscribe modal
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
                    navigate('/auth'); // Go to login page
                }
            });
        }
    };

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [emailID, setEmailID] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [city, setCity] = useState("Bangalore");
    const [pincode, setPincode] = useState("");
    const [subLoading, setSubLoading] = useState(false);

    const RAZORPAY_KEY = "rzp_test_oHoZ3Q1fF6pYEI";

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation regex
        const phoneRegex = /^[1-9][0-9]{9}$/;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!phoneRegex.test(phone)) {
            return Swal.fire({
                icon: 'error',
                title: 'Invalid Phone Number',
                text: 'Phone number must be 10 digits and not start with 0.'
            });
        }

        if (!emailRegex.test(emailID)) {
            return Swal.fire({
                icon: 'error',
                title: 'Invalid Email ID',
                text: 'Please enter a valid email address.'
            });
        }

        const selectedProduct = products[selectedModelIndex];
        const selectedPlan = selectedProduct?.plans[selectedPlanIndex];
        const selectedDuration = selectedProduct?.duration[selectedDurationIndex];

        if (!selectedProduct || !selectedPlan || !selectedDuration) {
            return Swal.fire({
                icon: 'error',
                title: 'Selection Missing',
                text: 'Please make sure a model, plan, and duration are selected.'
            });
        }

        setSubLoading(true);

        try {
            // Price calculation
            const basePrice = selectedPlan?.price || 0;
            const gstRate = selectedDuration?.gst || 0;
            const discountRate = selectedDuration?.discount || 0;

            const gstAmount = (basePrice * gstRate) / 100;
            const priceWithGST = basePrice + gstAmount;
            const discountAmount = (priceWithGST * discountRate) / 100;
            const finalMonthlyPrice = priceWithGST - discountAmount;

            const durationDays = parseInt(selectedDuration?.duration_time_limit?.replace(/[^\d]/g, ""), 10) || 0;
            const perDayPrice = finalMonthlyPrice / 28;
            const grandTotal = parseFloat((perDayPrice * durationDays).toFixed(2));
            const securityDeposit = !userInfo?.security_deposit ? selectedDuration?.security_deposit || 0 : 0;
            const grandTotalWithDeposit = parseFloat((grandTotal + securityDeposit).toFixed(2));

            // Prepare payload with proper data types
            const payload = {
                productModelId: selectedProduct._id,
                selectedPlanId: selectedPlan?.plans_id || 0, // prefer plans_id number
                selectedDurationId: selectedDuration.duration_id,
                priceWithGST: parseFloat(priceWithGST.toFixed(2)),
                gstAmount: parseFloat(gstAmount.toFixed(2)),
                discountAmount: parseFloat(discountAmount.toFixed(2)),
                finalMonthlyPrice: parseFloat(finalMonthlyPrice.toFixed(2)),
                grandTotal: grandTotalWithDeposit,
                securityDeposit,
                deliveryAddress: {
                    name,
                    phone: phone.trim(), // as string
                    addressLine1,
                    addressLine2,
                    pincode: pincode.trim(), // if string else parseInt
                    city,
                    email: emailID,
                }
            };

            const token = sessionStorage.getItem("WebToken");

            // Call order place API
            const res = await fetch("/api/website/orders/orderplace", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            console.log("Orderplace response:", data);

            if (data.status !== "success" || !data.data?.razorpayOrder?.id) {
                return Swal.fire("Error", data.message || "Order failed", "error");
            }

            // Razorpay payment options
            const options = {
                key: RAZORPAY_KEY,
                amount: data.data.razorpayOrder.amount,
                currency: "INR",
                order_id: data.data.razorpayOrder.id,
                name: "Subscription Payment",
                description: `Subscription for ${durationDays} days`,
                handler: async (response) => {
                    const verifyRes = await fetch("/api/website/orders/orderverify", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify(response),
                    });
                    const verifyData = await verifyRes.json();

                    if (verifyData.status && verifyData.status.toLowerCase() === "success") {
                        //  Swal.fire("Payment Successful", "Subscription activated!", "success").then(() => {
                        Swal.fire({
                            icon: "success",
                            title: "Payment Successful",
                            text: "Subscription activated!",
                            timer: 2000,
                            showConfirmButton: false
                        }).then(() => {
                            setShowModal(false);
                            setName("");
                            setPhone("");
                            setAddressLine1("");
                            setAddressLine2("");
                            setPincode("");
                            setEmailID("");
                            setCity("");
                            window.location.href = "/";
                        });
                    } else {
                        Swal.fire("Error", "Verification failed", "error");
                    }
                },
                modal: {
                    ondismiss: async () => {
                        await fetch("/api/website/orders/ordercancel", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({ reason: "User cancelled", orderId: data.data.orderId }),
                        });
                        Swal.fire("Payment Cancelled", "You cancelled the payment", "warning");
                    }
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

    const [mainImage, setMainImage] = useState("");
    useEffect(() => {
        if (products[selectedModelIndex]) {
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

    const slides = [
        {
            src: 'assets/img/IOT-1-cu-alive-production.webp',
            alt: 'Slide 1: IOT Enabled Water Purifier 1',
        },
        {
            src: 'assets/img/IOT-2-cu-alive-production.webp',
            alt: 'Slide 2: IOT Enabled Water Purifier 2',
        },
        {
            src: 'assets/img/IOT-3-cu-alive-production.webp',
            alt: 'Slide 3: IOT Enabled Water Purifier 3',
        },
    ];

    const [currentSlide, setCurrentSlide] = useState(0);
    const timeoutRef = useRef(null);

    useEffect(() => {
        const next = (currentSlide + 1) % slides.length;
        timeoutRef.current = setTimeout(() => {
            setCurrentSlide(next);
        }, 3000); // Change slide every 3 seconds

        return () => clearTimeout(timeoutRef.current);
    }, [currentSlide]);


    const indianCities = [
        "Bangalore", "Hyderabad", "Mumbai", "Delhi", "Chennai", "Kolkata", "Pune",
        "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore",
        "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad"
    ];

    // Call Request
    const [formDataCallRequest, setFormDataCallRequest] = useState({
        name: "",
        phone: "",
        city: "Bangalore",
    });

    const handleChangeCallRequest = (e) => {
        const { name, value } = e.target;

        if (name === "phone") {
            let phone = value.replace(/\D/g, ""); // Only digits
            if (phone.startsWith("0")) {
                phone = phone.substring(1); // Remove leading 0
            }
            if (phone.length > 10) {
                phone = phone.substring(0, 10); // Limit to 10 digits
            }
            setFormDataCallRequest({ ...formDataCallRequest, [name]: phone });
        } else {
            setFormDataCallRequest({ ...formDataCallRequest, [name]: value });
        }
    };

    const handleSubmitCallRequest = async (e) => {
        e.preventDefault();

        if (formDataCallRequest.phone.length !== 10) {
            Swal.fire("Error", "Phone number must be exactly 10 digits.", "error");
            return;
        }

        try {
            const response = await fetch(
                "/api/website/callRequest",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formDataCallRequest), // phone as string
                }
            );

            const result = await response.json();

            if (result.success) {
                Swal.fire("Success", result.message, "success");
                setFormDataCallRequest({ name: "", phone: "", city: "Bangalore" });
            } else {
                Swal.fire("Error", result.message || "Something went wrong.", "error");
            }
        } catch (error) {
            Swal.fire("Error", "Server error. Please try later.", "error");
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

    return (
        <div>

            {/* Header */}
            <Header userInfo={userInfo} handleLogout={handleLogout} />


            <main className="main" >

                {/* <!-- Features Section --> */}
                <section id="hero" className="hero section" ref={heroRef}>

                    {/* <!-- Section Title --> */}
                    <div className="container section-title" data-aos="fade-up">
                        <h2>Products That Fit Every Lifestyle And Budget</h2>
                        <p>Each of our smart water purifiers comes with advanced multi-stage purification and IoT technology.</p>
                    </div>
                    {/* <!-- End Section Title --> */}

                    {products.length > 0 ? (
                        <div className="container">

                            {/* === Model Tabs === */}
                            <div className="d-flex justify-content-center">
                                <ul className="nav nav-tabs">
                                    {products.map((product, index) => (
                                        <li key={product._id} className="nav-item">
                                            <button
                                                className={`nav-link ${selectedModelIndex === index ? 'active' : ''}`}
                                                onClick={() => {
                                                    setSelectedModelIndex(index);
                                                    setSelectedPlanIndex(0);
                                                    setSelectedDurationIndex(0);
                                                }}
                                            >
                                                <h4>{product.model_name}</h4>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* === Main Product Display === */}
                            <div className="tab-content">
                                <div className="tab-pane fade active show" style={{ padding: '20px' }}>
                                    <div className="container" data-aos="fade-up" >

                                        <div className="row gy-4">

                                            <div className="col-lg-3 col-md-6">
                                                <div className="stats-item text-center w-100 h-100">
                                                    <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> Multistage Universal Water purifier</p>
                                                </div>
                                            </div>
                                            {/* <!-- End Stats Item --> */}

                                            <div className="col-lg-3 col-md-6">
                                                <div className="stats-item text-center w-100 h-100">
                                                    <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> Goodness of copper</p>
                                                </div>
                                            </div>
                                            {/* <!-- End Stats Item --> */}

                                            <div className="col-lg-3 col-md-6">
                                                <div className="stats-item text-center w-100 h-100">
                                                    <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> RO Purification</p>
                                                </div>
                                            </div>
                                            {/* <!-- End Stats Item --> */}

                                            <div className="col-lg-3 col-md-6">
                                                <div className="stats-item text-center w-100 h-100">
                                                    <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> In-line UV purification</p>
                                                </div>
                                            </div>
                                            {/* <!-- End Stats Item --> */}

                                        </div>

                                    </div>

                                    <div className="row mt-4">

                                        {/* === Left Column === */}
                                        <div className="col-lg-6">
                                            <h3>Flexible Rental Plans</h3>
                                            <p className="fst-italic">
                                                Security deposit of ₹{products[selectedModelIndex].duration[selectedDurationIndex]?.security_deposit || 0} will be 100% refundable
                                            </p>

                                            {/* Step 1: Plans */}
                                            <h5>Step 1: Choose Monthly Plan</h5>
                                            <div className="d-flex flex-wrap gap-2 mb-3">
                                                {products[selectedModelIndex].plans.map((plan, planIndex) => (
                                                    <button
                                                        key={plan.plans_id}
                                                        className={`btn ${selectedPlanIndex === planIndex ? 'btn-primary' : 'btn-outline-primary'}`}
                                                        onClick={() => setSelectedPlanIndex(planIndex)}
                                                    >
                                                        {plan.label}<br />
                                                        <small>{plan.capacity}</small>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Step 2: Durations */}
                                            <h5>Step 2: Choose Duration</h5>
                                            <div className="d-flex flex-wrap gap-2 mb-3">
                                                {products[selectedModelIndex].duration.map((duration, durationIndex) => (
                                                    <button
                                                        key={duration.duration_id}
                                                        className={`btn ${selectedDurationIndex === durationIndex ? 'btn-primary' : 'btn-outline-primary'}`}
                                                        onClick={() => setSelectedDurationIndex(durationIndex)}
                                                    >
                                                        {duration.duration_time_limit}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* === Pricing Summary === */}
                                            <div className="mt-3 p-3 border rounded bg-light">
                                                {(() => {
                                                    const selectedPlan = products[selectedModelIndex].plans[selectedPlanIndex];
                                                    const selectedDuration = products[selectedModelIndex].duration[selectedDurationIndex];

                                                    const baseMonthlyPrice = selectedPlan?.price || 0;
                                                    const gstRate = selectedDuration?.gst || 0;
                                                    const discount = selectedDuration?.discount || 0;

                                                    // Safely parse duration_days from string like "360 days"
                                                    const durationTimeString = selectedDuration?.duration_time_limit || "0";
                                                    const durationDays = parseInt(durationTimeString.replace(/[^\d]/g, ""), 10) || 0;

                                                    const gstAmount = (baseMonthlyPrice * gstRate) / 100;
                                                    const priceWithGST = baseMonthlyPrice + gstAmount;
                                                    const discountAmount = (priceWithGST * discount) / 100;
                                                    const finalMonthlyPrice = priceWithGST - discountAmount;

                                                    const perDayPrice = finalMonthlyPrice / 28;
                                                    // const grandTotal = parseFloat((perDayPrice * durationDays).toFixed(2));
                                                    const grandTotal = parseFloat((perDayPrice * durationDays).toFixed(2));
                                                    const securityDeposit = !userInfo?.security_deposit ? selectedDuration?.security_deposit || 0 : 0;
                                                    const grandTotalWithDeposit = parseFloat((grandTotal + securityDeposit).toFixed(2));

                                                    return (
                                                        <>
                                                            {!userInfo?.security_deposit && (
                                                                <p className="fst-italic text-warning">
                                                                    First time order: ₹{products[selectedModelIndex].duration[selectedDurationIndex]?.security_deposit || 0} security deposit will be 100% refundable upon product return.
                                                                </p>
                                                            )}
                                                            {userInfo?.security_deposit && (
                                                                <div className="alert alert-info">
                                                                    You've already paid a security deposit. It won't be charged again.
                                                                </div>
                                                            )}


                                                            <p>Selected plan price (based on 28-day month): ₹{baseMonthlyPrice.toFixed(2)}</p>
                                                            <p>GST ({gstRate}%): ₹{gstAmount.toFixed(2)}</p>
                                                            <p>Price After GST: ₹{priceWithGST.toFixed(2)}</p>
                                                            <p>{discount}% discount, Savings of ₹{discountAmount.toFixed(2)}</p>

                                                            <p style={{ fontWeight: "bold" }}>
                                                                Final Price Per (based on 28-day month): ₹{finalMonthlyPrice.toFixed(2)}
                                                            </p>

                                                            {/* <p style={{ fontWeight: "bold" }}>
                                                                Per Day Price (based on 28-day month): ₹{perDayPrice.toFixed(2)}
                                                            </p> */}

                                                            <p style={{ fontWeight: "bold" }}>
                                                                Selected duration: {durationDays} days
                                                            </p>

                                                            <h5 style={{ color: "#0d83fd" }}>
                                                                {/* Grand Total: ₹{grandTotal}, */}
                                                                Grand Total: ₹{grandTotalWithDeposit}
                                                            </h5>

                                                            <div className="d-flex flex-wrap gap-2 mb-3">
                                                                <button
                                                                    className="btn btn-primary me-0 me-sm-2 mx-1"
                                                                    onClick={handleSubscribeClick}
                                                                >
                                                                    Subscribe Now
                                                                </button>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                        </div>

                                        {/* === Right Column: Main Image + Thumbnails === */}
                                        <div className="col-lg-6 order-1 order-lg-2 text-center">
                                            {/* Main Image */}
                                            <img
                                                src={`/upload/img/${mainImage || products[selectedModelIndex]?.main_img}`}
                                                alt="Main Product"
                                                className="img-fluid mb-3"
                                                style={{
                                                    boxShadow: 'rgb(0 111 255 / 72%) 0px 8px 15px',
                                                    borderRadius: '20px',
                                                    width: '450px',
                                                    height: '450px',
                                                    objectFit: 'cover',
                                                }}
                                            />

                                            {/* Thumbnails */}
                                            <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
                                                {/* Sub Images */}
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
                                                                height: "60px",
                                                                objectFit: "cover",
                                                                border: (mainImage === subImg) ? "2px solid #0d83fd" : "1px solid #ccc",
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() => setMainImage(subImg)}
                                                        />
                                                    ) : null;
                                                })}

                                                {/* Main Image Preview (clickable) */}
                                                {products[selectedModelIndex]?.main_img && (
                                                    <img
                                                        src={`/upload/img/${products[selectedModelIndex].main_img}`}
                                                        alt="Main Preview"
                                                        className="rounded"
                                                        style={{
                                                            width: "80px",
                                                            height: "60px",
                                                            objectFit: "cover",
                                                            border: (mainImage === products[selectedModelIndex].main_img) ? "2px solid #0d83fd" : "2px dashed #0d83fd",
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={() => setMainImage(products[selectedModelIndex].main_img)}
                                                    />
                                                )}
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



                    <div className="container">

                        <div className="d-flex justify-content-center">

                            {/* Subscribe model start */}
                            {/* Modal Component */}
                            <div className={`modal ${showModal ? "d-block" : "d-none"}`} tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                                <div className="modal-dialog">
                                    <div className="modal-content" style={{ marginTop: '30%' }}>
                                        <div className="modal-header" style={{ alignItems: 'center' }}>
                                            <h5 className="modal-title">Submit Your Details</h5>
                                            <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                        </div>
                                        <div className="modal-body">
                                            <form onSubmit={handleSubmit}>
                                                <div className="mb-3">
                                                    <label>Name</label>
                                                    <input type="text" className="form-control" required value={name}
                                                        // onChange={(e) => setName(e.target.value)}
                                                        onChange={(e) => {
                                                            if (/^[a-zA-Z\s]*$/.test(e.target.value)) setName(e.target.value);
                                                        }}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label>Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        className="form-control"
                                                        required
                                                        value={phone}
                                                        minLength={10}
                                                        maxLength={10}
                                                        onChange={(e) => {
                                                            let input = e.target.value.replace(/\D/g, ''); // Remove non-digits

                                                            // Prevent first digit from being 0–5
                                                            if (input.length === 1 && /^[0-5]$/.test(input)) {
                                                                input = ''; // Clear if first digit is 0–5
                                                            }

                                                            setPhone(input);
                                                        }}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label>Email ID</label>
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        required
                                                        value={emailID}
                                                        onChange={(e) => setEmailID(sanitizeEmail(e.target.value))}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label>Delivery Address Line 1</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        required
                                                        value={addressLine1}
                                                        onChange={(e) => setAddressLine1(e.target.value)}
                                                    />
                                                </div>

                                                <div className="mb-3">
                                                    <label>Delivery Address Line 2</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={addressLine2}
                                                        onChange={(e) => setAddressLine2(e.target.value)}
                                                    />
                                                </div>

                                                <div className="mb-3">
                                                    <label>Pin Code</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        required
                                                        minLength={6}
                                                        maxLength={6}
                                                        value={pincode}
                                                        onChange={(e) => {
                                                            let input = e.target.value.replace(/\D/g, '');
                                                            // Ensure first digit is not 0
                                                            if (input.length > 0 && input[0] === '0') {
                                                                input = input.substring(1);
                                                            }
                                                            if (input.length <= 6) setPincode(input);
                                                        }}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label>City</label>
                                                    <select
                                                        className="form-control"
                                                        value={city}
                                                        onChange={(e) => setCity(e.target.value)}
                                                    >
                                                        {indianCities.map((city) => (
                                                            <option key={city} value={city}>
                                                                {city}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

                                                    <p>
                                                        <i className="bi bi-check2-circle" style={{ color: '#0d83fd' }}></i> Lifetime Free Maintenance<br />
                                                        <i className="bi bi-check2-circle" style={{ color: '#0d83fd' }}></i> 7 Day Free Trial<br />
                                                        <i className="bi bi-check2-circle" style={{ color: '#0d83fd' }}></i> 48 Hours Installation
                                                    </p>

                                                    <button type="submit" className="btn btn-primary mb-2"> {subLoading ? "Processing..." : "Subscribe Now"}</button>

                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Subscribe model end */}

                        </div>

                    </div>

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
                <section id="features" className="features section" style={{ padding: '0px' }}>

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

                {/* <!-- Call To Action Section --> */}
                <section id="call-to-action" className="call-to-action section">

                    <div className="container" data-aos="fade-up" data-aos-delay="100">

                        <div className="row content justify-content-center align-items-center position-relative">
                            <div className="col-lg-8 mx-auto text-center">
                                <h2 className="display-4 mb-4">Start Your 7-Day Risk-Free Trial</h2>
                                <p className="mb-4">Trusted by a community of 1M+ accross 9 cities</p>
                                <div className="container" data-aos="fade-up" data-aos-delay="100" style={{ padding: '0px' }}>
                                    <div className="row g-4">
                                        <div className="col-lg-12">
                                            <div className="contact-form" data-aos="fade-up" data-aos-delay="300">
                                                <form onSubmit={handleSubmitCallRequest} method="post" className="php-email-form" data-aos="fade-up" data-aos-delay="200">
                                                    <div className="row gy-4">
                                                        <div className="col-md-6">
                                                            <input
                                                                type="text"
                                                                name="name"
                                                                className="form-control"
                                                                placeholder="Enter Your Name"
                                                                value={formDataCallRequest.name}
                                                                onChange={(e) => {
                                                                    if (/^[a-zA-Z\s]*$/.test(e.target.value)) handleChangeCallRequest(e);
                                                                }}
                                                                required
                                                            />
                                                        </div>

                                                        <div className="col-md-6">
                                                            <input
                                                                type="text"
                                                                name="phone"
                                                                className="form-control"
                                                                placeholder="Enter Your Phone"
                                                                value={formDataCallRequest.phone}
                                                                onChange={(e) => {
                                                                    let val = e.target.value.replace(/\D/g, ""); // only digits
                                                                    if (val.length === 1 && !/[6-9]/.test(val)) {
                                                                        val = ""; // remove invalid 1st digit
                                                                    }
                                                                    if (val.length > 10) {
                                                                        val = val.slice(0, 10); // max 10 digits
                                                                    }

                                                                    setFormDataCallRequest((prev) => ({
                                                                        ...prev,
                                                                        phone: val,
                                                                    }));
                                                                }}
                                                                required
                                                            />
                                                        </div>

                                                        <div className="col-md-6">
                                                            <select
                                                                className="form-control"
                                                                name="city"
                                                                value={formDataCallRequest.city}
                                                                onChange={handleChangeCallRequest}
                                                                required
                                                            >
                                                                <option value="">Select a city</option>
                                                                {indianCities.map((city) => (
                                                                    <option key={city} value={city}>
                                                                        {city}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="col-md-6">
                                                            <button type="submit" className="btn" style={{ backgroundColor: "#14ff10", borderRadius: "20px" }}>
                                                                Book Now
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>
                                                <p style={{ fontSize: '0.9rem', padding: '10px' }}>
                                                    By creating an account on  <strong>ionHive</strong>, you agree to our <a href="#" style={{ color: '#14ff10' }}>Terms of Use</a>
                                                </p>
                                            </div>
                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* <!-- Abstract Background Elements --> */}
                            <div className="shape shape-1">
                                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M47.1,-57.1C59.9,-45.6,68.5,-28.9,71.4,-10.9C74.2,7.1,71.3,26.3,61.5,41.1C51.7,55.9,35,66.2,16.9,69.2C-1.3,72.2,-21,67.8,-36.9,57.9C-52.8,48,-64.9,32.6,-69.1,15.1C-73.3,-2.4,-69.5,-22,-59.4,-37.1C-49.3,-52.2,-32.8,-62.9,-15.7,-64.9C1.5,-67,34.3,-68.5,47.1,-57.1Z" transform="translate(100 100)"></path>
                                </svg>
                            </div>

                            <div className="shape shape-2">
                                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M41.3,-49.1C54.4,-39.3,66.6,-27.2,71.1,-12.1C75.6,3,72.4,20.9,63.3,34.4C54.2,47.9,39.2,56.9,23.2,62.3C7.1,67.7,-10,69.4,-24.8,64.1C-39.7,58.8,-52.3,46.5,-60.1,31.5C-67.9,16.4,-70.9,-1.4,-66.3,-16.6C-61.8,-31.8,-49.7,-44.3,-36.3,-54C-22.9,-63.7,-8.2,-70.6,3.6,-75.1C15.4,-79.6,28.2,-58.9,41.3,-49.1Z" transform="translate(100 100)"></path>
                                </svg>
                            </div>

                            {/* <!-- Dot Pattern Groups --> */}
                            <div className="dots dots-1">
                                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                    <pattern id="dot-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <circle cx="2" cy="2" r="2" fill="currentColor"></circle>
                                    </pattern>
                                    <rect width="100" height="100" fill="url(#dot-pattern)"></rect>
                                </svg>
                            </div>

                            <div className="dots dots-2">
                                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                    <pattern id="dot-pattern-2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <circle cx="2" cy="2" r="2" fill="currentColor"></circle>
                                    </pattern>
                                    <rect width="100" height="100" fill="url(#dot-pattern-2)"></rect>
                                </svg>
                            </div>

                            <div className="shape shape-3">
                                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M43.3,-57.1C57.4,-46.5,71.1,-32.6,75.3,-16.2C79.5,0.2,74.2,19.1,65.1,35.3C56,51.5,43.1,65,27.4,71.7C11.7,78.4,-6.8,78.3,-23.9,72.4C-41,66.5,-56.7,54.8,-65.4,39.2C-74.1,23.6,-75.8,4,-71.7,-13.2C-67.6,-30.4,-57.7,-45.2,-44.3,-56.1C-30.9,-67,-15.5,-74,0.7,-74.9C16.8,-75.8,33.7,-70.7,43.3,-57.1Z" transform="translate(100 100)"></path>
                                </svg>
                            </div>
                        </div>

                    </div>

                </section>
                {/* <!-- /Call To Action Section --> */}

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

                    {/* <!-- Section Title --> */}
                    <div className="container section-title" data-aos="fade-up">
                        <h2>Cities We Are Present In</h2>
                    </div>
                    {/* <!-- End Section Title --> */}

                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="container footer-top">
                            <div className="row gy-4">
                                <div className="col-lg-4 col-md-6 footer-about">
                                    <a href="index.html" className="logo d-flex align-items-center">
                                        <span className="sitename">copper Water purifier</span>
                                    </a>
                                    <div className="footer-contact pt-3">
                                        <p>copper Water purifier in Bengaluru</p>
                                        <p>copper Water purifier in Hyderabad</p>
                                        <p>copper Water purifier in Delhi</p>
                                        <p>copper Water purifier in Gurgaon</p>
                                        <p>copper Water purifier in Ghaziabad</p>
                                        <p>copper Water purifier in Faridabad</p>
                                        <p>copper Water purifier in Noida</p>
                                        <p>copper Water purifier in Mumbai</p>
                                    </div>
                                </div>

                                <div className="col-lg-4 col-md-6 footer-about">
                                    <a href="index.html" className="logo d-flex align-items-center">
                                        <span className="sitename">RO+  Water Purifier</span>
                                    </a>
                                    <div className="footer-contact pt-3">
                                        <p>RO+ Water purifier in Bengaluru</p>
                                        <p>RO+ Water purifier in Hyderabad</p>
                                        <p>RO+ Water purifier in Delhi</p>
                                        <p>RO+ Water purifier in Gurgaon</p>
                                        <p>RO+ Water purifier in Ghaziabad</p>
                                        <p>RO+ Water purifier in Faridabad</p>
                                        <p>RO+ Water purifier in Noida</p>
                                        <p>RO+ Water purifier in Mumbai</p>
                                    </div>
                                </div>

                                <div className="col-lg-4 col-md-6 footer-about">
                                    <a href="index.html" className="logo d-flex align-items-center">
                                        <span className="sitename">alkaline Water Purifier</span>
                                    </a>
                                    <div className="footer-contact pt-3">
                                        <p>alkaline Water purifier in Bengaluru</p>
                                        <p>alkaline Water purifier in Hyderabad</p>
                                        <p>alkaline Water purifier in Delhi</p>
                                        <p>alkaline Water purifier in Gurgaon</p>
                                        <p>alkaline Water purifier in Ghaziabad</p>
                                        <p>alkaline Water purifier in Faridabad</p>
                                        <p>alkaline Water purifier in Noida</p>
                                        <p>alkaline Water purifier in Mumbai</p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </section>
                {/* <!-- /City Section --> */}

            </main>

            {/* Footer */}
            < Footer />
        </div>
    );
};

export default ProductList;
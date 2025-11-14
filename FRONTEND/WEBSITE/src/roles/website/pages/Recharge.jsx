import { useState, useEffect, useRef } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import Swal from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { State } from "country-state-city";
import { Modal, Button } from "react-bootstrap";

const Recharge = ({ userInfo, token, handleLogout }) => {
    const durationRef = useRef(null);
    const scrollRef = useRef(null);
    let scrollInterval;
    const [showSummaryModal, setShowSummaryModal] = useState(false);

    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [selectedModelIndex, setSelectedModelIndex] = useState(0);
    const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
    const [selectedDurationIndex, setSelectedDurationIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAllModels, setShowAllModels] = useState(false);
    const [selectedPaymentType, setSelectedPaymentType] = useState("online");
    const [subLoading, setSubLoading] = useState(false);

    const RAZORPAY_KEY = "rzp_test_oHoZ3Q1fF6pYEI";

    const hasFetched = useRef(false);

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            if (hasFetched.current) return; // Prevent duplicate calls
            hasFetched.current = true;
            setLoading(true);
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

    // Updated: Calculate price details (matches modal logic)
    const calculatePriceDetails = () => {
        if (!selectedDevice) return null;

        // Find product by model_id (correct logic)
        const selectedProduct = products.find(
            p => p.model_id === selectedDevice.model_id
        );

        if (!selectedProduct) return null;

        const selectedDuration = selectedProduct?.duration?.[selectedDurationIndex];
        const selectedPlan = selectedDuration?.plans?.[selectedPlanIndex];

        if (!selectedDuration || !selectedPlan) return null;

        // Base values
        const basePrice = Number(selectedPlan.price || 0);
        const gstRate = Number(selectedDuration.gst || 0);
        const discountRate = Number(selectedDuration.discount || 0);

        // Duration handling
        const durationText = selectedDuration.duration_time_limit || "28 days";
        const durationDays = parseInt(durationText.replace(/[^\d]/g, ""), 10) || 28;

        // Step 1: Apply discount
        const discountAmount = (basePrice * discountRate) / 100;
        const discountedPrice = basePrice - discountAmount;

        // Step 2: Apply GST on discounted price
        const gstAmount = (discountedPrice * gstRate) / 100;
        const subtotal = discountedPrice + gstAmount;

        // Step 3: Grand Total
        const grandTotal = subtotal;

        return {
            selectedProduct,
            selectedDuration,
            selectedPlan,

            basePrice,
            gstRate,
            discountRate,

            discountAmount,
            discountedPrice,
            gstAmount,
            priceWithGST: subtotal,
            subtotal,
            grandTotal,
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
            // Safe number helper
            const safeNum = (val) => Number(val || 0);

            // Base calculations
            const updatedGrandTotal = safeNum(priceDetails.grandTotal);

            // Base price = original plan price (before discount and GST)
            const basePrice = safeNum(priceDetails.basePrice);

            //  Construct Payload
            const payload = {

                productModelId: String(priceDetails.selectedProduct._id),
                selectedPlanId: Number(priceDetails.selectedPlan?.plans_id || 0),
                selectedDurationId: Number(priceDetails.selectedDuration?.duration_id || 0),

                price: basePrice.toFixed(2),
                gstRate: safeNum(priceDetails.gstRate),
                gstAmount: safeNum(priceDetails.gstAmount).toFixed(2),
                discountRate: safeNum(priceDetails.discountRate),
                discountAmount: safeNum(priceDetails.discountAmount).toFixed(2),
                priceWithGST: safeNum(priceDetails.priceWithGST).toFixed(2),
                subtotal: safeNum(priceDetails.subtotal).toFixed(2),
                discountedPrice: safeNum(priceDetails.discountedPrice).toFixed(2),
                grandTotal: updatedGrandTotal.toFixed(2),

                // Send Selected Device ID
                wp_device_id: selectedDevice?.deviceDetails?.wp_device_id
                    ? String(selectedDevice.deviceDetails.wp_device_id)
                    : "",

                // Send logged in user ID
                user_id: userInfo?.user_id || "",

                durationDays: safeNum(priceDetails.durationDays),
                paymentType,

                deliveryAddress: selectedDevice?.deliveryAddress || {}
            };

            const token = sessionStorage.getItem("WebToken");

            const res = await fetch("/api/website/orders/renewsubscription", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            console.log("Orderplace response:", data);

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
                                text: "Subscription renewed successfully!",
                                timer: 2000,
                                showConfirmButton: false,
                            }).then(() => {
                                setShowSummaryModal(false);
                                navigate("/");
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
                //  prefill: { name, email: emailID, contact: phone.trim() },
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

    // Dynamically build map using "country-state-city"
    const stateNameMap = {};
    const indianStates = State.getStatesOfCountry("IN"); // all states of India

    indianStates.forEach((s) => {
        // Example: { name: "Karnataka", isoCode: "KA" }
        stateNameMap[s.isoCode.toUpperCase()] = s.name;
    });

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        let autoScroll;
        let direction = 1;
        let isUserScrolling = false;
        let scrollTimeout;

        // --- Detect manual scroll ---
        const handleUserScroll = () => {
            isUserScrolling = true;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isUserScrolling = false;
            }, 2500); // resume auto-scroll after 2.5s of inactivity
        };

        // --- Auto scroll loop ---
        const startScroll = () => {
            autoScroll = setInterval(() => {
                if (!isUserScrolling) {
                    el.scrollLeft += 1.5 * direction;

                    // reverse direction on edges
                    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 5) direction = -1;
                    else if (el.scrollLeft <= 0) direction = 1;
                }
            }, 20); // small smooth interval
        };

        const stopScroll = () => clearInterval(autoScroll);

        startScroll();
        el.addEventListener("scroll", handleUserScroll);
        el.addEventListener("mouseenter", stopScroll);
        el.addEventListener("mouseleave", startScroll);

        return () => {
            clearInterval(autoScroll);
            el.removeEventListener("scroll", handleUserScroll);
            el.removeEventListener("mouseenter", stopScroll);
            el.removeEventListener("mouseleave", startScroll);
        };
    }, []);

    const [showBaseModelPopup, setShowBaseModelPopup] = useState(false);

    const handleModelSelect = (index) => {
        const model = filteredProducts[index];
        const product = filteredProducts.filter(p => p.model_type === "Smart")[index];
        setSelectedModelIndex(index);
        setSelectedPlanIndex(0);
        setSelectedDurationIndex(0);
        setSelectedDeviceIndex(null); // Reset device selection when model changes
        setMainImage(product.main_img); // set main image immediately

        if (model?.model_type === "Base") {
            setShowBaseModelPopup(true);
        }

        // scroll to plans
        // setTimeout(() => {
        //     durationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        // }, 100);
    };

    // Reference flag
    const hasFetchedOrders = useRef(false);

    // State to store received device list
    const [fetchedOrders, setFetchedOrders] = useState([]);
    const [loadingFetchedOrders, setLoadingFetchedOrders] = useState(true);
    const [errorFetchedOrders, setErrorFetchedOrders] = useState(null);

    console.log(products, 'products data')

    console.log(fetchedOrders, 'fetchedOrders data')
    // Fetch user devices orders
    useEffect(() => {
        // stop if already fetched or user not logged in
        if (hasFetchedOrders.current || !userInfo?.user_id) return;

        const fetchUserDevices = async () => {
            hasFetchedOrders.current = true;
            setLoadingFetchedOrders(true);

            try {
                const response = await axios.get(
                    `/api/website/orders/userdevices/${userInfo.user_id}`
                );

                const devicesObj = response.data?.devices || {};
                // Convert object to array
                const devicesArr = Object.keys(devicesObj).flatMap(model => devicesObj[model]);

                setFetchedOrders(devicesArr);
            } catch (err) {
                setErrorFetchedOrders(err.message || "Something went wrong");
            } finally {
                setLoadingFetchedOrders(false);
            }
        };

        fetchUserDevices();
    }, [userInfo]);

    // get models from orders
    const deviceModels = fetchedOrders?.map(item => item.model_name) || [];

    console.log(deviceModels, "deviceModels list");

    // filter products
    const filteredProducts = products?.filter(p =>
        deviceModels.includes(p.model_name)
    ) || [];

    console.log(filteredProducts, "matched models");

    // Group devices by model name
    const devicesByModel = fetchedOrders.reduce((acc, item) => {
        const model = item.model_name;
        if (!acc[model]) acc[model] = [];
        acc[model].push(item);
        return acc;
    }, {});

    const selectedModelName = filteredProducts[selectedModelIndex]?.model_name;
    const selectedModelDevices = devicesByModel[selectedModelName] || [];
    const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(null);
    const selectedDevice = selectedModelDevices?.[selectedDeviceIndex];

    // Get selected model_id from selected device
    const selectedModelId = selectedDevice?.model_id || null;

    // Match product from full products list using model_id
    const selectedProductByModelId = products.find(p => p.model_id === selectedModelId);

    // selectedDevice is defined
    const parseEndDate = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return isNaN(d) ? null : d;
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };

    // Use correct path
    const endDateStr = selectedDevice?.deviceDetails?.plan_config?.endDate;
    const expiry = parseEndDate(endDateStr);
    const now = new Date(); // Use full datetime comparison
    const isExpired = !expiry || now >= expiry;

    return (
        <div>

            {/* Header */}
            <Header userInfo={userInfo} handleLogout={handleLogout} />

            <main className="main">

                {/* <!-- Features Section --> */}
                <section id="hero" className="features section" style={{ marginTop: '5%' }}>
                    <div className="container section-title" data-aos="fade-up" style={{ paddingBottom: '0px' }}>
                        <h2>Products that fit every Lifestyle and Budget</h2>
                        <p>Each of our smart water purifiers comes with advanced multi-stage purification and IoT technology.</p>
                    </div>

                    {loading ? (
                        // Loading Spinner Section
                        <div className="container text-center my-5 py-5">
                            <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status"></div>
                            <p className="mt-3 fw-semibold text-primary">Loading products...</p>
                        </div>
                    ) : error ? (
                        // Error Section
                        <div className="container text-center my-5 py-5">
                            <h4 className="text-danger mb-3">Something went wrong...</h4>
                            <p>{error}</p>
                            <button
                                className="btn btn-outline-primary mt-3"
                                onClick={() => window.location.reload()}
                            >
                                Retry
                            </button>
                        </div>
                    ) :
                        products.length > 0 ? (
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
                                        {!showAllModels && (
                                            <div className="row mt-4 align-items-start">
                                                <div className="col-lg-6 col-12" style={{ padding: '20px' }}>
                                                    <div className="d-flex justify-content-center flex-column align-items-center section-title">
                                                        <div className="text-center mb-3">
                                                            <h2>Select Model</h2>
                                                        </div>
                                                        <ul className="nav nav-tabs flex-wrap" style={{ justifyContent: 'center' }}>
                                                            <li className="nav-item">
                                                                <button
                                                                    className={`nav-link text-center ${selectedModelIndex === -1 ? 'active' : ''}`}
                                                                    onClick={() => setShowAllModels(true)}
                                                                    style={{
                                                                        minWidth: '150px',
                                                                        margin: '5px',
                                                                        backgroundColor: selectedModelIndex === -1 ? '#0d6efd' : '#e8f1ff',
                                                                        color: selectedModelIndex === -1 ? '#fff' : '#0d6efd',
                                                                        border: '1px solid #0d6efd',
                                                                        borderRadius: '15px',
                                                                        fontWeight: '600',
                                                                        transition: 'all 0.3s ease'
                                                                    }}
                                                                >
                                                                    <h4 style={{ margin: 0, fontSize: '16px' }}>All Model's</h4>
                                                                </button>
                                                            </li>
                                                            {filteredProducts
                                                                .filter(product => product.model_type === "Smart")
                                                                .map((product, index) => {
                                                                    const isSelected = selectedModelIndex === index;
                                                                    return (
                                                                        <li key={product._id} className="nav-item">
                                                                            <button
                                                                                className={`nav-link text-center ${isSelected ? 'active' : ''}`}
                                                                                onClick={() => handleModelSelect(index)}
                                                                                style={{
                                                                                    minWidth: '150px',
                                                                                    margin: '5px',
                                                                                    backgroundColor: isSelected ? '#0d6efd' : '#e8f1ff',
                                                                                    color: isSelected ? '#fff' : '#0d6efd',
                                                                                    border: '1px solid #0d6efd',
                                                                                    borderRadius: '15px',
                                                                                    fontWeight: '600',
                                                                                    transition: 'all 0.3s ease'
                                                                                }}
                                                                            >
                                                                                <h4 style={{ margin: 0, fontSize: '16px' }}>
                                                                                    {product.model_name}
                                                                                </h4>
                                                                            </button>
                                                                        </li>
                                                                    );
                                                                })}

                                                            {selectedModelDevices.length > 0 && (
                                                                <div className="mt-3 text-center" style={{ padding: '10px' }}>
                                                                    <h5>Devices for {selectedModelName}</h5>
                                                                    <div className="d-flex flex-wrap justify-content-center gap-2 mt-2">
                                                                        {selectedModelDevices.map((device, i) => {
                                                                            const isDeviceActive = selectedDeviceIndex === i;
                                                                            return (
                                                                                <button
                                                                                    key={i}
                                                                                    className="btn"
                                                                                    onClick={() => {
                                                                                        setSelectedDeviceIndex(i);
                                                                                        setSelectedPlanIndex(0);
                                                                                        setSelectedDurationIndex(0);
                                                                                        setTimeout(() => {
                                                                                            durationRef.current?.scrollIntoView({
                                                                                                behavior: "smooth",
                                                                                                block: "start"
                                                                                            });
                                                                                        }, 500);
                                                                                    }}
                                                                                    style={{
                                                                                        minWidth: '150px',
                                                                                        margin: '5px',
                                                                                        backgroundColor: isDeviceActive ? '#0d6efd' : '#e8f1ff',
                                                                                        color: isDeviceActive ? '#fff' : '#0d6efd',
                                                                                        border: '1px solid #0d6efd',
                                                                                        borderRadius: '15px',
                                                                                        fontWeight: '600',
                                                                                        transition: 'all 0.3s ease'
                                                                                    }}
                                                                                >
                                                                                    {device.deviceId}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>

                                                <div className="col-lg-6 col-12 text-center" style={{ padding: '20px' }}>
                                                    {selectedProductByModelId?.main_img ? (
                                                        <img
                                                            src={`/upload/img/${selectedProductByModelId.main_img}`}
                                                            alt={selectedProductByModelId.model_name || "Product"}
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
                                                    ) : (
                                                        <div className="text-muted py-5" style={{ marginTop: '20%' }}><h4>Select a model device to view image</h4></div>
                                                    )}

                                                    <div className="d-flex justify-content-center align-items-center flex-wrap gap-3 mt-3">
                                                        {[1, 2, 3, 4].map((num) => {
                                                            const subImg = selectedProductByModelId?.[`sub_img_${num}`];
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

                                                        {selectedProductByModelId?.main_img && (
                                                            <img
                                                                src={`/upload/img/${selectedProductByModelId.main_img}`}
                                                                alt="Main Preview"
                                                                className="rounded"
                                                                style={{
                                                                    width: "80px",
                                                                    height: "80px",
                                                                    objectFit: "cover",
                                                                    border: mainImage === selectedProductByModelId.main_img
                                                                        ? "2px solid #0d83fd"
                                                                        : "2px dashed #0d83fd",
                                                                    cursor: "pointer",
                                                                }}
                                                                onClick={() => setMainImage(selectedProductByModelId.main_img)}
                                                            />
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
                                        )}

                                        {/* === Popup Modal for Base Model === */}
                                        <Modal show={showBaseModelPopup} onHide={() => setShowBaseModelPopup(false)} centered style={{
                                            border: "2px solid #0d6efd",
                                            borderRadius: "12px",
                                            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                                        }}>
                                            <Modal.Header closeButton style={{ backgroundColor: "aliceblue" }}>
                                                <Modal.Title style={{ color: '#0d6efd' }}>Base Model Information</Modal.Title>
                                            </Modal.Header>
                                            <Modal.Body>
                                                <p>
                                                    This is our <b>Base Model</b> water purifier device. Once you buy this device, our
                                                    service team will install it for you.
                                                </p>
                                                <p className="mb-2">
                                                    Please note that the app <b>does not provide live data</b> or remote access for this base
                                                    model.
                                                </p>
                                                <p>
                                                    For any <b>plan renewals</b> or <b>service requests</b>, please contact our seller
                                                    support team directly.
                                                </p>
                                            </Modal.Body>
                                            <Modal.Footer style={{ backgroundColor: "aliceblue" }}>
                                                <Button variant="secondary" onClick={() => setShowBaseModelPopup(false)}>
                                                    Cancel
                                                </Button>
                                                <Button variant="primary" onClick={() => setShowBaseModelPopup(false)}>
                                                    OK, Got It
                                                </Button>
                                            </Modal.Footer>
                                        </Modal>

                                        {showAllModels && (
                                            <div className="row" style={{ padding: '20px' }}>
                                                <div className="section-title text-center" style={{ paddingBottom: '10px' }}>
                                                    <h2>Select Model</h2>
                                                    <ul className="nav flex-wrap" style={{ justifyContent: 'center' }}>
                                                        <li className="nav-item">
                                                            <button
                                                                className={`nav-link text-center ${selectedModelIndex === -1 ? 'active' : ''}`}
                                                                onClick={() => setShowAllModels(false)}
                                                                style={{
                                                                    minWidth: '150px',
                                                                    margin: '5px',
                                                                    backgroundColor: selectedModelIndex === -1 ? '#0d6efd' : '#e8f1ff',
                                                                    color: selectedModelIndex === -1 ? '#fff' : '#0d6efd',
                                                                    border: '1px solid #0d6efd',
                                                                    borderRadius: '15px',
                                                                    fontWeight: '600',
                                                                    transition: 'all 0.3s ease'
                                                                }}
                                                            >
                                                                <h4 style={{ margin: 0, fontSize: '16px' }}>Back Model's</h4>
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </div>

                                                {/* Left Column – Select Model */}
                                                <div className="col-lg-6 col-12 text-center">

                                                    <div ref={scrollRef}
                                                        className="d-flex overflow-auto py-3"
                                                        style={{
                                                            padding: '10px',
                                                            gap: "20px",
                                                            scrollBehavior: "smooth",
                                                            cursor: "grab",
                                                            scrollSnapType: "x mandatory",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {filteredProducts
                                                            .filter(product => product.model_type === "Smart")
                                                            .map((product, index) => {
                                                                const isSelected = selectedModelIndex === index;
                                                                return (
                                                                    <div
                                                                        key={product._id}
                                                                        className="card text-center flex-shrink-0"
                                                                        style={{
                                                                            width: "220px",
                                                                            borderRadius: "20px",
                                                                            border: isSelected ? "3px solid #0d6efd" : "1px solid #ddd",
                                                                            boxShadow: isSelected
                                                                                ? "0 0 20px rgba(13,110,253,0.3)"
                                                                                : "0 2px 8px rgba(0,0,0,0.1)",
                                                                            transform: isSelected ? "scale(1.05)" : "scale(1)",
                                                                            transition: "all 0.3s",
                                                                            cursor: "pointer",
                                                                            scrollSnapAlign: "center",
                                                                        }}
                                                                        onClick={() => {
                                                                            setSelectedModelIndex(index);
                                                                            handleModelSelect(index);
                                                                            setSelectedPlanIndex(0);
                                                                            setSelectedDurationIndex(0);
                                                                            setMainImage(product.main_img);
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={`/upload/img/${product.main_img}`}
                                                                            alt={product.model_name}
                                                                            className="card-img-top"
                                                                            style={{
                                                                                height: "160px",
                                                                                objectFit: "contain",
                                                                                borderTopLeftRadius: "20px",
                                                                                borderTopRightRadius: "20px",
                                                                            }}
                                                                        />

                                                                        <div className="card-body p-2">
                                                                            <h6
                                                                                style={{
                                                                                    color: isSelected ? "#0d6efd" : "#000",
                                                                                    fontWeight: "600",
                                                                                    fontSize: "14px",
                                                                                    marginBottom: 0,
                                                                                }}
                                                                            >
                                                                                {product.model_name}
                                                                            </h6>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </div>

                                                {/* Right Column – Devices for Selected Model */}
                                                <div className="col-lg-6 col-12 text-center">
                                                    {selectedModelDevices.length > 0 ? (
                                                        <>
                                                            <h5>Devices for {selectedModelName}</h5>
                                                            <div className="d-flex flex-wrap justify-content-center gap-2 mt-2">
                                                                {selectedModelDevices.map((device, i) => {
                                                                    const isActive = selectedDeviceIndex === i;

                                                                    return (
                                                                        <button
                                                                            key={i}
                                                                            className="btn"
                                                                            style={{
                                                                                minWidth: "150px",
                                                                                margin: "5px",
                                                                                backgroundColor: isActive ? "#0d6efd" : "#e8f1ff",
                                                                                color: isActive ? "#fff" : "#0d6efd",
                                                                                border: "1px solid #0d6efd",
                                                                                borderRadius: "15px",
                                                                                fontWeight: 600,
                                                                            }}
                                                                            onClick={() => {
                                                                                setSelectedDeviceIndex(i);
                                                                                setSelectedPlanIndex(0);
                                                                                setSelectedDurationIndex(0);
                                                                                setTimeout(() => {
                                                                                    durationRef.current?.scrollIntoView({ behavior: "smooth" });
                                                                                }, 100);
                                                                            }}
                                                                        >
                                                                            {device.deviceId}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p className="mt-3" style={{ fontWeight: 600 }}>No devices assigned to this model</p>
                                                    )}
                                                </div>

                                            </div>

                                        )}

                                        <div ref={durationRef}>
                                            <div className="row mt-4">
                                                <div className="col-lg-12">
                                                    <div style={{ textAlign: "center" }}>
                                                        <h2 style={{ paddingTop: '20px' }}>Flexible Recharge Rental Plans</h2>
                                                        <div
                                                            style={{
                                                                width: "50px",
                                                                height: "3px",
                                                                backgroundColor: "#0d6efd",
                                                                borderRadius: "2px",
                                                                margin: "10px auto 0 auto",
                                                            }}
                                                        ></div>
                                                        <h5 style={{ paddingTop: '30px' }}>Choose Duration</h5>

                                                        <div className="d-flex flex-wrap gap-2 mb-3 justify-content-center">
                                                            {selectedProductByModelId?.duration?.map((duration, index) => (
                                                                <button
                                                                    key={duration.duration_id}
                                                                    className={`btn ${selectedDurationIndex === index ? "btn-primary" : "btn-outline-primary"}`}
                                                                    onClick={() => setSelectedDurationIndex(index)}
                                                                >
                                                                    {duration.duration_time_limit}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {selectedProductByModelId ? (
                                                        <>
                                                            <div className="row justify-content-center" style={{ padding: "20px" }}>
                                                                {selectedProductByModelId.duration?.[selectedDurationIndex]?.plans?.map((plan, planIndex) => {
                                                                    const selectedDuration = selectedProductByModelId.duration?.[selectedDurationIndex]; const product = products[selectedModelIndex];
                                                                    // const selectedDuration = product?.duration?.[selectedDurationIndex];

                                                                    if (!product || !selectedDuration) return null;

                                                                    const durationText = selectedDuration?.duration_time_limit || "28 days";
                                                                    const durationDays = parseInt(durationText) || 28;
                                                                    const baseDays = 28;

                                                                    // If plan.price belongs to that duration (like in your JSON), just use it directly
                                                                    // Otherwise (for older data with 28-day base), multiply proportionally
                                                                    const totalPrice =
                                                                        selectedDuration?.plans?.length > 0
                                                                            ? plan.price // already specific for this duration
                                                                            : (plan.price / baseDays) * durationDays;

                                                                    const formattedPrice = new Intl.NumberFormat("en-IN", {
                                                                        style: "currency",
                                                                        currency: "INR",
                                                                        minimumFractionDigits: 0,
                                                                        maximumFractionDigits: 0,
                                                                    }).format(totalPrice);

                                                                    const isPopular = plan.label?.toLowerCase() === "couple";
                                                                    const isOutOfStock = !product?.wp_device_id;

                                                                    // Normalize connectivity (array or string)
                                                                    const connectivityRaw = product?.connectivity;
                                                                    const connectivity = Array.isArray(connectivityRaw)
                                                                        ? connectivityRaw.join(", ")
                                                                        : (connectivityRaw || "").toString().trim();

                                                                    // Pull GST, Discount, Deposit from duration
                                                                    const discountRate = selectedDuration?.discount || 0;
                                                                    const gstRate = selectedDuration?.gst || 0;
                                                                    const securityDeposit = selectedDuration?.security_deposit || 0;

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
                                                                                <div className="card-header bg-white text-center pt-4 border-0" style={{ borderRadius: '20px' }}>
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
                                                                                                {plan.capacity}/<span style={{ color: "rgb(13, 110, 253)" }}>Ltr</span>
                                                                                            </>
                                                                                        )}
                                                                                    </p>
                                                                                </div>

                                                                                {/* PRICE */}
                                                                                <div className="text-center mt-2">
                                                                                    <h4 style={{ color: "#000", fontWeight: "700", fontSize: "32px", marginBottom: "5px" }}>
                                                                                        <span style={{ color: "#0d6efd" }}>{formattedPrice}</span>
                                                                                    </h4>
                                                                                    <p style={{ color: "#666", fontWeight: "500", fontSize: "15px", marginBottom: "0" }}>
                                                                                        / for {durationText}
                                                                                    </p>

                                                                                    <p style={{ marginTop: "8px", color: "#333", fontWeight: "600", fontSize: "13px" }}>
                                                                                        {discountRate ? `${discountRate}% OFF` : "No Discount"}
                                                                                        <br />
                                                                                        <span style={{ fontSize: "12px", color: "#777" }}>(Inclusive of GST)</span>
                                                                                    </p>

                                                                                    <div
                                                                                        style={{
                                                                                            width: "200px",
                                                                                            height: "2px",
                                                                                            backgroundColor: "#0d6efd",
                                                                                            borderRadius: "2px",
                                                                                            margin: "10px auto 0 auto",
                                                                                        }}
                                                                                    ></div>
                                                                                </div>

                                                                                {/* FEATURES */}
                                                                                <div className="card-body text-left px-4" style={{ paddingTop: "0px" }}>
                                                                                    <ul style={{ listStyle: "none", paddingLeft: "0", margin: "5px 0" }}>
                                                                                        <li className="mb-2"><span className="text-success">✓</span> Lifetime Maintenance</li>
                                                                                        <li className="mb-2"><span className="text-success">✓</span> Security ₹ {securityDeposit}</li>
                                                                                        <li className="mb-2"><span className="text-success">✓</span> 24–48 Hour Installation</li>
                                                                                        {durationDays >= 90 && (
                                                                                            <li className="mb-2"><span className="text-success">✓</span> Filter Replacement Every 3 Months</li>
                                                                                        )}

                                                                                        {/* CONNECTIVITY */}
                                                                                        {connectivity ? (
                                                                                            <li className="mb-2">
                                                                                                <span className="text-success">✓</span> Connectivity:
                                                                                                <ul style={{ listStyleType: "disc", paddingLeft: "25px", marginTop: "5px" }}>
                                                                                                    {connectivity.split(",").map((conn, i) => (
                                                                                                        <li key={i}>{conn.trim()}</li>
                                                                                                    ))}
                                                                                                </ul>
                                                                                            </li>
                                                                                        ) : (
                                                                                            <li className="mb-2 text-danger">❌ No Connectivity</li>
                                                                                        )}

                                                                                        <li className="mb-2"><span className="text-success">✓</span> Model Type: {product.model_type || 'N/A'}</li>
                                                                                        <li className="mb-2"><span className="text-success">✓</span> Discount: {discountRate}%</li>
                                                                                        <li className="mb-2"><span className="text-success">✓</span> GST: {gstRate}%</li>
                                                                                        <li className="text-warning">
                                                                                            <span className="text-warning">✓</span> Includes ₹{securityDeposit} refundable deposit
                                                                                        </li>
                                                                                    </ul>
                                                                                </div>

                                                                                {/* BUTTON */}
                                                                                {/* BUTTON + STATUS */}
                                                                                {selectedDevice ? (
                                                                                    <div className="text-center mb-3">
                                                                                        {/* 1. Show End Date */}
                                                                                        {/* {selectedDevice.deviceDetails?.plan_config?.endDate ? (
                                                                                            <p className="mb-1" style={{ fontSize: "0.9rem", color: "#444" }}>
                                                                                                <strong>Plan ends on:</strong>{" "}
                                                                                                {formatDate(parseEndDate(selectedDevice.deviceDetails.plan_config.endDate))}
                                                                                            </p>
                                                                                        ) : (
                                                                                            <p className="mb-1" style={{ fontSize: "0.9rem", color: "#d00" }}>
                                                                                                <strong>No plan assigned</strong>
                                                                                            </p>
                                                                                        )} */}

                                                                                        {/* 2. Status Message */}
                                                                                        {(() => {
                                                                                            const endDateStr = selectedDevice.deviceDetails?.plan_config?.endDate;
                                                                                            const expiry = parseEndDate(endDateStr);
                                                                                            const now = new Date();

                                                                                            if (!expiry) {
                                                                                                return (
                                                                                                    <p style={{ color: "#ff8800", fontWeight: 600 }}>
                                                                                                        No active plan — please recharge
                                                                                                    </p>
                                                                                                );
                                                                                            }

                                                                                            const isExpired = now >= expiry;

                                                                                            if (isExpired) {
                                                                                                return (
                                                                                                    <p style={{ color: "#ff2600ff", fontWeight: 500 }}>
                                                                                                        Plan expired on {formatDate(expiry)}
                                                                                                    </p>
                                                                                                );
                                                                                            }

                                                                                            return (
                                                                                                <p style={{ color: "green", fontWeight: 600 }}>
                                                                                                    Plan Active (ends on {formatDate(expiry)})
                                                                                                </p>
                                                                                            );
                                                                                        })()}

                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-center mb-3 text-muted">
                                                                                        <p>Please select a device</p>
                                                                                    </div>
                                                                                )}

                                                                                {selectedDevice ? (
                                                                                    <div className="card-footer text-center pb-4 border-0 bg-white" style={{ borderRadius: '20px' }}>
                                                                                        <button
                                                                                            className="btn px-4 py-2 rounded-pill"
                                                                                            style={{
                                                                                                background: isExpired ? "#0d6efd" : "#6c757d",
                                                                                                border: "none",
                                                                                                color: "#fff",
                                                                                                cursor: isExpired ? "pointer" : "not-allowed",
                                                                                                opacity: isExpired ? 1 : 0.6,
                                                                                            }}
                                                                                            disabled={!isExpired}
                                                                                            onClick={() => {
                                                                                                if (!isExpired) return;
                                                                                                setSelectedPlanIndex(planIndex);
                                                                                                handleSubscribeClick();
                                                                                            }}
                                                                                        >
                                                                                            {isExpired ? "Recharge Now" : "Active"}
                                                                                        </button>
                                                                                    </div>
                                                                                ) : null}

                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center py-4 text-muted">
                                                            <p>Please select a model and device to view plans.</p>
                                                        </div>
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

                    {showSummaryModal && (
                        <div
                            className="modal show d-block"
                            tabIndex="-1"
                            style={{
                                backgroundColor: "rgba(0,0,0,0.5)",
                                padding: "10px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                position: "fixed",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                zIndex: 1050,
                                overflowY: "auto",
                            }}
                        >
                            <div
                                className="modal-dialog modal-lg"
                                style={{
                                    width: window.innerWidth < 768 ? "90%" : "60%",
                                    maxWidth: window.innerWidth < 768 ? "95%" : "700px",
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
                                            backgroundColor: "aliceblue",
                                            padding: window.innerWidth < 768 ? "10px 15px" : "15px 25px",
                                        }}
                                    >
                                        <h5
                                            className="modal-title"
                                            style={{
                                                color: "#0d6efd",
                                                fontSize: window.innerWidth < 768 ? "16px" : "18px",
                                            }}
                                        >
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
                                            fontSize: window.innerWidth < 768 ? "14px" : "16px",
                                            lineHeight: "1.6",
                                            padding: window.innerWidth < 768 ? "15px 20px" : "20px 30px",
                                            maxHeight: "80vh",
                                            overflowY: "auto",
                                        }}
                                    >
                                        {(() => {
                                            const product = selectedProductByModelId;
                                            const duration = product?.duration?.[selectedDurationIndex] || null;
                                            const plan = duration?.plans?.[selectedPlanIndex] || null;

                                            if (!product || !duration || !plan)
                                                return <p className="text-danger text-center">Please select a device, duration, and plan.</p>;

                                            const textRow = (label, value, isBold = false, isBlue = false) => (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        marginBottom: "6px",
                                                        alignItems: "baseline",
                                                    }}
                                                >
                                                    <span style={{ fontWeight: 600, color: "#000", fontSize: "15px" }}>{label}</span>
                                                    <span
                                                        style={{
                                                            fontWeight: isBold ? "700" : "500",
                                                            color: isBlue ? "#0d6efd" : "#333",
                                                            fontSize: "14px",
                                                        }}
                                                    >
                                                        {value}
                                                    </span>
                                                </div>
                                            );

                                            const formatINR = (val) =>
                                                `₹${val?.toLocaleString("en-IN", {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2,
                                                })}`;

                                            const durationText = duration.duration_time_limit || "28 days";
                                            const basePrice = plan.price || 0;
                                            const gstRate = duration.gst || 0;
                                            const discountRate = duration.discount || 0;

                                            const discountAmount = (basePrice * discountRate) / 100;
                                            const discountedPrice = basePrice - discountAmount;
                                            const gstAmount = (discountedPrice * gstRate) / 100;
                                            const subtotal = discountedPrice + gstAmount;
                                            const grandTotal = subtotal;

                                            return (
                                                <>
                                                    {textRow("Model", product.model_name, true, true)}
                                                    {textRow("Model Type", product.model_type || "N/A")}
                                                    {textRow("Connectivity", product.connectivity || "N/A")}
                                                    <hr style={{ color: "#0d6efd" }} />

                                                    {textRow("Selected Duration", duration.duration_time_limit, false, true)}
                                                    {textRow("Selected Plan", plan.label.toUpperCase(), false, true)}

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            marginBottom: "6px",
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: "600", color: "#000" }}>Capacity</span>
                                                        <span style={{ fontWeight: "500" }}>
                                                            {plan.label.toLowerCase() === "unlimited" || !plan.capacity ? (
                                                                <span style={{ color: "rgb(13, 110, 253)" }}>Unlimited</span>
                                                            ) : (
                                                                <>
                                                                    {plan.capacity}/<span style={{ color: "rgb(13, 110, 253)" }}>Ltr</span>
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>

                                                    <hr style={{ color: "#0d6efd" }} />
                                                    {textRow("Base Price", formatINR(basePrice))}
                                                    {textRow(`Discount (${discountRate}%)`, formatINR(discountAmount))}
                                                    {textRow("Discounted Price", formatINR(discountedPrice))}
                                                    {textRow(`GST (${gstRate}%)`, formatINR(gstAmount))}

                                                    <hr style={{ color: "#0d6efd" }} />
                                                    {textRow("Subtotal", formatINR(subtotal))}
                                                    {textRow("Grand Total", formatINR(grandTotal), true, true)}
                                                </>
                                            );
                                        })()}
                                    </div>

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
                                        <div
                                            style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: "15px",
                                                justifyContent: "center",
                                                width: "100%",
                                            }}
                                        >
                                            {["online"].map((type) => (
                                                <label
                                                    key={type}
                                                    style={{
                                                        cursor: "pointer",
                                                        padding: "10px 15px",
                                                        border: selectedPaymentType === type ? "2px solid #0d6efd" : "1px solid #ccc",
                                                        borderRadius: "8px",
                                                        backgroundColor: selectedPaymentType === type ? "#e7f1ff" : "#fff",
                                                        fontSize: window.innerWidth < 768 ? "13px" : "15px",
                                                        width: window.innerWidth < 768 ? "100%" : "auto",
                                                        textAlign: "center",
                                                        transition: "all 0.2s ease-in-out",
                                                    }}
                                                    onClick={() => setSelectedPaymentType(type)}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="paymentType"
                                                        value={type}
                                                        checked={selectedPaymentType === type}
                                                        onChange={() => setSelectedPaymentType(type)}
                                                        style={{
                                                            accentColor: "#0d6efd",
                                                            marginRight: "6px",
                                                        }}
                                                    />
                                                    Online Payment
                                                </label>
                                            ))}
                                        </div>

                                        {selectedPaymentType && (
                                            <div style={{ marginTop: "10px", fontWeight: 600, color: "#0d6efd" }}>
                                                Online Payment selected — proceed to secure checkout.
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                justifyContent: "center",
                                                gap: "10px",
                                                width: "100%",
                                            }}
                                        >
                                            <button className="btn btn-secondary" onClick={() => setShowSummaryModal(false)}>
                                                Cancel
                                            </button>
                                            <button
                                                className={`btn ${selectedPaymentType ? "btn-primary" : "btn-outline-primary"}`}
                                                onClick={(e) => handleSubmit(e, "online")}
                                                disabled={!selectedPaymentType}
                                            >
                                                Proceed to Online
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                </section>
                {/* <!-- /Features Section --> */}

                {/* <!-- Start Product detail Section --> */}
                {loading ? (
                    <div className="text-center my-5">
                        {/* <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div> */}
                    </div>
                ) : products.length > 0 ? (
                    <section id="features" className="features section" style={{ padding: '0px' }}>
                        <div className="container section-title" data-aos="fade-up">
                            <h3 style={{ textAlign: 'left' }}>Product details</h3>
                            <p style={{ textAlign: 'left' }}>
                                {products[selectedModelIndex]?.product_details}
                            </p>
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
                    </section>
                ) : (
                    <div className="container text-center my-5">
                        <h3>No products available at the moment.</h3>
                    </div>
                )}

                {/* <!-- Start Product detail Section --> */}

            </main>

            {/* Footer */}
            < Footer />
        </div>
    );
};

export default Recharge;
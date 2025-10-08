import React, { useEffect, useState } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from "axios";

const OrderHistory = ({ userInfo, token, handleLogout }) => {
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // Fetch payment history
    useEffect(() => {
        const fetchPaymentHistory = async () => {
            setLoading(true);
            try {
                const response = await axios.post(
                    "/api/app/settings/fetchpaymenthistory",
                    { user_id: userInfo.user_id },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.data.success) {
                    setPaymentHistory(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching payment history:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPaymentHistory();
    }, [userInfo, token]);

    // Convert UTC date to Indian Standard Time
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

    const toggleExpand = (orderId) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    const getListItemStyle = (index) => {
        return {
            transition: "border 0.3s ease, background-color 0.3s ease",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "10px",
            backgroundColor: hoveredIndex === index ? "#f8f9fa" : "#fff",
            border: hoveredIndex === index ? "1px solid #0d83fd" : "1px solid #ddd",
            cursor: "pointer",
        };
    };

    const getStatusClass2 = (status) => {
        switch (status?.toLowerCase()) {
            case "confirmed":
            case "completed":
                return {
                    color: "#28a745", // Green text for completed/confirmed
                    backgroundColor: "#e6f4ea", // Light green background
                    padding: "2px 8px",
                    borderRadius: "4px",
                    borderLeft: "4px solid #28a745", // Green bar on the left
                    display: "inline-block"
                };
            case "pending":
            case "created":
                return {
                    color: "#e67e22", // Orange text for pending/created
                    backgroundColor: "#fef5e7", // Light orange background
                    padding: "2px 8px",
                    borderRadius: "4px",
                    borderLeft: "4px solid #e67e22", // Orange bar on the left
                    display: "inline-block"
                };
            default:
                return {
                    color: "#6c757d", // Gray for unknown/N/A
                    backgroundColor: "#f8f9fa",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    borderLeft: "4px solid #6c757d",
                    display: "inline-block"
                };
        }
    };

    return (
        <div>
            {/* Header */}
            <Header userInfo={userInfo} handleLogout={handleLogout} />

            <main className="main">
                <section id="payment-history" className="payment-history section light-background" style={{ paddingTop: '110px' }}>
                    <div className="container section-title" data-aos="fade-up">
                        <h2>Order History</h2>
                        <p>View your order history and subscription details</p>
                    </div>

                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        {loading ? (
                            <div className="loader">Loading...</div>
                        ) : (
                            <div className="row">
                                {[...paymentHistory].reverse().map((payment, index) => {
                                    const order = payment.orders?.[0] || {};
                                    const address = order.deliveryAddress || {};
                                    const selectedPlan = order.selectedPlan || {};
                                    const selectedDuration = order.selectedDuration || {};
                                    const isExpanded = expandedOrderId === order._id;

                                    return (
                                        <div
                                            key={payment._id}
                                            className="col-12"
                                            data-aos="fade-up"
                                            data-aos-delay={index * 100}
                                            onClick={() => toggleExpand(order._id)}
                                            onMouseEnter={() => setHoveredIndex(index)}
                                            onMouseLeave={() => setHoveredIndex(null)}
                                            style={getListItemStyle(index)}
                                        >
                                            {/* List view summary */}
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h5 style={{ color: "#0d83fd" }}>Order ID: {order.customOrderId || payment.orderId || "N/A"}</h5>
                                                    <p><strong>Model Name:</strong> {order.modelName || "N/A"}</p>
                                                    <p><strong>WP Device ID:</strong> {order.wp_device_id || "N/A"}</p>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <p>
                                                        <strong>Order Status: </strong>
                                                        <span style={getStatusClass2(order.orderStatus)}>
                                                            {order.orderStatus || "N/A"}
                                                        </span>
                                                    </p>
                                                    <p>
                                                        <strong>Payment Status: </strong>
                                                        <span style={getStatusClass2(payment.paymentStatus)}>
                                                            {payment.paymentStatus || "N/A"}
                                                        </span>
                                                    </p>
                                                    <p>
                                                        <strong>Installation Status: </strong>
                                                        <span style={getStatusClass2(order.task_status)}>
                                                            {order.task_status || "N/A"}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Expanded details */}
                                            {isExpanded && (
                                                <div className="mt-3" style={{ borderTop: "1px solid #ddd", paddingTop: "10px" }}>
                                                    <div className="row">
                                                        {/* Selected Plan Details */}
                                                        <div className="col-12 col-md-4 mb-3">
                                                            <h5 style={{ color: "#0d83fd" }}><b>Selected Plan Details</b></h5>
                                                            <p><strong>Label:</strong> {selectedPlan.label || "N/A"}</p>
                                                            <p><strong>Capacity:</strong> {selectedPlan.capacity || "N/A"}</p>
                                                            <p><strong>Price:</strong> ₹{selectedPlan.price || "N/A"}</p>
                                                        </div>

                                                        {/* Selected Duration Details */}
                                                        <div className="col-12 col-md-4 mb-3">
                                                            <h5 style={{ color: "#0d83fd" }}><b>Selected Duration Details</b></h5>
                                                            <p><strong>Duration:</strong> {selectedDuration.duration_time_limit || "N/A"}</p>
                                                            <p><strong>Discount:</strong> {selectedDuration.discount || "N/A"}%</p>
                                                            <p><strong>GST:</strong> {selectedDuration.gst || "N/A"}%</p>
                                                            <p><strong>Security Deposit:</strong> ₹{selectedDuration.security_deposit || "N/A"}</p>
                                                        </div>

                                                        {/* Delivery Address */}
                                                        <div className="col-12 col-md-4 mb-3">
                                                            <h5 style={{ color: "#0d83fd" }}><b>Delivery Address</b></h5>
                                                            <p><strong>Name: </strong> {address.name || "N/A"}<br /></p>
                                                            <p><strong>Phone: </strong> {address.phone || "N/A"}<br /></p>
                                                            <p><strong>Email: </strong> {address.email || "N/A"}<br /></p>
                                                            <p><strong>Address: </strong>{address.street || "N/A"}, {address.landmark || "N/A"}<br />
                                                                {address.city || "N/A"}, {address.district || "N/A"}, {address.state || "N/A"} - {address.pincode || "N/A"}<br />
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Payment Details */}
                                                    <div style={{ borderTop: "1px solid #ddd", paddingTop: "10px" }}>
                                                        <h5 style={{ color: "#0d83fd" }}><b>Payment Details</b></h5>
                                                        <p><strong>Total Litre:</strong> {payment.totalLitre || "N/A"}</p>
                                                        <p><strong>Price with GST:</strong> ₹{payment.priceWithGST || "N/A"}</p>
                                                        <p><strong>Discount Amount:</strong> ₹{payment.discountAmount || "N/A"}</p>
                                                        <p><strong>GST Amount:</strong> ₹{payment.gstAmount || "N/A"}</p>
                                                        <p><strong>Security Deposit:</strong> ₹{payment.securityDeposit || "N/A"}</p>
                                                        <p><strong>Total Price:</strong> ₹{payment.totalPrice || order.grandTotal || "N/A"}</p>
                                                        <p><strong>Razorpay Order ID:</strong> {payment.razorpayOrderId || "N/A"}</p>
                                                        <p><strong>Razorpay Payment ID:</strong> {payment.razorpayPaymentId || "N/A"}</p>
                                                        <p><strong>Subscribed At:</strong> {formatDateToIST(order.subscribed_at || payment.createdAt)}</p>
                                                        <p><strong>Subscription Expiry:</strong> {formatDateToIST(order.subscriptionExpiryDate)}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default OrderHistory;
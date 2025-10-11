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

    // Download invoice PDF
    const handleDownloadInvoice = async (orderId) => {
        try {
            const url = `/api/website/orders/${orderId}/invoice`;

            const response = await axios.get(url, {
                responseType: "blob", // Important for binary PDF data
            });

            // Create a blob link to download
            const blob = new Blob([response.data], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `Invoice_${orderId}.pdf`;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            URL.revokeObjectURL(link.href);
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error downloading invoice:", error);
            alert("Failed to download invoice. Please try again.");
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

                    <div className="container" data-aos="fade-up" data-aos-delay="100" style={{ padding: '20px' }}>
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
                                                <div className="d-flex align-items-center" style={{ gap: "15px" }}>
                                                    {/* Product Image */}
                                                    {order.main_image || order.product_model_images?.main_img ? (
                                                        <img
                                                            src={`/upload/img/${order.main_image || order.product_model_images?.main_img}`}
                                                            alt={order.modelName}
                                                            style={{
                                                                width: "100px",
                                                                height: "100px",
                                                                borderRadius: "8px",
                                                                border: "2px solid #0d6efd",
                                                                objectFit: "cover",
                                                            }}
                                                        />
                                                    ) : (
                                                        <div
                                                            style={{
                                                                width: "50px",
                                                                height: "50px",
                                                                borderRadius: "8px",
                                                                border: "2px solid #0d6efd",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                color: "#0d6efd",
                                                                fontWeight: "bold",
                                                                fontSize: "14px",
                                                            }}
                                                        >
                                                            N/A
                                                        </div>
                                                    )}

                                                    {/* Order Info */}
                                                    <div>
                                                        <h5 style={{ color: "#0d83fd" }}>
                                                            Order ID: {order.customOrderId || payment.orderId || "N/A"}
                                                        </h5>
                                                        <p><strong>Model Name:</strong> {order.modelName || "N/A"}</p>
                                                        <p><strong>WP Device ID:</strong> {order.wp_device_id || "N/A"}</p>
                                                    </div>
                                                </div>

                                                {/* Status Info (Right Side) */}
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
                                                <div className="row" style={{ gap: "20px", width: "110%", padding: '10px' }}>
                                                    {/* Left Column: Plan & Payment Details */}
                                                    <div className="col-md-6">
                                                        <div
                                                            style={{
                                                                borderTop: "1px solid #0d6efd",
                                                                padding: "20px",
                                                                backgroundColor: "#fff",
                                                                borderRadius: "10px",
                                                                height: "100%",
                                                            }}
                                                        >
                                                            <h5
                                                                style={{
                                                                    color: "#0d6efd",
                                                                    fontWeight: "700",
                                                                    fontSize: "16px",
                                                                    borderBottom: "2px solid #0d6efd",
                                                                    display: "inline-block",
                                                                    marginBottom: "15px",
                                                                }}
                                                            >
                                                                Plan & Payment Details
                                                            </h5>

                                                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                                <tbody>
                                                                    <tr>
                                                                        <td style={{ fontWeight: "600", color: "#333" }}>Model</td>
                                                                        <td style={{ textAlign: "right", color: "#0d6efd", fontWeight: "600" }}>
                                                                            {order.modelName || "N/A"}
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ fontWeight: "600", color: "#333" }}>Plan</td>
                                                                        <td style={{ textAlign: "right", color: "#0d6efd", fontWeight: "600" }}>
                                                                            {selectedPlan.label || "N/A"}
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ fontWeight: "600", color: "#333" }}>Capacity</td>
                                                                        <td style={{ textAlign: "right" }}>
                                                                            {selectedPlan.label?.toLowerCase() === "unlimited" ? (
                                                                                <span style={{ color: "#0d6efd", fontWeight: "600" }}>Unlimited</span>
                                                                            ) : (
                                                                                <>
                                                                                    {selectedPlan.capacity}/
                                                                                    <span style={{ color: "#0d6efd", fontWeight: "600" }}>Ltr</span>
                                                                                </>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ fontWeight: "600", color: "#333" }}>Price</td>
                                                                        <td style={{ textAlign: "right" }}>₹{payment.price || "N/A"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ fontWeight: "600", color: "#333" }}>Duration</td>
                                                                        <td style={{ textAlign: "right" }}>{selectedDuration.duration_time_limit || "N/A"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ fontWeight: "600", color: "#333" }}>GST ({selectedDuration.gst || 0}%)</td>
                                                                        <td style={{ textAlign: "right" }}>₹{payment.gstAmount || "N/A"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ fontWeight: "600", color: "#333" }}>Price with GST</td>
                                                                        <td style={{ textAlign: "right" }}>₹{payment.priceWithGST || "N/A"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ fontWeight: "600", color: "#333" }}>Discount ({selectedDuration.discount || 0}%)</td>
                                                                        <td style={{ textAlign: "right" }}>₹{payment.discountAmount || "N/A"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ fontWeight: "600", color: "#333" }}>Subtotal</td>
                                                                        <td style={{ textAlign: "right" }}>₹{payment.subtotal || "N/A"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ fontWeight: "600", color: "#333" }}>Security Deposit</td>
                                                                        <td style={{ textAlign: "right" }}>₹{selectedDuration.security_deposit || "N/A"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ fontWeight: "700", color: "#000" }}>Grand Total</td>
                                                                        <td style={{ textAlign: "right", color: "#0d6efd", fontWeight: "700" }}>
                                                                            ₹{order.grandTotal || payment.totalPrice || "N/A"}
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>

                                                    {/* Right Column: Delivery Address */}
                                                    <div className="col-md-5">
                                                        <div
                                                            style={{
                                                                borderTop: "1px solid #0d6efd",
                                                                padding: "20px",
                                                                backgroundColor: "#fff",
                                                                borderRadius: "10px",
                                                                height: "100%",
                                                            }}
                                                        >
                                                            <h5
                                                                style={{
                                                                    color: "#0d6efd",
                                                                    fontWeight: "700",
                                                                    fontSize: "16px",
                                                                    borderBottom: "2px solid #0d6efd",
                                                                    display: "inline-block",
                                                                    marginBottom: "15px",
                                                                }}
                                                            >
                                                                Delivery Address
                                                            </h5>

                                                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                                <tbody>
                                                                    <tr>
                                                                        <td style={{ fontWeight: "600", color: "#333" }}>Name</td>
                                                                        <td style={{ textAlign: "right", color: "#333" }}>{address.name || "N/A"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ fontWeight: "600", color: "#333" }}>Phone</td>
                                                                        <td style={{ textAlign: "right", color: "#333" }}>{address.phone || "N/A"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ fontWeight: "600", color: "#333" }}>Email</td>
                                                                        <td style={{ textAlign: "right", color: "#333" }}>{address.email || "N/A"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ fontWeight: "600", color: "#333" }}>Address</td>
                                                                        <td style={{ textAlign: "right", color: "#333" }}>
                                                                            {address.street || "N/A"}, {address.landmark || ""}<br />
                                                                            {address.city || ""}, {address.district || ""}, {address.state || ""} - {address.pincode || ""}
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>

                                                            {/* Download Invoice Button */}
                                                            <div style={{ textAlign: "center", marginTop: "20px" }}>
                                                                <button
                                                                    className="btn btn-primary"
                                                                    style={{
                                                                        background: "#0d6efd",
                                                                        border: "none",
                                                                        padding: "8px 20px",
                                                                        borderRadius: "6px",
                                                                        fontWeight: "600",
                                                                    }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDownloadInvoice(order.customOrderId);
                                                                    }}
                                                                >
                                                                    <i className="bi bi-download" style={{ marginRight: "5px" }}></i>
                                                                    Download Invoice
                                                                </button>
                                                            </div>
                                                        </div>
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
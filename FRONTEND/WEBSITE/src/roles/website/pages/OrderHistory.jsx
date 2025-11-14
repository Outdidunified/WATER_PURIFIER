import React, { useEffect, useState } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from "axios";

const OrderHistory = ({ userInfo, token, handleLogout }) => {
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedOrderStatus, setSelectedOrderStatus] = useState(null);

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

    const getDeliveryTimeline = (order) => {
        if (!order) return [];

        const steps = [
            { key: "accepted", label: "Order Accepted" },
            { key: "packed", label: "Order Packed" },
            { key: "intransit", label: "Shipped" },
            { key: "outfordelivery", label: "Out For Delivery" },
            { key: "completed", label: "Delivered" },
        ];

        return steps.map((step) => {
            let history = null;

            // Step 1: "accepted" is from deliveryAcceptanceStatus
            if (step.key === "accepted" && order.deliveryAcceptanceStatus === "accepted") {
                history = {
                    timestamp: order.deliveryAcceptanceTimestamp,
                    notes: "Order accepted by system",
                };
            }

            // Step 2-5: from deliveryHistory array
            if (!history && order.deliveryHistory) {
                history = order.deliveryHistory.find((h) => h.status === step.key);
            }

            return {
                label: step.label,
                date: history ? formatDateToIST(history.timestamp) : null,
                notes: history ? history.notes : null,
                isCompleted: !!history,
            };
        });
    };

    useEffect(() => {
        if (showStatusModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [showStatusModal]);


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
                                    const orderKey = order._id || payment._id || `${index}`;

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
                                                        <p><strong>Model Type:</strong> {order.modeltype || "N/A"}</p>
                                                        <p><strong>WP Device ID:</strong> {order.wp_device_id || "N/A"}</p>
                                                    </div>
                                                </div>

                                                <div style={{ textAlign: "right" }}>
                                                    {order.orderType === "Recharge" || order.isRecharge ? (
                                                        <p>
                                                            <strong>Status: </strong>
                                                            <span style={{ fontWeight: "600", color: "green" }}>
                                                                {order.orderType || 'N/A'}
                                                            </span>
                                                        </p>
                                                    ) : (
                                                        <>
                                                            <p>
                                                                <strong>Delivery Status </strong>
                                                                <span
                                                                    style={{
                                                                        ...getStatusClass2(order.deliveryCurrentStatus),
                                                                        fontWeight: "600",
                                                                    }}
                                                                >
                                                                    {(() => {
                                                                        if (order.deliveryCurrentStatus) {
                                                                            const statusMap = {
                                                                                accepted: "Order Accepted",
                                                                                packed: "Order Packed",
                                                                                intransit: "Shipped",
                                                                                outfordelivery: "Out For Delivery",
                                                                                completed: "Delivered",
                                                                                cancelled: "Order Cancelled",
                                                                                returned: "Returned",
                                                                                failed: "Delivery Failed",
                                                                            };
                                                                            const normalized = order.deliveryCurrentStatus.toLowerCase();
                                                                            return statusMap[normalized] ||
                                                                                (order.deliveryCurrentStatus.charAt(0).toUpperCase() +
                                                                                    order.deliveryCurrentStatus.slice(1));
                                                                        }

                                                                        if (order.deliveryAcceptanceStatus === true) return "Order Confirmed";
                                                                        if (order.deliveryAcceptanceStatus === false) return "Awaiting Confirmation";

                                                                        if (typeof order.deliveryAcceptanceStatus === "string") {
                                                                            const statusMap = {
                                                                                accepted: "Order Accepted",
                                                                                packed: "Order Packed",
                                                                                intransit: "Shipped",
                                                                                outfordelivery: "Out For Delivery",
                                                                                completed: "Delivered",
                                                                                cancelled: "Order Cancelled",
                                                                                returned: "Returned",
                                                                                failed: "Delivery Failed",
                                                                            };

                                                                            return (
                                                                                statusMap[order.deliveryAcceptanceStatus.toLowerCase()] ||
                                                                                order.deliveryAcceptanceStatus.charAt(0).toUpperCase() +
                                                                                order.deliveryAcceptanceStatus.slice(1)
                                                                            );
                                                                        }

                                                                        return "N/A";
                                                                    })()}
                                                                </span>
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expanded details */}
                                            {isExpanded && (
                                                <div style={{ padding: "20px", maxHeight: "70vh", overflowY: "auto" }}>
                                                    {/* Timeline */}
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "flex-start",
                                                            marginBottom: "20px",
                                                            position: "relative",
                                                        }}
                                                    >
                                                        {/* Base grey connector line */}
                                                        <div
                                                            style={{
                                                                position: "absolute",
                                                                top: "calc(10px)", // ✅ Center line vertically through dots (half of 20px)
                                                                left: "5%",
                                                                right: "5%",
                                                                height: "2px",
                                                                backgroundColor: "#ccc",
                                                                zIndex: 0,
                                                            }}
                                                        ></div>

                                                        {getDeliveryTimeline(order).map((step, i, arr) => {
                                                            const isLast = i === arr.length - 1;
                                                            const nextStep = arr[i + 1];
                                                            const showGreenLine = step.isCompleted && nextStep?.isCompleted;

                                                            return (
                                                                <div
                                                                    key={`${orderKey}-step-${i}`}
                                                                    style={{
                                                                        flex: "1",
                                                                        textAlign: "center",
                                                                        position: "relative",
                                                                        zIndex: 2,
                                                                    }}
                                                                >
                                                                    {/* Green connector between completed steps */}
                                                                    {!isLast && (
                                                                        <div
                                                                            style={{
                                                                                position: "absolute",
                                                                                top: "calc(10px)", // ✅ Same as base line — perfectly centered
                                                                                left: "50%",
                                                                                width: "100%",
                                                                                height: "2px",
                                                                                backgroundColor: showGreenLine ? "#28a745" : "transparent",
                                                                                zIndex: 1,
                                                                                transition: "background-color 0.3s ease",
                                                                            }}
                                                                        ></div>
                                                                    )}

                                                                    {/* Step Circle */}
                                                                    <div
                                                                        style={{
                                                                            width: "20px",
                                                                            height: "20px",
                                                                            borderRadius: "50%",
                                                                            backgroundColor: step.isCompleted ? "#28a745" : "#ccc",
                                                                            margin: "0 auto",
                                                                            position: "relative",
                                                                            zIndex: 2,
                                                                            transition: "background-color 0.3s ease",
                                                                        }}
                                                                    ></div>

                                                                    {/* Step Label */}
                                                                    <div
                                                                        style={{
                                                                            marginTop: "10px",
                                                                            fontWeight: "600",
                                                                            color: "#000",
                                                                        }}
                                                                    >
                                                                        {step.label}
                                                                    </div>

                                                                    {/* Date */}
                                                                    <div
                                                                        style={{
                                                                            color: step.isCompleted ? "#28a745" : "#888",
                                                                            fontSize: "13px",
                                                                            marginTop: "3px",
                                                                        }}
                                                                    >
                                                                        {step.date || "—"}
                                                                    </div>

                                                                    {/* Notes */}
                                                                    <div
                                                                        style={{
                                                                            color: step.notes ? "#555" : "#888",
                                                                            fontSize: "12px",
                                                                            marginTop: "4px",
                                                                        }}
                                                                    >
                                                                        {step.notes || "Pending update"}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

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
                                                                                        {selectedPlan.capacity}
                                                                                        <span style={{ color: "#0d6efd", fontWeight: "600" }}>Ltr</span>
                                                                                    </>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                        <hr style={{ textAlign: 'center', color: '#0d6efd' }}></hr>
                                                                        <tr>
                                                                            <td style={{ fontWeight: "600", color: "#333" }}>Payment Type</td>
                                                                            <td style={{ textAlign: "right" }}>{payment.paymentType || "N/A"}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style={{ fontWeight: "600", color: "#333" }}>Duration</td>
                                                                            <td style={{ textAlign: "right" }}>{selectedDuration.duration_time_limit || "N/A"}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style={{ fontWeight: "600", color: "#333" }}>Price</td>
                                                                            <td style={{ textAlign: "right" }}>₹{payment.price || order.price || "N/A"}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style={{ fontWeight: "600", color: "#333" }}>Discount ({selectedDuration.discount || 0}%)</td>
                                                                            <td style={{ textAlign: "right" }}>₹{payment.discountAmount || "N/A"}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style={{ fontWeight: "600", color: "#333" }}>Discounted Price {selectedDuration.discountedPrice}</td>
                                                                            <td style={{ textAlign: "right" }}>₹{payment.discountedPrice || "N/A"}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style={{ fontWeight: "600", color: "#333" }}>GST ({selectedDuration.gst || 0}%)</td>
                                                                            <td style={{ textAlign: "right" }}>₹{payment.gstAmount || "N/A"}</td>
                                                                        </tr>

                                                                        <tr>
                                                                            <td style={{ fontWeight: "600", color: "#333" }}>Subtotal</td>
                                                                            <td style={{ textAlign: "right" }}>₹{payment.subtotal || order.priceWithGST || "N/A"}</td>
                                                                        </tr>
                                                                        {(order.orderType !== "Recharge" && !order.isRecharge) && (
                                                                            <tr>
                                                                                <td style={{ fontWeight: "600", color: "#333" }}>Security Deposit</td>
                                                                                <td style={{ textAlign: "right" }}>₹{selectedDuration.security_deposit || "N/A"}</td>
                                                                            </tr>
                                                                        )}
                                                                        {payment.paymentType === "COD" && Number(payment.codFee) > 0 && (
                                                                            <tr>
                                                                                <td style={{ fontWeight: "600", color: "#333" }}>COD Fee</td>
                                                                                <td style={{ textAlign: "right" }}>₹{payment.codFee}</td>
                                                                            </tr>
                                                                        )}
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

                                                                <hr style={{ textAlign: 'center', color: '#0d6efd' }}></hr>

                                                                <p
                                                                    style={{
                                                                        display: "flex",
                                                                        justifyContent: "space-between",
                                                                        alignItems: "center",
                                                                        margin: "4px 0",
                                                                    }}
                                                                >
                                                                    <strong>Order Status</strong>
                                                                    <span style={getStatusClass2(order.orderStatus)}>
                                                                        {order.orderStatus || "N/A"}
                                                                    </span>
                                                                </p>

                                                                <p
                                                                    style={{
                                                                        display: "flex",
                                                                        justifyContent: "space-between",
                                                                        alignItems: "center",
                                                                        margin: "4px 0",
                                                                    }}
                                                                >
                                                                    <strong>Payment Status</strong>
                                                                    <span style={getStatusClass2(payment.paymentStatus)}>
                                                                        {payment.paymentStatus || "N/A"}
                                                                    </span>
                                                                </p>

                                                                {!(order.orderType === "Recharge" || order.isRecharge) && (
                                                                    <p
                                                                        style={{
                                                                            display: "flex",
                                                                            justifyContent: "space-between",
                                                                            alignItems: "center",
                                                                            margin: "4px 0",
                                                                        }}
                                                                    >
                                                                        <strong>Installation Status</strong>
                                                                        <span style={getStatusClass2(order.task_status)}>
                                                                            {order.task_status || "N/A"}
                                                                        </span>
                                                                    </p>
                                                                )}


                                                                {/* Download Invoice Button */}
                                                                <div style={{ textAlign: "center", marginTop: "20px" }}>
                                                                    <button
                                                                        className="btn btn-primary"
                                                                        style={{
                                                                            background: order.task_status === "Completed" ? "#0d6efd" : "#b0b0b0",
                                                                            border: "none",
                                                                            padding: "8px 20px",
                                                                            borderRadius: "6px",
                                                                            fontWeight: "600",
                                                                            cursor: order.task_status === "Completed" ? "pointer" : "not-allowed",
                                                                            opacity: order.task_status === "Completed" ? 1 : 0.6,
                                                                            transition: "all 0.3s ease",
                                                                        }}
                                                                        disabled={order.task_status !== "Completed"}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (order.task_status === "Completed") {
                                                                                handleDownloadInvoice(order.customOrderId);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <i className="bi bi-download" style={{ marginRight: "5px" }}></i>
                                                                        Download Invoice
                                                                    </button>
                                                                </div>
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
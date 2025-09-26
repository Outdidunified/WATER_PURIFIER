import React, { useEffect, useState } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from "axios";

const PaymentHistory = ({ userInfo, token, handleLogout }) => {
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // Fetch payment history
    useEffect(() => {
        const fetchPaymentHistory = async () => {
            setLoading(true);
            try {
                const response = await axios.post(
                    "/api/app/settings/fetchpaymenthistory",
                    { user_id: userInfo.user_id }, // Sending user_id in body
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

    // Convert UTC date → Indian Standard Time
    const formatDateToIST = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getCardStyle = (index) => {
        return {
            transformStyle: "preserve-3d",
            transition: "transform 0.5s, border 0.3s ease",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
            overflow: "hidden",
            border: hoveredIndex === index ? "2px solid #0d83fd" : "none",
            transform: hoveredIndex === index ? "scale(1.05)" : "none",
        };
    };

    return (
        <div>
            {/* Header */}
            <Header userInfo={userInfo} handleLogout={handleLogout} />

            <main className="main">
                <section id="payment-history" className="payment-history section light-background" style={{ paddingTop: '110px' }}>
                    <div className="container section-title" data-aos="fade-up">
                        <h2>Payment History</h2>
                        <p>Details of your payment history and subscription orders</p>
                    </div>

                    <div className="container" data-aos="fade-up" data-aos-delay="100" >
                        {loading ? (
                            <div className="loader">Loading...</div>
                        ) : (
                            <div className="row">
                                {paymentHistory.map((payment, index) => {
                                    const order = payment.orders?.[0]; // first order if exists
                                    const address = order?.deliveryAddress;
                                    return (
                                        <div
                                            key={payment._id}
                                            className="col-lg-4 col-md-6"
                                            data-aos="fade-up"
                                            data-aos-delay={index * 100}
                                            style={{ perspective: "1000px", padding:'10px'}}
                                        >
                                            <div className="payment-card"
                                                style={getCardStyle(index)}
                                                onMouseEnter={() => setHoveredIndex(index)}
                                                onMouseLeave={() => setHoveredIndex(null)}
                                            >
                                                <div className="payment-card-body"
                                                    style={{
                                                        padding: "20px",
                                                        background: "#fff",
                                                        borderRadius: "8px",
                                                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                                                    }}
                                                >
                                                    <h5>Order ID: {order?.customOrderId || payment.orderId}</h5>
                                                    <p><strong>Module Name:</strong> {order?.modelName || "N/A"}</p>
                                                    <p><strong>Total Price (With GST):</strong> ₹{payment.priceWithGST}</p>
                                                    <p><strong>Status:</strong> {payment.paymentStatus}</p>

                                                    {/* Delivery Address */}
                                                    {address && (
                                                        <p>
                                                            <strong>Delivery Address:</strong><br />
                                                            {address.name}, {address.phone}<br />
                                                            {address.street}, {address.landmark}<br />
                                                            {address.city}, {address.district}, {address.state} - {address.pincode}
                                                        </p>
                                                    )}

                                                    {/* Subscription Expiry (IST) */}
                                                    <p><strong>Subscription Expiry:</strong> {formatDateToIST(payment.subscriptionExpiryDate)}</p>
                                                </div>
                                            </div>
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

export default PaymentHistory;

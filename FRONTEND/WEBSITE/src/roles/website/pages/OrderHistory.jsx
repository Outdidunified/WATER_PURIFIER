import React, { useEffect, useState } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from "axios";

// OrderHistory component with server-side pagination (page & limit) and a 7-item pager
export default function OrderHistory({ userInfo, token, handleLogout }) {
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // pagination state
    const [page, setPage] = useState(1); // current page
    const [limit, setLimit] = useState(3); // items per page (you asked for 3)
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Fetch payment history from the server with page & limit
    useEffect(() => {
        let isMounted = true;
        const fetchPaymentHistory = async () => {
            setLoading(true);
            try {
                const body = { user_id: userInfo.user_id, page, limit };
                const response = await axios.post(
                    "/api/website/products/fetchpaymenthistory",
                    body,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (!isMounted) return;

                if (response.data && response.data.success) {
                    // API returns data, page, limit, totalPages, totalRecords
                    setPaymentHistory(Array.isArray(response.data.data) ? response.data.data : []);
                    setTotalPages(response.data.totalPages || 1);
                    setTotalRecords(response.data.totalRecords || 0);
                } else {
                    setPaymentHistory([]);
                    setTotalPages(1);
                    setTotalRecords(0);
                }
            } catch (err) {
                console.error('Error fetching payment history:', err);
                setPaymentHistory([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchPaymentHistory();

        return () => {
            isMounted = false;
        };
    }, [userInfo, token, page, limit]);

    // Date formatter (UTC -> IST)
    const formatDateToIST = (dateString) => {
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const toggleExpand = (orderId) => setExpandedOrderId(prev => (prev === orderId ? null : orderId));

    const getListItemStyle = (index) => ({
        transition: 'border 0.3s ease, background-color 0.3s ease',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '10px',
        backgroundColor: hoveredIndex === index ? '#f8f9fa' : '#fff',
        border: hoveredIndex === index ? '1px solid #0d83fd' : '1px solid #ddd',
        cursor: 'pointer'
    });

    const getStatusClass2 = (status) => {
        if (!status) return { color: '#6c757d', backgroundColor: '#f8f9fa', padding: '2px 8px', borderRadius: '4px', borderLeft: '4px solid #6c757d', display: 'inline-block' };
        const s = ('' + status).toLowerCase();
        if (['confirmed', 'completed'].includes(s)) return { color: '#28a745', backgroundColor: '#e6f4ea', padding: '2px 8px', borderRadius: '4px', borderLeft: '4px solid #28a745', display: 'inline-block' };
        if (['pending', 'created'].includes(s)) return { color: '#e67e22', backgroundColor: '#fef5e7', padding: '2px 8px', borderRadius: '4px', borderLeft: '4px solid #e67e22', display: 'inline-block' };
        return { color: '#6c757d', backgroundColor: '#f8f9fa', padding: '2px 8px', borderRadius: '4px', borderLeft: '4px solid #6c757d', display: 'inline-block' };
    };

    // Download invoice PDF
    const handleDownloadInvoice = async (orderId) => {
        try {
            const url = `/api/website/orders/${orderId}/invoice`;
            const response = await axios.get(url, { responseType: 'blob', headers: { Authorization: `Bearer ${token}` } });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Invoice_${orderId}.pdf`;
            document.body.appendChild(link);
            link.click();
            URL.revokeObjectURL(link.href);
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading invoice:', error);
            alert('Failed to download invoice. Please try again.');
        }
    };

    // Build delivery timeline for display
    const getDeliveryTimeline = (order) => {
        if (!order) return [];
        const steps = [
<<<<<<< HEAD
            { key: "accepted", label: "Order Accepted" },
            { key: "packed", label: "Order Packed" },
            { key: "intransit", label: "Shipped" },
            { key: "outfordelivery", label: "Out for Delivery" },
            { key: "completed", label: "Delivered" },
=======
            { key: 'accepted', label: 'Order Accepted' },
            { key: 'packed', label: 'Order Packed' },
            { key: 'intransit', label: 'Shipped' },
            { key: 'outfordelivery', label: 'Out For Delivery' },
            { key: 'completed', label: 'Delivered' }
>>>>>>> de610a1d7e0afe86475d2980e418a2af9cd0f901
        ];

        return steps.map(step => {
            let history = null;
            if (step.key === 'accepted' && order.deliveryAcceptanceStatus === 'accepted') {
                history = { timestamp: order.deliveryAcceptanceTimestamp, notes: 'Order accepted by system' };
            }
            if (!history && Array.isArray(order.deliveryHistory)) {
                history = order.deliveryHistory.find(h => h.status === step.key);
            }
            return { label: step.label, date: history ? formatDateToIST(history.timestamp) : null, notes: history ? history.notes : null, isCompleted: !!history };
        });
    };

    useEffect(() => {
        document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    // Pagination helpers: show up to 7 page buttons centered on current page
    const getPagerRange = () => {
        const visible = 7;
        const total = Math.max(1, totalPages);
        if (total <= visible) return Array.from({ length: total }, (_, i) => i + 1);

        let start = Math.max(1, page - Math.floor(visible / 2));
        let end = start + visible - 1;
        if (end > total) {
            end = total;
            start = total - visible + 1;
        }
        return Array.from({ length: (end - start + 1) }, (_, i) => start + i);
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLimitChange = (newLimit) => {
        setLimit(newLimit);
        setPage(1); // reset to first page when limit changes
    };

    return (
        <div>
            <Header userInfo={userInfo} handleLogout={handleLogout} />

            <main className="main">
                <section id="payment-history" className="payment-history section light-background" style={{ paddingTop: '110px' }}>
                    <div className="container section-title" data-aos="fade-up" style={{ paddingBottom: '0px' }}>
                        <h2>Order History</h2>
                        <p>View your order history and subscription details</p>
                    </div>

                    <div className="container" data-aos="fade-up" data-aos-delay="100" style={{ padding: '20px' }}>
                        {/* Controls: limit selector + summary */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            {/* <div>
                                <label style={{ marginRight: '10px' }}>Items per page:</label>
                                <select value={limit} onChange={(e) => handleLimitChange(Number(e.target.value))}>
                                    <option value={3}>3</option>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                </select>
                            </div> */}

                            <div style={{ color: '#666' }}>
                                Showing page {page} of {totalPages} — {totalRecords} records
                            </div>
                        </div>

                        {loading ? (
                            <div className="loader">Loading...</div>
                        ) : (
                            <div className="row">
                                {Array.isArray(paymentHistory) && paymentHistory.length > 0 ? (
                                    [...paymentHistory].map((payment, index) => {
                                        const order = (payment.orders && payment.orders[0]) || {};
                                        const address = order.deliveryAddress || {};
                                        const selectedPlan = order.selectedPlan || {};
                                        const selectedDuration = order.selectedDuration || {};
                                        const isExpanded = expandedOrderId === (order._id || payment._id || `${index}`);
                                        const listKey = order._id || payment._id || `${page}-${index}`;

                                        return (
                                            <div key={listKey} className="col-12" data-aos="fade-up" data-aos-delay={index * 50} onClick={() => toggleExpand(order._id || payment._id || `${index}`)} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} style={getListItemStyle(index)}>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="d-flex align-items-center" style={{ gap: '15px' }}>
                                                        {(order.main_image || order.product_model_images?.main_img) ? (
                                                            <img src={`/upload/img/${order.main_image || order.product_model_images?.main_img}`} alt={order.modelName} style={{ width: '100px', height: '100px', borderRadius: '8px', border: '2px solid #0d6efd', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ width: '50px', height: '50px', borderRadius: '8px', border: '2px solid #0d6efd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d6efd', fontWeight: 'bold', fontSize: '14px' }}>N/A</div>
                                                        )}

                                                        <div>
                                                            <h5 style={{ color: '#0d83fd' }}>Order ID: {order.customOrderId || payment.orderId || 'N/A'}</h5>
                                                            <p><strong>Model Name:</strong> {order.modelName || 'N/A'}</p>
                                                            <p><strong>Model Type:</strong> {order.modeltype || 'N/A'}</p>
                                                            <p><strong>WP Device ID:</strong> {order.wp_device_id || 'N/A'}</p>
                                                        </div>
                                                    </div>

                                                    <div style={{ textAlign: 'right' }}>
                                                        {order.orderType === 'Recharge' || order.isRecharge ? (
                                                            <p><strong>Status: </strong><span style={{ fontWeight: 600, color: 'green' }}>{order.orderType || 'N/A'}</span></p>
                                                        ) : (
                                                            <p>
                                                                <strong>Delivery Status </strong>
                                                                <span style={{ ...getStatusClass2(order.deliveryCurrentStatus), fontWeight: 600 }}>{order.deliveryCurrentStatus || (order.deliveryAcceptanceStatus === true ? 'Order Confirmed' : (order.deliveryAcceptanceStatus === false ? 'Awaiting Confirmation' : 'N/A'))}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

<<<<<<< HEAD
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
                                                                                outfordelivery: "Out for Delivery",
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
=======
                                                {isExpanded && (
                                                    <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                                                        {/* Timeline */}
                                                        {!(order.orderType === 'Recharge' || order.isRecharge) && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative' }}>
                                                                <div style={{ position: 'absolute', top: 'calc(10px)', left: '5%', right: '5%', height: '2px', backgroundColor: '#ccc', zIndex: 0 }} />
                                                                {getDeliveryTimeline(order).map((step, i, arr) => {
                                                                    const isLast = i === arr.length - 1;
                                                                    const nextStep = arr[i + 1];
                                                                    const showGreenLine = step.isCompleted && nextStep?.isCompleted;
>>>>>>> de610a1d7e0afe86475d2980e418a2af9cd0f901

                                                                    return (
                                                                        <div key={`step-${i}`} style={{ flex: '1', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                                                                            {!isLast && <div style={{ position: 'absolute', top: 'calc(10px)', left: '50%', width: '100%', height: '2px', backgroundColor: showGreenLine ? '#28a745' : 'transparent', zIndex: 1, transition: 'background-color 0.3s ease' }} />}

<<<<<<< HEAD
                                                                        if (typeof order.deliveryAcceptanceStatus === "string") {
                                                                            const statusMap = {
                                                                                accepted: "Order Accepted",
                                                                                packed: "Order Packed",
                                                                                intransit: "Shipped",
                                                                                outfordelivery: "Out for Delivery",
                                                                                completed: "Delivered",
                                                                                cancelled: "Order Cancelled",
                                                                                returned: "Returned",
                                                                                failed: "Delivery Failed",
                                                                            };
=======
                                                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: step.isCompleted ? '#28a745' : '#ccc', margin: '0 auto', position: 'relative', zIndex: 2, transition: 'background-color 0.3s ease' }} />
>>>>>>> de610a1d7e0afe86475d2980e418a2af9cd0f901

                                                                            <div style={{ marginTop: '10px', fontWeight: 600, color: '#000' }}>{step.label}</div>
                                                                            <div style={{ color: step.isCompleted ? '#28a745' : '#888', fontSize: '13px', marginTop: '3px' }}>{step.date || '—'}</div>
                                                                            <div style={{ color: step.notes ? '#555' : '#888', fontSize: '12px', marginTop: '4px' }}>{step.notes || 'Pending update'}</div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        <div className="row" style={{ gap: '20px', width: '110%', padding: '10px' }}>
                                                            {/* Left Column */}
                                                            <div className="col-md-6">
                                                                <div style={{ borderTop: '1px solid #0d6efd', padding: '20px', backgroundColor: '#fff', borderRadius: '10px', height: '100%' }}>
                                                                    <h5 style={{ color: '#0d6efd', fontWeight: 700, fontSize: '16px', borderBottom: '2px solid #0d6efd', display: 'inline-block', marginBottom: '15px' }}>Plan & Payment Details</h5>

                                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                                        <tbody>
                                                                            <tr><td style={{ fontWeight: 600, color: '#333' }}>Model</td><td style={{ textAlign: 'right', color: '#0d6efd', fontWeight: 600 }}>{order.modelName || 'N/A'}</td></tr>
                                                                            <tr><td style={{ fontWeight: 600, color: '#333' }}>Plan</td><td style={{ textAlign: 'right', color: '#0d6efd', fontWeight: 600 }}>{selectedPlan.label || 'N/A'}</td></tr>
                                                                            <tr><td style={{ fontWeight: 600, color: '#333' }}>Capacity</td><td style={{ textAlign: 'right' }}>{selectedPlan.label?.toLowerCase() === 'unlimited' ? <span style={{ color: '#0d6efd', fontWeight: 600 }}>Unlimited</span> : <>{selectedPlan.capacity || 'N/A'}Ltr</>}</td></tr>

                                                                            <tr><td style={{ fontWeight: 600, color: '#333' }}>Payment Type</td><td style={{ textAlign: 'right' }}>{payment.paymentType || 'N/A'}</td></tr>
                                                                            <tr><td style={{ fontWeight: 600, color: '#333' }}>Duration</td><td style={{ textAlign: 'right' }}>{selectedDuration.duration_time_limit || 'N/A'}</td></tr>
                                                                            <tr><td style={{ fontWeight: 600, color: '#333' }}>Price</td><td style={{ textAlign: 'right' }}>₹{payment.price || order.price || 'N/A'}</td></tr>
                                                                            <tr><td style={{ fontWeight: 600, color: '#333' }}>Discount ({selectedDuration.discount || 0}%)</td><td style={{ textAlign: 'right' }}>₹{payment.discountAmount || 0}</td></tr>
                                                                            <tr><td style={{ fontWeight: 600, color: '#333' }}>Discounted Price</td><td style={{ textAlign: 'right' }}>₹{payment.discountedPrice || 0}</td></tr>
                                                                            <tr><td style={{ fontWeight: 600, color: '#333' }}>GST ({selectedDuration.gst || 0}%)</td><td style={{ textAlign: 'right' }}>₹{payment.gstAmount || 0}</td></tr>
                                                                            <tr><td style={{ fontWeight: 600, color: '#333' }}>Subtotal</td><td style={{ textAlign: 'right' }}>₹{payment.subtotal || order.priceWithGST || 0}</td></tr>

                                                                            {(order.orderType !== 'Recharge' && !order.isRecharge) && <tr><td style={{ fontWeight: 600, color: '#333' }}>Security Deposit</td><td style={{ textAlign: 'right' }}>₹{selectedDuration.security_deposit || 0}</td></tr>}

                                                                            {payment.paymentType === 'COD' && Number(payment.codFee) > 0 && <tr><td style={{ fontWeight: 600, color: '#333' }}>COD Fee</td><td style={{ textAlign: 'right' }}>₹{payment.codFee}</td></tr>}

                                                                            <tr><td style={{ fontWeight: 700, color: '#000' }}>Grand Total</td><td style={{ textAlign: 'right', color: '#0d6efd', fontWeight: 700 }}>₹{order.grandTotal || payment.totalPrice || 0}</td></tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>

                                                            {/* Right Column */}
                                                            <div className="col-md-5">
                                                                <div style={{ borderTop: '1px solid #0d6efd', padding: '20px', backgroundColor: '#fff', borderRadius: '10px', height: '100%' }}>
                                                                    <h5 style={{ color: '#0d6efd', fontWeight: 700, fontSize: '16px', borderBottom: '2px solid #0d6efd', display: 'inline-block', marginBottom: '15px' }}>Delivery Address</h5>

                                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                                        <tbody>
                                                                            <tr><td style={{ fontWeight: 600, color: '#333' }}>Name</td><td style={{ textAlign: 'right', color: '#333' }}>{address.name || 'N/A'}</td></tr>
                                                                            <tr><td style={{ fontWeight: 600, color: '#333' }}>Phone</td><td style={{ textAlign: 'right', color: '#333' }}>{address.phone || 'N/A'}</td></tr>
                                                                            <tr><td style={{ fontWeight: 600, color: '#333' }}>Email</td><td style={{ textAlign: 'right', color: '#333' }}>{address.email || 'N/A'}</td></tr>
                                                                            <tr><td style={{ fontWeight: 600, color: '#333' }}>Address</td><td style={{ textAlign: 'right', color: '#333' }}>{address.street || 'N/A'}, {address.landmark || ''}<br />{address.city || ''}, {address.district || ''}, {address.state || ''} - {address.pincode || ''}</td></tr>
                                                                        </tbody>
                                                                    </table>

                                                                    <hr style={{ textAlign: 'center', color: '#0d6efd' }} />

                                                                    <p style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}><strong>Order Status</strong><span style={getStatusClass2(order.orderStatus)}>{order.orderStatus || 'N/A'}</span></p>

                                                                    <p style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}><strong>Payment Status</strong><span style={getStatusClass2(payment.paymentStatus)}>{payment.paymentStatus || 'N/A'}</span></p>

                                                                    {!(order.orderType === 'Recharge' || order.isRecharge) && <p style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}><strong>Installation Status</strong><span style={getStatusClass2(order.task_status)}>{order.task_status || 'N/A'}</span></p>}

                                                                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                                                        <button className="btn btn-primary" style={{ background: order.task_status === 'Completed' ? '#0d6efd' : '#b0b0b0', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, cursor: order.task_status === 'Completed' ? 'pointer' : 'not-allowed', opacity: order.task_status === 'Completed' ? 1 : 0.6, transition: 'all 0.3s ease' }} disabled={order.task_status !== 'Completed'} onClick={(e) => { e.stopPropagation(); if (order.task_status === 'Completed') handleDownloadInvoice(order.customOrderId || payment.orderId); }}>
                                                                            <i className="bi bi-download" style={{ marginRight: '5px' }} /> Download Invoice
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ padding: '20px' }}>No records found</div>
                                )}
                            </div>
                        )}

                        {/* Pager */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '8px' }}>
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page <= 1}
                                style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    transition: "border-radius 0.3s ease"
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderRadius = "20px")}
                                onMouseLeave={(e) => (e.currentTarget.style.borderRadius = "6px")}
                            >
                                Prev
                            </button>
                            {getPagerRange().map(p => (
                                <button
                                    key={p}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePageChange(p);
                                    }}
                                    style={{
                                        padding: "6px 10px",
                                        background: p === page ? "#0d6efd" : "#fff",
                                        color: p === page ? "#fff" : "#000",
                                        border: "1px solid #ddd",
                                        borderRadius: "6px",
                                        transition: "border-radius 0.3s ease"
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.borderRadius = "20px")}
                                    onMouseLeave={(e) => (e.currentTarget.style.borderRadius = "6px")}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= totalPages}
                                style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    transition: "border-radius 0.3s ease"
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderRadius = "20px")}
                                onMouseLeave={(e) => (e.currentTarget.style.borderRadius = "6px")}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

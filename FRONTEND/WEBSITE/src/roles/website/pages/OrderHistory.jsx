import React, { useEffect, useState, useCallback, useMemo, Suspense, useRef } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from "axios";

// Lazy-load OrderItem for optimization
const LazyOrderItem = React.lazy(() => Promise.resolve({
    default: React.memo(function OrderItem({ payment, order, index, expanded, onToggleExpand, onDownloadInvoice }) {
        const address = order?.deliveryAddress || {};
        const selectedPlan = order?.selectedPlan || {};
        const selectedDuration = order?.selectedDuration || {};
        const displayOrderId = order?.customOrderId || payment?.orderId || 'N/A';

        const deliveryTimeline = useMemo(() => {
            const steps = [
                { key: 'accepted', label: 'Order Accepted' },
                { key: 'packed', label: 'Order Packed' },
                { key: 'intransit', label: 'Shipped' },
                { key: 'outfordelivery', label: 'Out For Delivery' },
                { key: 'completed', label: 'Delivered' }
            ];
            return steps.map(step => {
                let history = null;
                if (step.key === 'accepted') {
                    // Handle boolean or string for acceptance
                    const accepted = typeof order?.deliveryAcceptanceStatus === 'string'
                        ? order.deliveryAcceptanceStatus.toLowerCase() === 'accepted'
                        : !!order?.deliveryAcceptanceStatus;
                    if (accepted) {
                        history = { timestamp: order.deliveryAcceptanceTimestamp, notes: 'Order accepted by system' };
                    }
                }
                if (!history && Array.isArray(order?.deliveryHistory)) {
                    history = order.deliveryHistory.find(h => h.status === step.key);
                }
                return { label: step.label, date: history ? formatDateToIST(history.timestamp) : null, notes: history ? history.notes : null, isCompleted: !!history };
            });
        }, [order]);

        return (
            <div className="order-item" onClick={() => onToggleExpand(order?._id || payment?._id || `${index}`)}>
                <div className="order-main">
                    <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                        {(order?.main_image || order?.product_model_images?.main_img) ? (
                            <img
                                className="product-thumb"
                                src={`/upload/img/${order?.main_image || order?.product_model_images?.main_img}`}
                                alt={order?.modelName || 'product'}
                                loading="lazy"
                                decoding="async"
                            />
                        ) : (
                            <div style={{ width: 100, height: 100, borderRadius: 8, border: '2px solid #0d6efd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d6efd', fontWeight: 700 }}>N/A</div>
                        )}

                        <div>
                            <h5 style={{ color: '#0d83fd', margin: 0 }}>Order ID: {displayOrderId}</h5>
                            <p style={{ margin: '6px 0' }}><strong>Model Name:</strong> {order?.modelName || 'N/A'}</p>
                            <p style={{ margin: '6px 0' }}><strong>Model Type:</strong> {order?.modeltype || 'N/A'}</p>
                            <p style={{ margin: '6px 0' }}><strong>WP Device ID:</strong> {order?.wp_device_id || 'N/A'}</p>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        {order?.orderType === 'Recharge' || order?.isRecharge ? (
                            <p><strong>Status: </strong><span style={{ fontWeight: 600, color: 'green' }}>{order?.orderType || 'N/A'}</span></p>
                        ) : (
                            <p>
                                <strong>Delivery Status </strong>
                                <span className="status-pill" style={getStatusStyle(order?.deliveryCurrentStatus)}>
                                    {order?.deliveryCurrentStatus || 'N/A'}
                                </span>
                            </p>
                        )}
                    </div>
                </div>

                {expanded && (
                    <div style={{ paddingTop: 16 }}>
                        {/* Timeline */}
                        {!(order?.orderType === 'Recharge' || order?.isRecharge) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 'calc(10px)', left: '5%', right: '5%', height: '2px', backgroundColor: '#ccc', zIndex: 0 }} />
                                {deliveryTimeline.map((step, i, arr) => {
                                    const isLast = i === arr.length - 1;
                                    const nextStep = arr[i + 1];
                                    const showGreenLine = step.isCompleted && nextStep?.isCompleted;

                                    return (
                                        <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 2 }}>
                                            {!isLast && <div style={{ position: 'absolute', top: 'calc(10px)', left: '50%', width: '100%', height: '2px', backgroundColor: showGreenLine ? '#28a745' : 'transparent', zIndex: 1, transition: 'background-color 0.3s ease' }} />}
                                            <div className="timeline-dot" style={{ backgroundColor: step.isCompleted ? '#28a745' : '#ccc' }} />
                                            <div style={{ marginTop: 10, fontWeight: 600 }}>{step.label}</div>
                                            <div style={{ color: step.isCompleted ? '#28a745' : '#888', fontSize: 13, marginTop: 3 }}>{step.date || '—'}</div>
                                            <div style={{ color: step.notes ? '#555' : '#888', fontSize: 12, marginTop: 4 }}>{step.notes || 'Pending update'}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div style={{
                            display: 'flex',
                            gap: 20,
                            alignItems: 'flex-start',
                            width: '100%',
                            flexWrap: 'wrap',
                        }}>
                            {/* Left - Plan & Payment Details */}
                            <div style={{ flex: '1 1 350px', minWidth: '300px' }}>
                                <div style={{ borderTop: '1px solid #0d6efd', padding: 20, backgroundColor: '#fff', borderRadius: 10 }}>
                                    <h5 style={{ color: '#0d6efd', fontWeight: 700, fontSize: 16, borderBottom: '2px solid #0d6efd', display: 'inline-block', marginBottom: 12 }}>Plan & Payment Details</h5>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            <tr><td style={{ fontWeight: 600 }}>Model</td><td style={{ textAlign: 'right', color: '#0d6efd', fontWeight: 600 }}>{order?.modelName || 'N/A'}</td></tr>
                                            <tr><td style={{ fontWeight: 600 }}>Plan</td><td style={{ textAlign: 'right', color: '#0d6efd', fontWeight: 600 }}>{selectedPlan.label || 'N/A'}</td></tr>
                                            <tr><td style={{ fontWeight: 600 }}>Capacity</td><td style={{ textAlign: 'right' }}>{selectedPlan.label?.toLowerCase() === 'unlimited' ? <span style={{ color: '#0d6efd', fontWeight: 600 }}>Unlimited</span> : <>{selectedPlan.capacity || 'N/A'}Ltr</>}</td></tr>
                                            <tr><td style={{ fontWeight: 600 }}>Payment Type</td><td style={{ textAlign: 'right' }}>{payment?.paymentType || 'N/A'}</td></tr>
                                            <tr><td style={{ fontWeight: 600 }}>Duration</td><td style={{ textAlign: 'right' }}>{selectedDuration.duration_time_limit || 'N/A'}</td></tr>
                                            <tr><td style={{ fontWeight: 600 }}>Price</td><td style={{ textAlign: 'right' }}>₹{payment?.price || order?.price || 'N/A'}</td></tr>
                                            <tr><td style={{ fontWeight: 600 }}>Discount ({selectedDuration.discount || 0}%)</td><td style={{ textAlign: 'right' }}>₹{payment?.discountAmount || 0}</td></tr>
                                            <tr><td style={{ fontWeight: 600 }}>Discounted Price</td><td style={{ textAlign: 'right' }}>₹{payment?.discountedPrice || 0}</td></tr>
                                            <tr><td style={{ fontWeight: 600 }}>GST ({selectedDuration.gst || 0}%)</td><td style={{ textAlign: 'right' }}>₹{payment?.gstAmount || 0}</td></tr>
                                            <tr><td style={{ fontWeight: 600 }}>Subtotal</td><td style={{ textAlign: 'right' }}>₹{payment?.subtotal || order?.priceWithGST || 0}</td></tr>
                                            {(order?.orderType !== 'Recharge' && !order?.isRecharge) && <tr><td style={{ fontWeight: 600 }}>Security Deposit</td><td style={{ textAlign: 'right' }}>₹{selectedDuration.security_deposit || 0}</td></tr>}
                                            {payment?.paymentType === 'COD' && Number(payment?.codFee) > 0 && <tr><td style={{ fontWeight: 600 }}>COD Fee</td><td style={{ textAlign: 'right' }}>₹{payment?.codFee}</td></tr>}
                                            <tr><td style={{ fontWeight: 700 }}>Grand Total</td><td style={{ textAlign: 'right', color: '#0d6efd', fontWeight: 700 }}>₹{order?.grandTotal || payment?.totalPrice || 0}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Right - Delivery Address */}
                            <div style={{ flex: '1 1 350px', minWidth: '300px' }}>
                                <div style={{ borderTop: '1px solid #0d6efd', padding: 20, backgroundColor: '#fff', borderRadius: 10 }}>
                                    <h5 style={{ color: '#0d6efd', fontWeight: 700, fontSize: 16, borderBottom: '2px solid #0d6efd', display: 'inline-block', marginBottom: 12 }}>Delivery Address</h5>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            <tr><td style={{ fontWeight: 600 }}>Name</td><td style={{ textAlign: 'right' }}>{address?.name || 'N/A'}</td></tr>
                                            <tr><td style={{ fontWeight: 600 }}>Phone</td><td style={{ textAlign: 'right' }}>{address?.phone || 'N/A'}</td></tr>
                                            <tr><td style={{ fontWeight: 600 }}>Email</td><td style={{ textAlign: 'right' }}>{address?.email || 'N/A'}</td></tr>
                                            <tr><td style={{ fontWeight: 600 }}>Address</td><td style={{ textAlign: 'right' }}>{address?.street || 'N/A'}, {address?.landmark || ''}<br />{address?.city || ''}, {address?.district || ''}, {address?.state || ''} - {address?.pincode || ''}</td></tr>
                                        </tbody>
                                    </table>

                                    <hr style={{ margin: '12px 0', borderColor: '#0d6efd' }} />

                                    <p style={{ display: 'flex', justifyContent: 'space-between', margin: 4 }}><strong>Order Status</strong><span className="status-pill" style={getStatusStyle(order?.orderStatus)}>{order?.orderStatus || 'N/A'}</span></p>
                                    <p style={{ display: 'flex', justifyContent: 'space-between', margin: 4 }}><strong>Payment Status</strong><span className="status-pill" style={getStatusStyle(payment?.paymentStatus)}>{payment?.paymentStatus || 'N/A'}</span></p>
                                    {!(order?.orderType === 'Recharge' || order?.isRecharge) && <p style={{ display: 'flex', justifyContent: 'space-between', margin: 4 }}><strong>Installation Status</strong><span className="status-pill" style={getStatusStyle(order?.task_status)}>{order?.task_status || 'N/A'}</span></p>}

                                    <div style={{ textAlign: 'center', marginTop: 20 }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{
                                                background: order?.task_status === 'Completed' ? '#0d6efd' : '#b0b0b0',
                                                border: 'none', padding: '8px 20px', borderRadius: 6, fontWeight: 600,
                                                cursor: order?.task_status === 'Completed' ? 'pointer' : 'not-allowed', opacity: order?.task_status === 'Completed' ? 1 : 0.6
                                            }}
                                            disabled={order?.task_status !== 'Completed'}
                                            onClick={(e) => { e.stopPropagation(); if (order?.task_status === 'Completed') onDownloadInvoice(order?.customOrderId || payment?.orderId); }}
                                        >
                                            <i className="bi bi-download" style={{ marginRight: 6 }} /> Download Invoice
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }, (prev, next) => prev.payment === next.payment && prev.expanded === next.expanded && prev.index === next.index)
}));

function formatDateToIST(dateString) {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const SkeletonLoader = () => (
    <div style={{ display: 'flex', gap: 15, padding: 15, marginBottom: 10, backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: 8 }}>
        <div style={{ width: 100, height: 100, borderRadius: 8, backgroundColor: '#e0e0e0', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ flex: 1 }}>
            <div style={{ height: 20, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 10, animation: 'pulse 1.5s ease-in-out infinite', width: '60%' }} />
            <div style={{ height: 16, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite', width: '80%' }} />
            <div style={{ height: 16, backgroundColor: '#e0e0e0', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite', width: '70%' }} />
        </div>
    </div>
);

const styles = `
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.order-item { transition: border 0.18s ease, background-color 0.18s ease; border-radius: 8px; padding: 15px; margin-bottom: 10px; background-color: #fff; border: 1px solid #ddd; cursor: pointer; }
.order-item:hover { background-color: #f8f9fa; border: 1px solid #0d83fd; transform: translateY(-2px); box-shadow: 0 6px 18px rgba(13, 131, 253, 0.06); }
.order-item .order-main { display:flex; justify-content:space-between; align-items:center; gap: 15px; }
.order-item img.product-thumb { width:100px; height:100px; border-radius:8px; border: 2px solid #0d6efd; object-fit:cover; }
.timeline-dot { width:20px; height:20px; border-radius:50%; margin: 0 auto; transition: background-color .2s ease; }
.small-muted { color:#666; font-size:13px; }
.status-pill { padding: 2px 8px; border-radius: 4px; display:inline-block; font-weight:600; }
.pager-button { padding:8px 12px; border-radius: 10px; cursor:pointer; min-width:40px; text-align:center; }
.pager-button.active { background-color:#0d6efd; color:#fff; border:2px solid #0d6efd; font-weight:700; box-shadow: 0 3px 8px rgba(0,0,0,0.15); }
.pager-controls { display:flex; justify-content:center; align-items:center; gap:10px; margin-top:25px; }
.loader { text-align:center; padding:20px; }
`;

const getStatusStyle = (status) => {
    if (!status) return { color: '#6c757d', backgroundColor: '#f8f9fa', borderLeft: '4px solid #6c757d' };
    const s = ('' + status).toLowerCase();
    if (['confirmed', 'completed'].includes(s)) return { color: '#28a745', backgroundColor: '#e6f4ea', borderLeft: '4px solid #28a745' };
    if (['pending', 'created'].includes(s)) return { color: '#e67e22', backgroundColor: '#fef5e7', borderLeft: '4px solid #e67e22' };
    return { color: '#6c757d', backgroundColor: '#f8f9fa', borderLeft: '4px solid #6c757d' };
};

export default function OrderHistory({ userInfo, token, handleLogout }) {
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(2);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const cacheRef = useRef({});
    const abortControllerRef = useRef(null);
    const requestIdRef = useRef(0);

    const fetchPage = useCallback(async (pageToFetch, isBackground = false) => {
        if (!userInfo?.user_id) return;

        if (cacheRef.current[pageToFetch]) {
            const cached = cacheRef.current[pageToFetch];
            setPaymentHistory(cached.data);
            setTotalPages(cached.totalPages);
            setTotalRecords(cached.totalRecords);
            setLoading(false);
            return;
        }

        const currentRequestId = ++requestIdRef.current;

        if (!isBackground) {
            setLoading(true);
        }
        setError(null);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const body = { user_id: userInfo.user_id, page: pageToFetch, limit };
            const resp = await axios.post("/api/website/products/fetchpaymenthistory", body, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            });

            if (currentRequestId !== requestIdRef.current) return;

            if (resp?.data && resp.data.success) {
                const serverData = Array.isArray(resp.data.data) ? resp.data.data : [];
                const totalPagesRes = resp.data.totalPages || 1;
                const totalRecordsRes = resp.data.totalRecords || 0;

                cacheRef.current[pageToFetch] = {
                    data: serverData,
                    totalPages: totalPagesRes,
                    totalRecords: totalRecordsRes
                };

                setPaymentHistory(serverData);
                setTotalPages(totalPagesRes);
                setTotalRecords(totalRecordsRes);
            } else {
                setPaymentHistory([]);
                setTotalPages(1);
                setTotalRecords(0);
                setError('No data found');
            }
        } catch (err) {
            if (currentRequestId !== requestIdRef.current) return;

            if (err.name !== 'AbortError') {
                console.error("Error fetching payment history:", err);
                if (!isBackground) {
                    setError('Failed to load data. Please try again.');
                    setPaymentHistory([]);
                }
            }
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    }, [userInfo?.user_id, token, limit]);

    useEffect(() => {
        if (userInfo?.user_id) {
            fetchPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [page, userInfo?.user_id]);



    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const toggleExpand = useCallback((orderId) => {
        setExpandedOrderId(prev => (prev === orderId ? null : orderId));
    }, []);

    const handleDownloadInvoice = useCallback(async (orderId) => {
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
        } catch (err) {
            console.error("Error downloading invoice:", err);
            alert("Failed to download invoice. Please try again.");
        }
    }, [token]);

    const pagerRange = useMemo(() => {
        const visible = 7;
        const total = Math.max(1, totalPages);
        if (total <= visible) return Array.from({ length: total }, (_, i) => i + 1);

        let start = Math.max(1, page - Math.floor(visible / 2));
        let end = Math.min(total, start + visible - 1);
        if (end - start + 1 < visible) {
            start = Math.max(1, end - visible + 1);
        }

        const range = [];
        if (start > 1) range.push(1, '...');
        for (let i = start; i <= end; i++) range.push(i);
        if (end < total) range.push('...', total);
        return range;
    }, [page, totalPages]);

    const handlePageClick = (p) => {
        if (typeof p !== 'number' || p < 1 || p > totalPages) return;
        setPage(p);
    };

    return (
        <div>
            <style>{styles}</style>

            <Header userInfo={userInfo} handleLogout={handleLogout} />

            <main className="main">
                <section id="payment-history" className="payment-history section light-background" style={{ paddingTop: '110px' }}>
                    <div className="container section-title" data-aos="fade-up" style={{ paddingBottom: 0 }}>
                        <h2>Order History</h2>
                        <p>View your order history and subscription details</p>
                    </div>

                    <div className="container" data-aos="fade-up" data-aos-delay="100" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <div style={{ color: '#666' }}>
                                Showing page {page} of {totalPages} — {totalRecords} records
                            </div>
                        </div>

                        {error ? (
                            <div style={{ padding: 20, color: 'red' }}>{error}</div>
                        ) : (
                            <div>
                                {loading && paymentHistory.length === 0 ? (
                                    <div>{Array.from({ length: 3 }).map((_, i) => <SkeletonLoader key={i} />)}</div>
                                ) : paymentHistory.length > 0 ? (
                                    paymentHistory.map((payment, idx) => {
                                        const order = (payment.orders && payment.orders[0]) || {};
                                        const key = order._id || payment._id || `${page}-${idx}`;
                                        const isExpanded = expandedOrderId === (order._id || payment._id || `${idx}`);
                                        return (
                                            <Suspense key={key} fallback={<SkeletonLoader />}>
                                                <LazyOrderItem
                                                    payment={payment}
                                                    order={order}
                                                    index={idx}
                                                    expanded={isExpanded}
                                                    onToggleExpand={toggleExpand}
                                                    onDownloadInvoice={handleDownloadInvoice}
                                                />
                                            </Suspense>
                                        );
                                    })
                                ) : (
                                    <div style={{ padding: 20 }}>No records found</div>
                                )}
                            </div>
                        )}

                        <div className="pager-controls" aria-label="Pagination">
                            <button className="pager-button" onClick={() => handlePageClick(Math.max(1, page - 1))} disabled={page <= 1 || loading} style={{ backgroundColor: page <= 1 ? '#e0e0e0' : '#0d6efd', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 10 }}>
                                Prev
                            </button>

                            {pagerRange.map((p, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handlePageClick(p)}
                                    className={`pager-button ${p === page ? 'active' : ''}`}
                                    disabled={typeof p !== 'number' || loading}
                                >
                                    {p}
                                </button>
                            ))}

                            <button className="pager-button" onClick={() => handlePageClick(Math.min(totalPages, page + 1))} disabled={page >= totalPages || loading} style={{ backgroundColor: page >= totalPages ? '#e0e0e0' : '#0d6efd', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 10 }}>
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
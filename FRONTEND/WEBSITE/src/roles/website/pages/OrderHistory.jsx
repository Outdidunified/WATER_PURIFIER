import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from "axios";

function formatDateToIST(dateString) {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* Static CSS to avoid inline-hover state updates */
const styles = `
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

/* Small status style resolver returned as inline style object only for color/border-left etc.
   These small objects are cheap; they only get created for the memoized OrderItem and won't
   cause parent re-rendering problems. */
const getStatusStyle = (status) => {
    if (!status) return { color: '#6c757d', backgroundColor: '#f8f9fa', borderLeft: '4px solid #6c757d' };
    const s = ('' + status).toLowerCase();
    if (['confirmed', 'completed'].includes(s)) return { color: '#28a745', backgroundColor: '#e6f4ea', borderLeft: '4px solid #28a745' };
    if (['pending', 'created'].includes(s)) return { color: '#e67e22', backgroundColor: '#fef5e7', borderLeft: '4px solid #e67e22' };
    return { color: '#6c757d', backgroundColor: '#f8f9fa', borderLeft: '4px solid #6c757d' };
};

/* Memoized, pure OrderItem. Only re-renders when `payment` or `expanded` changes. */
const OrderItem = React.memo(function OrderItem({ payment, order, index, expanded, onToggleExpand, onDownloadInvoice }) {
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
            if (step.key === 'accepted' && order?.deliveryAcceptanceStatus === 'accepted') {
                history = { timestamp: order.deliveryAcceptanceTimestamp, notes: 'Order accepted by system' };
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
                                {order?.deliveryCurrentStatus || (order?.deliveryAcceptanceStatus === true ? 'Order Confirmed' : (order?.deliveryAcceptanceStatus === false ? 'Awaiting Confirmation' : 'N/A'))}
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

                    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', width: '110%' }}>
                        {/* Left */}
                        <div style={{ width: 600 }}>
                            <div style={{ borderTop: '1px solid #0d6efd', padding: 20, backgroundColor: '#fff', borderRadius: 10 }}>
                                <h5 style={{ color: '#0d6efd', fontWeight: 700, fontSize: 16, borderBottom: '2px solid #0d6efd', display: 'inline-block', marginBottom: 12 }}>Plan & Payment Details</h5>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        <tr><td style={{ fontWeight: 600 }}>Model</td><td style={{ textAlign: 'right', color: '#0d6efd', fontWeight: 600 }}>{order?.modelName || 'N/A'}</td></tr>
                                        <tr><td style={{ fontWeight: 600 }}>Plan</td><td style={{ textAlign: 'right', color: '#0d6efd', fontWeight: 600 }}>{selectedPlan.label || 'N/A'}</td></tr>
                                        <tr><td style={{ fontWeight: 600 }}>Capacity</td><td style={{ textAlign: 'right' }}>{selectedPlan.label?.toLowerCase() === 'unlimited' ? <span style={{ color: '#0d6efd', fontWeight: 600 }}>Unlimited</span> : <>{selectedPlan.capacity || 'N/A'}Ltr</>}</td></tr>
                                        <tr><td style={{ fontWeight: 600 }}>Payment Type</td><td style={{ textAlign: 'right' }}>{payment?.paymentType || 'N/A'}</td></tr>
                                        {/* <hr style={{ margin: '12px 0', borderColor: '#0d6efd' }} /> */}
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

                        {/* Right */}
                        <div style={{ width: 620 }}>
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
}, (prev, next) => {
    // custom props equality: shallow compare payment._id and whether expanded changed
    return prev.payment === next.payment && prev.expanded === next.expanded && prev.index === next.index;
});

export default function OrderHistory({ userInfo, token, handleLogout }) {
    const [paymentHistory, setPaymentHistory] = useState([]); // page-by-page appended
    const [loading, setLoading] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    // pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(3); // you asked for 3
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // FIX: Always reset page to 1 on first mount
    useEffect(() => {
        setPage(1);
    }, []);
    const firstLoadRef = useRef(true);

    // sentinel for intersection observer (auto-load next page)
    const sentinelRef = useRef(null);
    const abortControllerRef = useRef(null);
    const loadingMoreRef = useRef(false);

    // fetch page (append optionally)
    const fetchPage = useCallback(async (pageToFetch, append = false) => {
        if (!userInfo?.user_id) return;
        // cancel previous request
        if (abortControllerRef.current) {
            try { abortControllerRef.current.abort(); } catch (e) { /* ignore */ }
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        loadingMoreRef.current = true;
        try {
            const body = { user_id: userInfo.user_id, page: pageToFetch, limit };
            const resp = await axios.post("/api/website/products/fetchpaymenthistory", body, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            });

            if (resp?.data && resp.data.success) {
                const serverData = Array.isArray(resp.data.data) ? resp.data.data : [];
                setTotalPages(resp.data.totalPages || 1);
                setTotalRecords(resp.data.totalRecords || 0);

                setPaymentHistory(prev => {
                    if (append && pageToFetch > 1) {
                        // avoid duplicates: check last page
                        const ids = new Set(prev.map(p => p._id || p.orderId));
                        const itemsToAdd = serverData.filter(item => !ids.has(item._id || item.orderId));
                        return [...prev, ...itemsToAdd];
                    } else {
                        // replace (page navigation)
                        return serverData;
                    }
                });
            } else {
                if (!append) {
                    setPaymentHistory([]);
                    setTotalPages(1);
                    setTotalRecords(0);
                }
            }
        } catch (err) {
            if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
                // fetch cancelled - ignore
            } else {
                console.error("Error fetching payment history:", err);
            }
            if (!append) {
                // on error for replace fetch, clear
                // (optional) don't aggressively clear on transient errors
            }
        } finally {
            setLoading(false);
            loadingMoreRef.current = false;
            abortControllerRef.current = null;
        }
    }, [userInfo?.user_id, token, limit]);

    // initial load and when page changes via manual pager (replace result)
    useEffect(() => {
        // If user clicked manual pager, we replace results; otherwise auto-load appends
        fetchPage(page, false);
        // scroll-to-top on manual page change
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, fetchPage]);

    // IntersectionObserver: when sentinel visible and there are more pages, load next page (append)
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        if (typeof IntersectionObserver === 'undefined') return;

        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {

                    // block auto-load on first mount
                    if (firstLoadRef.current) {
                        firstLoadRef.current = false;
                        return;
                    }

                    // if not currently loading and more pages exist
                    if (!loadingMoreRef.current && page < totalPages) {
                        const nextPage = page + 1;
                        fetchPage(nextPage, true);
                        setPage(nextPage);
                    }
                }
            });
        }, { root: null, rootMargin: '300px', threshold: 0.1 });

        obs.observe(sentinel);
        return () => obs.disconnect();
    }, [page, totalPages, fetchPage]);

    // cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                try { abortControllerRef.current.abort(); } catch (e) { }
            }
            document.body.style.overflow = 'auto';
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

    // pager generation (memoized)
    const pagerRange = useMemo(() => {
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
    }, [page, totalPages]);

    const handlePageClick = (p) => {
        if (p < 1 || p > totalPages) return;
        // manual page click: fetch and replace items
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

                        {loading && paymentHistory.length === 0 ? (
                            <div className="loader">Loading...</div>
                        ) : (
                            <div>
                                {Array.isArray(paymentHistory) && paymentHistory.length > 0 ? (
                                    paymentHistory.map((payment, idx) => {
                                        const order = (payment.orders && payment.orders[0]) || {};
                                        const key = order._id || payment._id || `${page}-${idx}`;
                                        const isExpanded = expandedOrderId === (order._id || payment._id || `${idx}`);
                                        return (
                                            <OrderItem
                                                key={key}
                                                payment={payment}
                                                order={order}
                                                index={idx}
                                                expanded={isExpanded}
                                                onToggleExpand={toggleExpand}
                                                onDownloadInvoice={handleDownloadInvoice}
                                            />
                                        );
                                    })
                                ) : (
                                    <div style={{ padding: 20 }}>No records found</div>
                                )}

                                {/* sentinel for lazy loading next page */}
                                <div ref={sentinelRef} style={{ height: 1, width: '100%' }} />

                                {loading && paymentHistory.length > 0 && <div className="loader">Loading more...</div>}
                            </div>
                        )}

                        {/* Pager */}
                        <div className="pager-controls" aria-label="Pagination">
                            <button className="pager-button" onClick={() => handlePageClick(Math.max(1, page - 1))} disabled={page <= 1} style={{ backgroundColor: page <= 1 ? '#e0e0e0' : '#0d6efd', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 10 }}>
                                Prev
                            </button>

                            {pagerRange.map(p => (
                                <button
                                    key={p}
                                    onClick={(e) => { e.stopPropagation(); handlePageClick(p); }}
                                    className={`pager-button ${p === page ? 'active' : ''}`}
                                >
                                    {p}
                                </button>
                            ))}

                            <button className="pager-button" onClick={() => handlePageClick(Math.min(totalPages, page + 1))} disabled={page >= totalPages} style={{ backgroundColor: page >= totalPages ? '#e0e0e0' : '#0d6efd', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 10 }}>
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

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import Chart from 'react-apexcharts';
import '@fortawesome/fontawesome-free/css/all.min.css';
import axiosInstance from '../../../../utils/utils';

const Dashboard = ({ userInfo, handleLogout }) => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState('daily'); // Default to daily view

    // Fetch data on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const isSeller = Number(userInfo?.role_id) === 4;
                const url = isSeller
                    ? '/api/admin/analytics/by-district'
                    : '/api/admin/analytics';
                const res = isSeller
                    ? await axiosInstance.get(url, { params: { district: userInfo?.district } })
                    : await axiosInstance.get(url);
                if (res.data?.status === 'Success') {
                    setAnalyticsData(res.data.data);
                } else {
                    setError('Failed to fetch analytics data');
                }
            } catch (err) {
                setError('Error fetching data: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [userInfo]); // Add userInfo as a dependency to re-run if it changes

    // Stats cards based on API data
    const stats = analyticsData
        ? [
            { icon: 'fas fa-credit-card', label: 'Total Payments', value: analyticsData.payments.total },
            { icon: 'fas fa-check-circle', label: 'Successful Payments', value: analyticsData.payments.successful },
            { icon: 'fas fa-shopping-cart', label: 'Total Orders', value: analyticsData.orders.total },
            { icon: 'fas fa-check-circle', label: 'Successful Orders', value: analyticsData.orders.successful },
            { icon: 'fas fa-users', label: 'Total Users', value: analyticsData.users.total },
            { icon: 'fas fa-store', label: 'Total Sellers', value: analyticsData.users.seller },
            { icon: 'fas fa-user', label: 'Total End Users', value: analyticsData.users.end_user },
            { icon: 'fas fa-tools', label: 'Total Technicians', value: analyticsData.users.technician },
            {
                icon: 'fas fa-rupee-sign',
                label: 'Total Revenue (INR)',
                value: `₹${analyticsData.revenue.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
        ]
        : [];

    // Helper function to get chart data based on timeframe
    const getChartData = () => {
        if (!analyticsData) return {
            payments: { options: {}, series: [] },
            revenue: { options: {}, series: [] },
            users: { options: {}, series: [] }
        };

        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const timeframes = {
            daily: {
                labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`), // Days 1–30
                paymentsKey: 'successful',
                revenueKey: 'revenue',
                paymentsData: analyticsData.payments.timeline.month.slice(0, 30),
                revenueData: analyticsData.revenue.timeline.month.slice(0, 30),
                paymentsTitle: 'Successful Payments in September 2025 (Daily)',
                revenueTitle: 'Revenue in September 2025 (Daily)',
            },
            week: {
                labels: ['1st Week', '2nd Week', '3rd Week', '4th Week'],
                paymentsKey: 'successful',
                revenueKey: 'revenue',
                paymentsData: [
                    { successful: analyticsData.payments.timeline.month.slice(0, 7).reduce((sum, item) => sum + item.successful, 0) },
                    { successful: analyticsData.payments.timeline.month.slice(7, 14).reduce((sum, item) => sum + item.successful, 0) },
                    { successful: analyticsData.payments.timeline.month.slice(14, 21).reduce((sum, item) => sum + item.successful, 0) },
                    { successful: analyticsData.payments.timeline.month.slice(21, 28).reduce((sum, item) => sum + item.successful, 0) },
                ],
                revenueData: [
                    { revenue: analyticsData.revenue.timeline.month.slice(0, 7).reduce((sum, item) => sum + item.revenue, 0) },
                    { revenue: analyticsData.revenue.timeline.month.slice(7, 14).reduce((sum, item) => sum + item.revenue, 0) },
                    { revenue: analyticsData.revenue.timeline.month.slice(14, 21).reduce((sum, item) => sum + item.revenue, 0) },
                    { revenue: analyticsData.revenue.timeline.month.slice(21, 28).reduce((sum, item) => sum + item.revenue, 0) },
                ],
                paymentsTitle: 'Successful Payments in September 2025 (Weekly)',
                revenueTitle: 'Revenue in September 2025 (Weekly)',
            },
            month: {
                labels: months,
                paymentsKey: 'successful',
                revenueKey: 'revenue',
                paymentsData: analyticsData.payments.timeline.year,
                revenueData: analyticsData.revenue.timeline.year,
                paymentsTitle: 'Successful Payments in 2025 (Monthly)',
                revenueTitle: 'Revenue in 2025 (Monthly)',
            },
            year: {
                labels: ['2024', '2025', '2026'],
                paymentsKey: 'successful',
                revenueKey: 'revenue',
                paymentsData: [
                    { successful: 0 }, // Placeholder for 2024
                    { successful: analyticsData.payments.timeline.year.reduce((sum, item) => sum + item.successful, 0) }, // 2025
                    { successful: 0 }, // Placeholder for 2026
                ],
                revenueData: [
                    { revenue: 0 }, // Placeholder for 2024
                    { revenue: analyticsData.revenue.timeline.year.reduce((sum, item) => sum + item.revenue, 0) }, // 2025
                    { revenue: 0 }, // Placeholder for 2026
                ],
                paymentsTitle: 'Successful Payments (Yearly)',
                revenueTitle: 'Revenue (Yearly)',
            },
        };

        const selected = timeframes[timeframe];

        // Users Pie Chart (constant across timeframes)
        const usersChart = {
            options: {
                chart: { id: 'users-chart', toolbar: { show: false } },
                labels: ['Sellers', 'End Users', 'Technicians'],
                title: {
                    text: 'User Distribution',
                    align: 'center',
                    style: { fontSize: '20px', fontWeight: '700', color: '#007bff' },
                },
                colors: ['#007BFF', '#FF6F61', '#4B49AC'],
                dataLabels: { enabled: true },
                legend: { position: 'bottom' },
            },
            series: [
                analyticsData.users.seller,
                analyticsData.users.end_user,
                analyticsData.users.technician,
            ],
        };

        return {
            payments: {
                options: {
                    chart: { id: 'successful-payments-chart', toolbar: { show: false } },
                    xaxis: {
                        categories: selected.labels,
                        labels: { rotate: -45 },
                    },
                    plotOptions: { bar: { columnWidth: '30%', borderRadius: 6 } },
                    title: {
                        text: selected.paymentsTitle,
                        align: 'center',
                        style: { fontSize: '20px', fontWeight: '700', color: '#007BFF' },
                    },
                    colors: ['#007BFF'],
                    dataLabels: { enabled: false },
                    grid: { borderColor: '#ddd' },
                },
                series: [{
                    name: 'Successful Payments',
                    data: selected.paymentsData.map(item => item[selected.paymentsKey]),
                }],
            },
            revenue: {
                options: {
                    chart: { id: 'monthly-revenue-chart', toolbar: { show: false } },
                    xaxis: {
                        categories: selected.labels,
                        labels: { rotate: -45 },
                    },
                    stroke: {
                        curve: 'smooth',
                        width: 3,
                    },
                    title: {
                        text: selected.revenueTitle,
                        align: 'center',
                        style: { fontSize: '20px', fontWeight: '700', color: '#4B49AC' },
                    },
                    colors: ['#FF6F61'],
                    dataLabels: { enabled: false },
                    grid: { borderColor: '#ddd' },
                    yaxis: {
                        labels: {
                            formatter: (val) => `₹${val.toFixed(2)}`,
                        },
                    },
                },
                series: [{
                    name: 'Revenue',
                    data: selected.revenueData.map(item => item[selected.revenueKey]),
                }],
            },
            users: usersChart,
        };
    };

    const { payments: paymentsChartData, revenue: revenueChartData, users: usersChartData } = getChartData();

    if (error) {
        return <div style={{ textAlign: 'center', fontSize: '1.2rem', color: '#FF6F61' }}>{error}</div>;
    }

    return (
        <div className="container-scroller">
            <Header userInfo={userInfo} handleLogout={handleLogout} />
            <div
                className="container-fluid page-body-wrapper"
                style={{ backgroundColor: '#f9fafc', perspective: '1000px' }}
            >
                <Sidebar />
                <div className="main-panel">
                    <div className="content-wrapper">
                        {loading ? (
                            // ----------- LOADING SPINNER -----------
                            <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
                                <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                                </div>
                            </div>
                        ) : (
                            // ----------- DASHBOARD CONTENT -----------
                            <>
                                {/* Header Row */}
                                <div className="row mb-4">
                                    <div className="col-md-12 d-flex justify-content-between align-items-center admin-header">
                                        <div>
                                            <h4
                                                className="font-weight-normal"
                                                style={{ fontSize: '1.4rem', color: '#555' }}
                                            >
                                                Welcome,&nbsp;
                                                <span style={{ color: '#6C63FF' }}>{userInfo?.email}</span>
                                            </h4>
                                        </div>
                                        <button
                                            className="btn btn-primary"
                                            style={{
                                                padding: '8px 16px',
                                                transform: 'translateZ(0)',
                                                transition: 'transform 0.2s ease-in-out',
                                            }}
                                            onClick={() => window.location.reload()}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.transform =
                                                    'translateZ(10px) scale(1.05)')
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.transform = 'translateZ(0) scale(1)')
                                            }
                                        >
                                            <i className="fa fa-sync"></i> Reload Data
                                        </button>
                                    </div>
                                </div>

                                {/* Stats Cards & Users Pie Chart */}
                                <div className="row mb-4">
                                    {/* Stats Cards */}
                                    <div className="col-md-6">
                                        <div className="row">
                                            {stats.map(({ icon, label, value }, idx) => (
                                                <div
                                                    key={idx}
                                                    className={
                                                        idx === stats.length - 1
                                                            ? 'col-md-12 mb-3'
                                                            : 'col-md-6 mb-3'
                                                    }
                                                    style={{
                                                        minWidth: idx === stats.length - 1 ? '100%' : '150px',
                                                    }}
                                                >
                                                    <div
                                                        className="stat-card"
                                                        style={{
                                                            backgroundColor: '#fff',
                                                            borderRadius: '10px',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            padding:
                                                                idx === stats.length - 1 ? '15px 24px' : '12px 18px',
                                                            cursor: 'default',
                                                            transition: 'transform 0.3s ease-in-out',
                                                            transformStyle: 'preserve-3d',
                                                        }}
                                                        onMouseEnter={(e) =>
                                                            (e.currentTarget.style.transform =
                                                                'translateZ(20px) rotateX(5deg) rotateY(5deg)')
                                                        }
                                                        onMouseLeave={(e) =>
                                                            (e.currentTarget.style.transform =
                                                                'translateZ(0) rotateX(0) rotateY(0)')
                                                        }
                                                    >
                                                        <i
                                                            className={icon}
                                                            style={{
                                                                fontSize: idx === stats.length - 1 ? '20px' : '18px',
                                                                color: '#007BFF',
                                                                marginRight: idx === stats.length - 1 ? '15px' : '10px',
                                                                minWidth: idx === stats.length - 1 ? '24px' : '20px',
                                                                textAlign: 'center',
                                                                transform: 'translateZ(10px)',
                                                            }}
                                                        />
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: idx === stats.length - 1 ? '14px' : '13px',
                                                                    fontWeight: '600',
                                                                    color: '#555',
                                                                }}
                                                            >
                                                                {label}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: idx === stats.length - 1 ? '18px' : '17px',
                                                                    fontWeight: '700',
                                                                    color: '#222',
                                                                    transform: 'translateZ(10px)',
                                                                }}
                                                            >
                                                                {value}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Users Pie Chart */}
                                    <div className="col-md-6">
                                        <div
                                            style={{
                                                backgroundColor: 'white',
                                                borderRadius: '16px',
                                                padding: '20px',
                                                boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                                                transition: 'transform 0.3s ease-in-out',
                                                transformStyle: 'preserve-3d',
                                                height: '100%',
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.transform =
                                                    'translateZ(30px) rotateX(3deg)')
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.transform =
                                                    'translateZ(0) rotateX(0)')
                                            }
                                        >
                                            <Chart
                                                options={usersChartData.options}
                                                series={usersChartData.series}
                                                type="pie"
                                                height={350}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Timeframe Toggle Buttons */}
                                <div
                                    className="row mb-4"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        paddingTop: '30px',
                                        alignItems: 'center',
                                    }}
                                >
                                    {['daily', 'week', 'month', 'year'].map((tf) => (
                                        <button
                                            key={tf}
                                            className={`btn ${timeframe === tf ? 'btn-primary' : 'btn-outline-primary'
                                                }`}
                                            style={{
                                                padding: '8px 20px',
                                                borderRadius: '8px',
                                                transform: timeframe === tf ? 'translateZ(10px)' : 'translateZ(0)',
                                                transition:
                                                    'transform 0.2s ease-in-out, background-color 0.2s',
                                                boxShadow:
                                                    timeframe === tf ? '0 4px 12px rgba(0,123,255,0.3)' : 'none',
                                            }}
                                            onClick={() => setTimeframe(tf)}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.transform =
                                                    'translateZ(15px) scale(1.05)')
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.transform =
                                                    timeframe === tf ? 'translateZ(10px)' : 'translateZ(0)')
                                            }
                                        >
                                            {tf.charAt(0).toUpperCase() + tf.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                {/* Payments & Revenue Charts */}
                                <div className="row mt-5">
                                    <div className="col-md-6">
                                        <div
                                            style={{
                                                backgroundColor: 'white',
                                                borderRadius: '16px',
                                                padding: '20px',
                                                boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                                                transition: 'transform 0.3s ease-in-out',
                                                transformStyle: 'preserve-3d',
                                                height: '100%',
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.transform =
                                                    'translateZ(30px) rotateX(3deg)')
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.transform =
                                                    'translateZ(0) rotateX(0)')
                                            }
                                        >
                                            <Chart
                                                options={paymentsChartData.options}
                                                series={paymentsChartData.series}
                                                type="bar"
                                                height={350}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div
                                            style={{
                                                backgroundColor: 'white',
                                                borderRadius: '16px',
                                                padding: '20px',
                                                boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                                                transition: 'transform 0.3s ease-in-out',
                                                transformStyle: 'preserve-3d',
                                                height: '100%',
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.transform =
                                                    'translateZ(30px) rotateX(3deg)')
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.transform =
                                                    'translateZ(0) rotateX(0)')
                                            }
                                        >
                                            <Chart
                                                options={revenueChartData.options}
                                                series={revenueChartData.series}
                                                type="line"
                                                height={350}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

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
    const [timeframe, setTimeframe] = useState('daily'); // Default to daily

    // Fetch analytics data
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
    }, [userInfo]);

    // Stats cards
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

    // Prepare chart data
    const getChartData = () => {
        if (!analyticsData) return {
            payments: { options: {}, series: [] },
            revenue: { options: {}, series: [] },
            users: { options: {}, series: [] },
            topDistricts: { options: {}, series: [] },
            topModels: { options: {}, series: [] }
        };

        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const timeframes = {
            daily: {
                labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
                paymentsData: analyticsData.payments.timeline.month.slice(0, 30),
                revenueData: analyticsData.revenue.timeline.month.slice(0, 30),
                districtsData: analyticsData.topDistricts.today,
                modelsData: analyticsData.topModels.today,
                paymentsTitle: 'Successful Payments in September 2025 (Daily)',
                revenueTitle: 'Revenue in September 2025 (Daily)',
                districtsTitle: 'Top Districts Today',
                modelsTitle: 'Top Models Today',
            },
            week: {
                labels: ['1st Week', '2nd Week', '3rd Week', '4th Week'],
                paymentsData: [
                    { successful: analyticsData.payments.timeline.month.slice(0, 7).reduce((sum, i) => sum + i.successful, 0) },
                    { successful: analyticsData.payments.timeline.month.slice(7, 14).reduce((sum, i) => sum + i.successful, 0) },
                    { successful: analyticsData.payments.timeline.month.slice(14, 21).reduce((sum, i) => sum + i.successful, 0) },
                    { successful: analyticsData.payments.timeline.month.slice(21, 28).reduce((sum, i) => sum + i.successful, 0) },
                ],
                revenueData: [
                    { revenue: analyticsData.revenue.timeline.month.slice(0, 7).reduce((sum, i) => sum + i.revenue, 0) },
                    { revenue: analyticsData.revenue.timeline.month.slice(7, 14).reduce((sum, i) => sum + i.revenue, 0) },
                    { revenue: analyticsData.revenue.timeline.month.slice(14, 21).reduce((sum, i) => sum + i.revenue, 0) },
                    { revenue: analyticsData.revenue.timeline.month.slice(21, 28).reduce((sum, i) => sum + i.revenue, 0) },
                ],
                districtsData: analyticsData.topDistricts.week,
                modelsData: analyticsData.topModels.week,
                paymentsTitle: 'Successful Payments in September 2025 (Weekly)',
                revenueTitle: 'Revenue in September 2025 (Weekly)',
                districtsTitle: 'Top Districts This Week',
                modelsTitle: 'Top Models This Week',
            },
            month: {
                labels: months,
                paymentsData: analyticsData.payments.timeline.year,
                revenueData: analyticsData.revenue.timeline.year,
                districtsData: analyticsData.topDistricts.month,
                modelsData: analyticsData.topModels.month,
                paymentsTitle: 'Successful Payments in 2025 (Monthly)',
                revenueTitle: 'Revenue in 2025 (Monthly)',
                districtsTitle: 'Top Districts This Month',
                modelsTitle: 'Top Models This Month',
            },
            year: {
                labels: ['2024', '2025', '2026'],
                paymentsData: [
                    { successful: 0 },
                    { successful: analyticsData.payments.timeline.year.reduce((sum, i) => sum + i.successful, 0) },
                    { successful: 0 },
                ],
                revenueData: [
                    { revenue: 0 },
                    { revenue: analyticsData.revenue.timeline.year.reduce((sum, i) => sum + i.revenue, 0) },
                    { revenue: 0 },
                ],
                districtsData: analyticsData.topDistricts.year,
                modelsData: analyticsData.topModels.year,
                paymentsTitle: 'Successful Payments (Yearly)',
                revenueTitle: 'Revenue (Yearly)',
                districtsTitle: 'Top Districts This Year',
                modelsTitle: 'Top Models This Year',
            },
        };

        const selected = timeframes[timeframe];

        const usersChart = {
            options: {
                chart: { id: 'users-chart', toolbar: { show: false } },
                labels: ['Sellers', 'End Users', 'Technicians'],
                title: { text: 'User Distribution', align: 'center', style: { fontSize: '20px', fontWeight: '700', color: '#007bff' } },
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

        const topDistrictsChart = analyticsData.topDistricts ? {
            options: {
                chart: { id: 'top-districts-chart', toolbar: { show: false } },
                plotOptions: { bar: { horizontal: true, barHeight: '30%' } },
                xaxis: { categories: selected.districtsData.map(d => d.districtName || '') },
                title: { text: selected.districtsTitle, align: 'center', style: { fontSize: '20px', fontWeight: '700', color: '#007bff' } },
                colors: ['#28a745'],
                dataLabels: { enabled: true },
            },
            series: [{ name: 'Devices Sold', data: selected.districtsData.map(d => d.devicesSold) }],
        } : { options: {}, series: [] };

        const topModelsChart = analyticsData.topModels ? {
            options: {
                chart: { id: 'top-models-chart', toolbar: { show: false } },
                plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 6 } },
                xaxis: { categories: selected.modelsData.map(m => m.modelName || '') },
                title: { text: selected.modelsTitle, align: 'center', style: { fontSize: '20px', fontWeight: '700', color: '#007bff' } },
                colors: ['#FF6F61'],
                dataLabels: { enabled: true },
            },
            series: [{ name: 'Devices Sold', data: selected.modelsData.map(m => m.devicesSold) }],
        } : { options: {}, series: [] };

        return {
            payments: {
                options: {
                    chart: { id: 'successful-payments-chart', toolbar: { show: false } },
                    xaxis: { categories: selected.labels, labels: { rotate: -45 } },
                    plotOptions: { bar: { columnWidth: '30%', borderRadius: 6 } },
                    title: { text: selected.paymentsTitle, align: 'center', style: { fontSize: '20px', fontWeight: '700', color: '#007BFF' } },
                    colors: ['#007BFF'],
                    dataLabels: { enabled: false },
                    grid: { borderColor: '#ddd' },
                },
                series: [{ name: 'Successful Payments', data: selected.paymentsData.map(i => i.successful) }],
            },
            revenue: {
                options: {
                    chart: { id: 'monthly-revenue-chart', toolbar: { show: false } },
                    xaxis: { categories: selected.labels, labels: { rotate: -45 } },
                    stroke: { curve: 'smooth', width: 3 },
                    title: { text: selected.revenueTitle, align: 'center', style: { fontSize: '20px', fontWeight: '700', color: '#4B49AC' } },
                    colors: ['#FF6F61'],
                    dataLabels: { enabled: false },
                    grid: { borderColor: '#ddd' },
                    yaxis: { labels: { formatter: val => `₹${val.toFixed(2)}` } },
                },
                series: [{ name: 'Revenue', data: selected.revenueData.map(i => i.revenue) }],
            },
            users: usersChart,
            topDistricts: topDistrictsChart,
            topModels: topModelsChart,
        };
    };

    const {
        payments: paymentsChartData,
        revenue: revenueChartData,
        users: usersChartData,
        topDistricts: topDistrictsChartData,
        topModels: topModelsChartData
    } = getChartData();

    if (error) {
        return <div style={{ textAlign: 'center', fontSize: '1.2rem', color: '#FF6F61' }}>{error}</div>;
    }

    return (
        <div className="container-scroller">
            <Header userInfo={userInfo} handleLogout={handleLogout} />
            <div className="container-fluid page-body-wrapper" style={{ backgroundColor: '#f9fafc' }}>
                <Sidebar />
                <div className="main-panel">
                    <div className="content-wrapper">
                        {loading ? (
                            <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
                                <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }} />
                            </div>
                        ) : (
                            <>
                                {/* Header Row */}
                                <div className="row mb-4">
                                    <div className="col-md-12 d-flex justify-content-between align-items-center admin-header">
                                        <h4>Welcome, <span style={{ color: '#6C63FF' }}>{userInfo?.email}</span></h4>
                                        <button className="btn btn-primary" onClick={() => window.location.reload()}>
                                            <i className="fa fa-sync"></i> Reload Data
                                        </button>
                                    </div>
                                </div>

                                {/* Stats Cards */}
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <div className="row">
                                            {stats.map(({ icon, label, value }, idx) => (
                                                <div key={idx} className={idx === stats.length - 1 ? 'col-md-12 mb-3' : 'col-md-6 mb-3'}>
                                                    <div className="stat-card" style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                                        <i className={icon} style={{ fontSize: '18px', color: '#007BFF', marginRight: '10px' }} />
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#555' }}>{label}</div>
                                                            <div style={{ fontSize: '17px', fontWeight: '700', color: '#222' }}>{value}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Users Pie Chart */}
                                    <div className="col-md-6">
                                        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
                                            <Chart options={usersChartData.options} series={usersChartData.series} type="pie" height={350} />
                                        </div>
                                    </div>
                                </div>

                                {/* Timeframe Buttons */}
                                <div className="row mb-4" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                    {['daily', 'week', 'month', 'year'].map(tf => (
                                        <button key={tf} className={`btn ${timeframe === tf ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTimeframe(tf)}>
                                            {tf.charAt(0).toUpperCase() + tf.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                {/* Payments & Revenue Charts */}
                                <div className="row mt-5">
                                    <div className="col-md-6">
                                        <Chart options={paymentsChartData.options} series={paymentsChartData.series} type="bar" height={350} />
                                    </div>
                                    <div className="col-md-6">
                                        <Chart options={revenueChartData.options} series={revenueChartData.series} type="line" height={350} />
                                    </div>
                                </div>

                                {/* Top Districts & Top Models Charts */}
                                <div className="row mt-5">
                                    <div className="col-md-6">
                                        <Chart options={topDistrictsChartData.options} series={topDistrictsChartData.series} type="bar" height={350} />
                                    </div>
                                    <div className="col-md-6">
                                        <Chart options={topModelsChartData.options} series={topModelsChartData.series} type="bar" height={350} />
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
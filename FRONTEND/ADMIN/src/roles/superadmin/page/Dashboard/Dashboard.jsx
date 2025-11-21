import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    const [districts, setDistricts] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState('all'); // Default to all
    const isFetchingRef = useRef(false);
    const lastFetchedParamsRef = useRef(null);
    const districtsFetchedRef = useRef(false);

    const isSeller = useMemo(() => Number(userInfo?.role_id) === 4, [userInfo?.role_id]);

    // Memoize API parameters to prevent unnecessary re-fetches
    const apiParams = useMemo(() => {
        if (isSeller) {
            return {
                url: '/api/admin/analytics/by-district',
                params: { district: userInfo?.district }
            };
        } else if (selectedDistrict !== 'all') {
            return {
                url: '/api/admin/analytics/by-district',
                params: { district: selectedDistrict }
            };
        } else {
            return {
                url: '/api/admin/analytics',
                params: {}
            };
        }
    }, [isSeller, userInfo?.district, selectedDistrict]);

    // Get current date information
    const currentDate = useMemo(() => {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth(), // 0-11
            monthName: now.toLocaleString('en-US', { month: 'long' }),
            date: now.getDate(),
            day: now.toLocaleString('en-US', { weekday: 'long' })
        };
    }, []);

    // Fetch districts for non-sellers
    useEffect(() => {
        if (!isSeller && !districtsFetchedRef.current) { // Only fetch once
            districtsFetchedRef.current = true;
            const fetchDistricts = async () => {
                try {
                    const res = await axiosInstance.get('/api/admin/GetDistrictsWithSellers');
                    if (res.data?.status === 'Success') {
                        setDistricts(res.data.data);
                    }
                } catch (err) {
                    console.error('Error fetching districts:', err);
                    districtsFetchedRef.current = false; // Reset on error
                }
            };
            fetchDistricts();
        }
    }, [isSeller]);

    // Fetch analytics data
    useEffect(() => {
        // Check if we already fetched for these exact params
        const paramsKey = JSON.stringify(apiParams);
        if (lastFetchedParamsRef.current === paramsKey || isFetchingRef.current) return;

        const loadData = async () => {
            isFetchingRef.current = true;
            lastFetchedParamsRef.current = paramsKey;
            try {
                setLoading(true);
                const res = await axiosInstance.get(apiParams.url, { params: apiParams.params });

                if (res.data?.status === 'Success') {
                    setAnalyticsData(res.data.data);
                } else {
                    setError('Failed to fetch analytics data');
                }
            } catch (err) {
                setError('Error fetching data: ' + err.message);
                lastFetchedParamsRef.current = null; // Reset on error to allow retry
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        };
        loadData();
    }, [apiParams]);

    // Stats cards
    const stats = analyticsData
        ? [
            { icon: 'fas fa-credit-card', label: 'Total Payments', value: analyticsData.payments.total },
            { icon: 'fas fa-check-circle', label: 'Successful Payments', value: analyticsData.payments.successful },
            { icon: 'fas fa-shopping-cart', label: 'Total Orders', value: analyticsData.orders.total },
            { icon: 'fas fa-check-circle', label: 'Successful Orders', value: analyticsData.orders.successful },
            { icon: 'fas fa-users', label: 'Total Users', value: isSeller ? analyticsData.users.end_user + analyticsData.users.technician : analyticsData.users.total },
            ...(isSeller ? [] : [
                { icon: 'fas fa-store', label: 'Total Sellers', value: analyticsData.users.seller }
            ]),
            { icon: 'fas fa-user', label: 'Total End Users', value: analyticsData.users.end_user },
            { icon: 'fas fa-tools', label: 'Total Technicians', value: analyticsData.users.technician },
            {
                icon: 'fas fa-rupee-sign',
                label: 'Total Revenue (INR)',
                value: `₹${analyticsData.revenue.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
        ]
        : [];

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
            paymentsTitle: `Successful Payments in ${currentDate.monthName} ${currentDate.year} (Daily)`,
            revenueTitle: `Revenue in ${currentDate.monthName} ${currentDate.year} (Daily)`,
            districtsTitle: `Top Districts Today (${currentDate.day})`,
            modelsTitle: `Top Models Today (${currentDate.day})`,
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
            paymentsTitle: `Successful Payments in ${currentDate.monthName} ${currentDate.year} (Weekly)`,
            revenueTitle: `Revenue in ${currentDate.monthName} ${currentDate.year} (Weekly)`,
            districtsTitle: 'Top Districts This Week',
            modelsTitle: 'Top Models This Week',
        },
        month: {
            labels: months,
            paymentsData: analyticsData.payments.timeline.year,
            revenueData: analyticsData.revenue.timeline.year,
            paymentsTitle: `Successful Payments in ${currentDate.year} (Monthly)`,
            revenueTitle: `Revenue in ${currentDate.year} (Monthly)`,
            districtsTitle: 'Top Districts This Month',
            modelsTitle: 'Top Models This Month',
        },
        year: {
            labels: [`${currentDate.year - 1}`, `${currentDate.year}`, `${currentDate.year + 1}`],
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
            paymentsTitle: `Successful Payments (${currentDate.year})`,
            revenueTitle: `Revenue (${currentDate.year})`,
            districtsTitle: `Top Districts in ${currentDate.year}`,
            modelsTitle: `Top Models in ${currentDate.year}`,
        },
    };

    const selected = timeframes[timeframe];

    if (isSeller || selectedDistrict !== 'all') {
        selected.districtsData = [];
        selected.modelsData = analyticsData.topModels ? analyticsData.topModels[timeframe === 'daily' ? 'today' : timeframe === 'week' ? 'week' : timeframe === 'month' ? 'month' : 'year'] || [] : [];
    } else {
        selected.districtsData = analyticsData.topDistricts ? analyticsData.topDistricts[timeframe === 'daily' ? 'today' : timeframe === 'week' ? 'week' : timeframe === 'month' ? 'month' : 'year'] || [] : [];
        selected.modelsData = analyticsData.topModels ? analyticsData.topModels[timeframe === 'daily' ? 'today' : timeframe === 'week' ? 'week' : timeframe === 'month' ? 'month' : 'year'] || [] : [];
    }

    const usersChart = {
        options: {
            chart: {
                id: 'users-chart',
                toolbar: { show: false },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800,
                }
            },
            labels: isSeller ? ['End Users', 'Technicians'] : ['Sellers', 'End Users', 'Technicians'],
            title: {
                text: 'User Distribution',
                align: 'center',
                style: {
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#424242',
                    fontFamily: 'inherit'
                }
            },
            colors: isSeller ? ['#f093fb', '#4facfe'] : ['#667eea', '#f093fb', '#4facfe'],
            dataLabels: {
                enabled: true,
                style: {
                    fontSize: '14px',
                    fontWeight: '600',
                    colors: ['#fff']
                }
            },
            legend: {
                position: 'bottom',
                fontSize: '14px',
                fontWeight: 500,
                markers: {
                    width: 12,
                    height: 12,
                    radius: 3
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Total Users',
                                fontSize: '18px',
                                fontWeight: 700,
                                color: '#424242'
                            }
                        }
                    }
                }
            }
        },
        series: isSeller ? [
            analyticsData.users.end_user,
            analyticsData.users.technician,
        ] : [
            analyticsData.users.seller,
            analyticsData.users.end_user,
            analyticsData.users.technician,
        ],
    };

    const topDistrictsChart = analyticsData.topDistricts ? {
        options: {
            chart: { 
                id: 'top-districts-chart', 
                toolbar: { show: false },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800,
                }
            },
            plotOptions: { 
                bar: { 
                    horizontal: true, 
                    barHeight: '60%',
                    borderRadius: 8,
                    dataLabels: {
                        enabled: true,
                        position: 'center', // Center the data labels inside the bars
                        style: {
                            colors: ['#fff'], // White text for contrast
                            fontSize: '12px',
                            fontWeight: 600
                        }
                    }
                } 
            },
            xaxis: { 
                categories: selected.districtsData.map(d => d.districtName || ''),
                labels: {
                    style: {
                        fontSize: '12px',
                        fontWeight: 500,
                        colors: '#757575'
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        fontSize: '12px',
                        fontWeight: 500,
                        colors: '#424242'
                    }
                }
            },
            title: { 
                text: selected.districtsTitle, 
                align: 'center', 
                style: { 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: '#424242',
                    fontFamily: 'inherit'
                } 
            },
            colors: ['#4facfe'],
            grid: { 
                borderColor: '#f1f1f1',
                strokeDashArray: 4
            },
            tooltip: {
                theme: 'light',
                y: {
                    formatter: val => `${val} devices`
                }
            }
        },
        series: [{ name: 'Devices Sold', data: selected.districtsData.map(d => d.devicesSold) }],
    } : { options: {}, series: [] };

    const topModelsChart = analyticsData.topModels ? {
        options: {
            chart: { 
                id: 'top-models-chart', 
                toolbar: { show: false },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800,
                }
            },
            plotOptions: { 
                bar: { 
                    horizontal: false, 
                    columnWidth: '20%', 
                    borderRadius: 8,
                    dataLabels: {
                        enabled: true,
                        position: 'center', // Center the data labels inside the bars
                        style: {
                            colors: ['#fff'], // White text for contrast
                            fontSize: '12px',
                            fontWeight: 600
                        }
                    }
                } 
            },
            xaxis: { 
                categories: selected.modelsData.map(m => m.modelName || ''),
                labels: {
                    rotate: -45,
                    style: {
                        fontSize: '11px',
                        fontWeight: 500,
                        colors: '#757575'
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        fontSize: '12px',
                        fontWeight: 500,
                        colors: '#757575'
                    }
                }
            },
            title: { 
                text: selected.modelsTitle, 
                align: 'center', 
                style: { 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: '#424242',
                    fontFamily: 'inherit'
                } 
            },
            colors: ['#43e97b'],
            grid: { 
                borderColor: '#f1f1f1',
                strokeDashArray: 4
            },
            tooltip: {
                theme: 'light',
                y: {
                    formatter: val => `${val} devices`
                }
            }
        },
        series: [{ name: 'Devices Sold', data: selected.modelsData.map(m => m.devicesSold) }],
    } : { options: {}, series: [] };

    return {
        payments: {
            options: {
                chart: { 
                    id: 'successful-payments-chart', 
                    toolbar: { show: false },
                    animations: {
                        enabled: true,
                        easing: 'easeinout',
                        speed: 800,
                    }
                },
                xaxis: { 
                    categories: selected.labels, 
                    labels: { 
                        rotate: -45,
                        style: {
                            fontSize: '12px',
                            fontWeight: 500,
                            colors: '#757575'
                        }
                    }
                },
                plotOptions: { 
                    bar: { 
                        columnWidth: '45%', 
                        borderRadius: 8,
                        distributed: false,
                        dataLabels: {
                            position: 'top'
                        }
                    } 
                },
                title: { 
                    text: selected.paymentsTitle, 
                    align: 'center', 
                    style: { 
                        fontSize: '18px', 
                        fontWeight: '700', 
                        color: '#424242',
                        fontFamily: 'inherit'
                    } 
                },
                colors: ['#667eea'],
                dataLabels: { 
                    enabled: true,
                    offsetY: -20,
                    style: {
                        fontSize: '12px',
                        colors: ['#667eea'],
                        fontWeight: 600
                    }
                },
                grid: { 
                    borderColor: '#f1f1f1',
                    strokeDashArray: 4,
                    xaxis: {
                        lines: {
                            show: true
                        }
                    }
                },
                tooltip: {
                    theme: 'light',
                    y: {
                        formatter: val => `${val} payments`
                    }
                }
            },
            series: [{ name: 'Successful Payments', data: selected.paymentsData.map(i => i.successful) }],
        },
        revenue: {
            options: {
                chart: { 
                    id: 'monthly-revenue-chart', 
                    toolbar: { show: false },
                    animations: {
                        enabled: true,
                        easing: 'easeinout',
                        speed: 800,
                    }
                },
                xaxis: { 
                    categories: selected.labels, 
                    labels: { 
                        rotate: -45,
                        style: {
                            fontSize: '12px',
                            fontWeight: 500,
                            colors: '#757575'
                        }
                    }
                },
                stroke: { curve: 'smooth', width: 4 },
                title: { 
                    text: selected.revenueTitle, 
                    align: 'center', 
                    style: { 
                        fontSize: '18px', 
                        fontWeight: '700', 
                        color: '#424242',
                        fontFamily: 'inherit'
                    } 
                },
                colors: ['#f093fb'],
                fill: {
                    type: 'gradient',
                    gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.7,
                        opacityTo: 0.3,
                        stops: [0, 90, 100]
                    }
                },
                dataLabels: { enabled: false },
                grid: { 
                    borderColor: '#f1f1f1',
                    strokeDashArray: 4
                },
                yaxis: { 
                    labels: { 
                        formatter: val => `₹${val.toLocaleString('en-IN', {maximumFractionDigits: 0})}`,
                        style: {
                            fontSize: '12px',
                            fontWeight: 500,
                            colors: '#757575'
                        } 
                    } 
                },
                markers: {
                    size: 5,
                    colors: ['#f093fb'],
                    strokeColors: '#fff',
                    strokeWidth: 2,
                    hover: {
                        size: 7
                    }
                },
                tooltip: {
                    theme: 'light',
                    y: {
                        formatter: val => `₹${val.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                    }
                }
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
                                {/* Header Row with Current Date */}
                                <div className="row mb-4">
                                    <div className="col-md-12">
                                        <div style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            borderRadius: '16px',
                                            padding: '24px 30px',
                                            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                                            color: 'white',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '15px'
                                        }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontWeight: '700', fontSize: '28px' }}>
                                                    Welcome, {userInfo?.email?.split('@')[0]}! 👋
                                                </h3>
                                                <p style={{ margin: '8px 0 0 0', opacity: 0.95, fontSize: '15px', fontWeight: '500' }}>
                                                    <i className="fas fa-calendar-day" style={{ marginRight: '8px' }}></i>
                                                    {currentDate.day}, {currentDate.monthName} {currentDate.date}, {currentDate.year}
                                                </p>
                                            </div>
                                            <button 
                                                className="btn" 
                                                onClick={() => window.location.reload()}
                                                style={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                                    border: '2px solid rgba(255, 255, 255, 0.5)',
                                                    color: 'white',
                                                    fontWeight: '600',
                                                    padding: '10px 24px',
                                                    borderRadius: '10px',
                                                    transition: 'all 0.3s ease',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.35)';
                                                    e.target.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                                                    e.target.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <i className="fa fa-sync" style={{ marginRight: '8px' }}></i> Refresh Data
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Cards */}
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <div className="row">
                                            {stats.map(({ icon, label, value }, idx) => {
                                                const colors = [
                                                    { bg: '#e3f2fd', icon: '#2196F3', gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)' },
                                                    { bg: '#e8f5e9', icon: '#4CAF50', gradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' },
                                                    { bg: '#fff3e0', icon: '#FF9800', gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)' },
                                                    { bg: '#f3e5f5', icon: '#9C27B0', gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)' },
                                                    { bg: '#e0f2f1', icon: '#009688', gradient: 'linear-gradient(135deg, #009688 0%, #00796B 100%)' },
                                                    { bg: '#fce4ec', icon: '#E91E63', gradient: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)' },
                                                    { bg: '#e8eaf6', icon: '#3F51B5', gradient: 'linear-gradient(135deg, #3F51B5 0%, #303F9F 100%)' },
                                                    { bg: '#fff8e1', icon: '#FFC107', gradient: 'linear-gradient(135deg, #FFC107 0%, #FFA000 100%)' },
                                                    { bg: '#ffebee', icon: '#F44336', gradient: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)' },
                                                ];
                                                const colorScheme = colors[idx % colors.length];
                                                
                                                return (
                                                    <div key={idx} className={isSeller || idx !== stats.length - 1 ? 'col-md-6 mb-3' : 'col-md-12 mb-3'}>
                                                        <div 
                                                            className="stat-card" 
                                                            style={{ 
                                                                padding: '20px', 
                                                                backgroundColor: '#fff', 
                                                                borderRadius: '16px', 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                                                border: '1px solid rgba(0,0,0,0.05)',
                                                                transition: 'all 0.3s ease',
                                                                cursor: 'pointer',
                                                                position: 'relative',
                                                                overflow: 'hidden'
                                                            }}
                                                            onMouseOver={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(-5px)';
                                                                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
                                                            }}
                                                            onMouseOut={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: '56px',
                                                                height: '56px',
                                                                borderRadius: '14px',
                                                                background: colorScheme.gradient,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                marginRight: '16px',
                                                                boxShadow: `0 4px 12px ${colorScheme.icon}40`
                                                            }}>
                                                                <i className={icon} style={{ fontSize: '24px', color: '#fff' }} />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#757575', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                    {label}
                                                                </div>
                                                                <div style={{ fontSize: '22px', fontWeight: '700', color: '#212121' }}>
                                                                    {value}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Users Donut Chart */}
                                    <div className="col-md-6">
                                        <div style={{
                                            backgroundColor: 'white',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                            border: '1px solid rgba(0,0,0,0.05)',
                                            height: '100%',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                                        }}>
                                            <Chart options={usersChartData.options} series={usersChartData.series} type="donut" height={350} />
                                        </div>
                                    </div>
                                </div>

                                {/* Timeframe and District Filters */}
                                <div className="row mb-4">
                                    <div className="col-md-12">
                                        <div style={{
                                            backgroundColor: 'white',
                                            borderRadius: '16px',
                                            padding: '20px',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                            border: '1px solid rgba(0,0,0,0.05)',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '12px',
                                            flexWrap: 'wrap'
                                        }}>
                                            <span style={{ fontSize: '16px', fontWeight: '600', color: '#424242', marginRight: '10px' }}>
                                                <i className="fas fa-chart-line" style={{ marginRight: '8px', color: '#667eea' }}></i>
                                                View
                                            </span>
                                            
                                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#757575' }}></span>
                                            {['daily', 'week', 'month', 'year'].map(tf => (
                                                <button
                                                    key={tf}
                                                    onClick={() => setTimeframe(tf)}
                                                    style={{
                                                        padding: '10px 24px',
                                                        borderRadius: '10px',
                                                        border: timeframe === tf ? 'none' : '2px solid #667eea',
                                                        background: timeframe === tf ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                                                        color: timeframe === tf ? 'white' : '#667eea',
                                                        fontWeight: '600',
                                                        fontSize: '14px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        textTransform: 'capitalize',
                                                        boxShadow: timeframe === tf ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        if (timeframe !== tf) {
                                                            e.target.style.backgroundColor = '#f5f7ff';
                                                        }
                                                        e.target.style.transform = 'translateY(-2px)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        if (timeframe !== tf) {
                                                            e.target.style.backgroundColor = 'white';
                                                        }
                                                        e.target.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    {tf.charAt(0).toUpperCase() + tf.slice(1)}ly
                                                </button>
                                                
                                            ))}
                                            {!isSeller && (
                                                <>
                                                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#757575' }}></span>
                                                    <select
                                                        value={selectedDistrict}
                                                        onChange={(e) => setSelectedDistrict(e.target.value)}
                                                        style={{
                                                            padding: '8px 12px',
                                                            borderRadius: '8px',
                                                            border: '2px solid #e0e0e0',
                                                            backgroundColor: 'white',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#424242',
                                                            cursor: 'pointer',
                                                            minWidth: '150px',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.target.style.borderColor = '#667eea';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.target.style.borderColor = '#e0e0e0';
                                                        }}
                                                    >
                                                        <option value="all">All Districts</option>
                                                        {districts.map((district, idx) => (
                                                            <option key={idx} value={district.district}>
                                                                {district.district} ({district.state})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#757575', margin: '0 10px' }}></span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Payments & Revenue Charts */}
                                <div className="row mt-4 mb-4">
                                    <div className="col-md-6 mb-4">
                                        <div style={{ 
                                            backgroundColor: 'white', 
                                            borderRadius: '16px', 
                                            padding: '24px', 
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                            border: '1px solid rgba(0,0,0,0.05)',
                                            transition: 'all 0.3s ease',
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                                        }}>
                                            <Chart options={paymentsChartData.options} series={paymentsChartData.series} type="bar" height={350} />
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-4">
                                        <div style={{ 
                                            backgroundColor: 'white', 
                                            borderRadius: '16px', 
                                            padding: '24px', 
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                            border: '1px solid rgba(0,0,0,0.05)',
                                            transition: 'all 0.3s ease',
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                                        }}>
                                            <Chart options={revenueChartData.options} series={revenueChartData.series} type="line" height={350} />
                                        </div>
                                    </div>
                                </div>

                                {/* Top Districts & Top Models Charts */}
                                <div className="row mb-4">
                                    {!isSeller && selectedDistrict === 'all' && (
                                        <div className="col-md-6 mb-4">
                                            <div style={{ 
                                                backgroundColor: 'white', 
                                                borderRadius: '16px', 
                                                padding: '24px', 
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                                border: '1px solid rgba(0,0,0,0.05)',
                                                transition: 'all 0.3s ease',
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                                            }}>
                                                <Chart options={topDistrictsChartData.options} series={topDistrictsChartData.series} type="bar" height={350} />
                                            </div>
                                        </div>
                                    )}
                                    <div className={isSeller || selectedDistrict !== 'all' ? "col-md-12 mb-4" : "col-md-6 mb-4"}>
                                        <div style={{ 
                                            backgroundColor: 'white', 
                                            borderRadius: '16px', 
                                            padding: '24px', 
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                            border: '1px solid rgba(0,0,0,0.05)',
                                            transition: 'all 0.3s ease',
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                                        }}>
                                            <Chart options={topModelsChartData.options} series={topModelsChartData.series} type="bar" height={350} />
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
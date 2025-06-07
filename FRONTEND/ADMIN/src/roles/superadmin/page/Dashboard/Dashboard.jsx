//Dashboard
import React from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import Chart from 'react-apexcharts';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Dashboard = ({ userInfo, handleLogout, fetchData }) => {
  const barChartData = {
    options: {
      chart: { id: 'water-consumption-chart', toolbar: { show: false } },
      xaxis: {
        categories: [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ],
        labels: { rotate: -45 },
      },
      plotOptions: { bar: { columnWidth: '30%', borderRadius: 6 } },
      title: {
        text: 'Monthly Water Consumption (Litres)',
        align: 'center',
        style: { fontSize: '20px', fontWeight: '700', color: '#007BFF' },
      },
      colors: ['#007BFF'],
      dataLabels: { enabled: false },
      grid: { borderColor: '#ddd' },
    },
    series: [{
      name: 'Consumption',
      data: [1200, 1500, 1100, 1700, 1300, 1400, 1600, 1350, 1500, 1700, 1800, 1600],
    }],
  };

  const revenueChartData = {
    options: {
      chart: { id: 'monthly-revenue-chart', toolbar: { show: false } },
      xaxis: {
        categories: [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ],
        labels: { rotate: -45 },
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      title: {
        text: 'Monthly Revenue (USD)',
        align: 'center',
        style: { fontSize: '20px', fontWeight: '700', color: '#4B49AC' },
      },
      colors: ['#FF6F61'],
      dataLabels: { enabled: false },
      grid: { borderColor: '#ddd' },
      yaxis: {
        labels: {
          formatter: (val) => `$${val}`,
        },
      },
    },
    series: [{
      name: 'Revenue',
      data: [8000, 9200, 7000, 11000, 9500, 10200, 12000, 11500, 11800, 13000, 14000, 13500],
    }],
  };

  // Stats without circle backgrounds for icons
  const stats = [
    { icon: 'fas fa-users', label: 'Total Subscriptions', value: 120 },
    { icon: 'fas fa-sync-alt', label: 'Renewals This Month', value: 40 },
    { icon: 'fas fa-chart-line', label: 'Growth Rate (%)', value: 12 },
    { icon: 'fas fa-credit-card', label: 'Total Payments', value: 250 },
    { icon: 'fas fa-hand-holding-usd', label: 'Pending Payments', value: 18 },
  ];

  return (
    <>
      <Header userInfo={userInfo} handleLogout={handleLogout} />
      <div className="container-fluid page-body-wrapper" style={{ backgroundColor: '#f9fafc' }}>
        <Sidebar />
        <div className="main-panel" style={{ padding: '30px 40px' }}>
          <div className="content-wrapper">
            <div className="row mb-4">
              <div className="col-md-12 d-flex justify-content-between align-items-center admin-header">
                <div>
                  
                  <h4
  className="font-weight-normal"
  style={{ fontSize: '1.4rem', color: '#555' }}
>
  Welcome, <span style={{ color: '#6C63FF' }}>Super Admin</span>
</h4>

                </div>
                {/* Uncomment if you want a reload button */}
                {/* <button className="btn btn-primary" onClick={fetchData}>
                  <i className="fa fa-sync"></i> Reload Data
                </button> */}
              </div>
            </div>

            {/* Stats Cards */}
            <div
              className="stats-container"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'flex-start',
              }}
            >
              {stats.map(({ icon, label, value }, idx) => (
                <div
                  key={idx}
                  className="stat-card"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '10px',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
                    flex: '1 1 calc(20% - 12px)', // ~5 cards per row minus gap
                    minWidth: '140px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 24px',
                    cursor: 'default',
                    transition: 'transform 0.15s ease-in-out',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <i
                    className={icon}
                    style={{
                      fontSize: '20px',
                      color: '#007BFF',
                      marginRight: '10px',
                      minWidth: '24px',
                      textAlign: 'center',
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#555' }}>{label}</div>
                    <div style={{ fontSize: '17px', fontWeight: '700', color: '#222' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Water Consumption Bar Chart */}
            <div className="row mt-5">
              <div className="col-md-12">
                <div
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '30px',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                  }}
                >
                  <Chart
                    options={barChartData.options}
                    series={barChartData.series}
                    type="bar"
                    height={380}
                  />
                </div>
              </div>
            </div>

            {/* Revenue Line Chart */}
            <div className="row mt-5">
              <div className="col-md-12">
                <div
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '30px',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                  }}
                >
                  <Chart
                    options={revenueChartData.options}
                    series={revenueChartData.series}
                    type="line"
                    height={380}
                  />
                </div>
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </>
  );
};

export default Dashboard;

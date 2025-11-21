//ManageProducts
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from '../../../../utils/InputField';
import useManageProducts from '../../hooks/ManageProducts/ManageProductsHooks';
import Pagination from '../../components/Pagination/Pagination';

const ManageProducts = ({ userInfo, handleLogout }) => {
    const navigate = useNavigate();
    const [showModelFilter, setShowModelFilter] = useState(false);

    const {
        posts,
        loading,
        error,
        handleSearchInputChange,
        handleModelSelect,
        resetModelFilter,
        modelOptions,
        selectedModel,
        totalModels,
        currentPage,
        pageSize,
        totalRecords,
        getPaginatedData,
        getTotalPages,
        handlePageChange,
        handlePageSizeChange,
    } = useManageProducts(userInfo);

    const handleAddProduct = () => {
        navigate('/superadmin/AddProducts');
    };

    const handleViewProduct = (dataItem) => {
        navigate(`/superadmin/ViewProducts`, { state: { dataItem } });
    };

    const summaryCardStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #4c5bfd 0%, #7c8bff 100%)',
        color: '#ffffff',
        borderRadius: '18px',
        padding: '9px 16px',
        boxShadow: '0 10px 22px rgba(76, 91, 253, 0.25)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        width: 'auto',
        minHeight: '44px',
        minWidth: '160px',
        border: 'none',
        outline: 'none',
    };
    const summaryCardContentStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: '12px',
    };
    const summaryTextStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        lineHeight: 1.1,
    };
    const summaryLabelStyle = {
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'none',
        opacity: 0.9,
        whiteSpace: 'nowrap',
    };
    const summaryValueStyle = {
        fontSize: '20px',
        fontWeight: 700,
        lineHeight: 1,
    };
    const summaryCaretStyle = {
        fontSize: '18px',
        opacity: 0.85,
    };

    const handleSummaryCardClick = () => {
        setShowModelFilter((prev) => !prev);
    };

    const handleModelChange = (event) => {
        const { value } = event.target;
        if (value === '') {
            resetModelFilter();
        } else {
            handleModelSelect(value);
        }
    };

    const handleClearSelection = () => {
        resetModelFilter();
    };

    return (
        <div className='container-scroller'>
            <Header userInfo={userInfo} handleLogout={handleLogout} />
            <div className="container-fluid page-body-wrapper">
                <Sidebar />
                <div className="main-panel">
                    <div className="content-wrapper">
                        <div className="row" style={{ marginBottom: '0px' }}>
                            <div className="col-md-12 grid-margin" style={{ marginBottom: '10px' }}>
                                <div className="row align-items-center gx-3 gy-2 flex-wrap">
                                    <div className="col-auto">
                                        <h3 className="font-weight-bold mb-0" style={{ fontSize: '22px' }}>
                                            Manage Models
                                        </h3>
                                    </div>
                                    <div className="col-auto">
                                        <button
                                            type="button"
                                            style={summaryCardStyle}
                                            onClick={handleSummaryCardClick}
                                        >
                                            <div style={summaryCardContentStyle}>
                                                <div style={summaryTextStyle}>
                                                    <span style={summaryLabelStyle}>Total Models</span>
                                                    <span style={summaryValueStyle}>{totalModels}</span>
                                                </div>
                                            </div>
                                            <i
                                                className={`mdi ${showModelFilter ? 'mdi-chevron-up' : 'mdi-chevron-down'}`}
                                                style={summaryCaretStyle}
                                            ></i>
                                        </button>
                                    </div>
{showModelFilter && (
    <div className="col-auto">
        <div 
            style={{
                backgroundColor: "#fff",
                borderRadius: "18px",
                boxShadow: "0 10px 24px rgba(23,36,184,0.12)",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                height: "48px"
            }}
        >

            {/* LEFT TEXT */}
            <span 
                style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1b2559",
                    whiteSpace: "nowrap"
                }}
            >
                Filter by model
            </span>

            {/* DROPDOWN */}
            <select
                className="form-select"
                value={selectedModel}
                onChange={handleModelChange}
                style={{
                    borderRadius: "12px",
                    padding: "6px 12px",
                    borderColor: "#d5dbff",
                    width: "160px"
                }}
            >
                <option value="">All Models</option>
                {modelOptions.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>

            {/* CLEAR BUTTON */}
            {selectedModel && (
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleClearSelection}
                    style={{ whiteSpace: "nowrap" }}
                >
                    Clear
                </button>
            )}
        </div>
    </div>
)}


                                    <div className="col ms-auto d-flex justify-content-end">
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={handleAddProduct}
                                            style={{ padding: '10px 30px', fontSize: '14px', borderRadius: '12px', background: '#006bff', borderColor: '#006bff' }}
                                        >
                                            Create Model
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search and Table */}
                        <div className="row">
                            <div className="col-lg-12 grid-margin stretch-card">
                                <div className="card">
                                    <div className="card-body">
                                        {/* Search */}
                                        <div className="row">
                                            <div className="col-md-12 grid-margin" style={{ marginBottom: '8px' }}>
                                                <div className="row">
                                                    <div className="col-4 col-xl-8">
                                                        <h4 className="card-title" style={{ paddingTop: '6px', marginBottom: '6px' }}>
                                                            List of Models
                                                        </h4>
                                                    </div>
                                                    <div className="col-8 col-xl-4">
                                                        <div className="input-group">
                                                            <div className="input-group-prepend hover-cursor">
                                                                <span className="input-group-text" id="search">
                                                                    <i className="icon-search"></i>
                                                                </span>
                                                            </div>
                                                            <InputField
                                                                placeholder="Search now"
                                                                ariaLabel="search"
                                                                autoComplete="off"
                                                                ariadescribedby="search"
                                                                onChange={handleSearchInputChange}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Product Table */}
                                        <div className="table-responsive dynamic-table">
                                            <table className="table table-striped text-center">
                                                <thead style={{ textAlign: 'center', position: 'sticky', tableLayout: 'fixed', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                                                    <tr>
                                                        <th>Sl.No</th>
                                                        <th>Model Name</th>
                                                        <th>Model Type</th>
                                                        <th>Quantity</th>
                                                        <th>Created By</th>
                                                        <th>Created Date</th>
                                                        <th>Status</th>
                                                        <th>Options</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {loading ? (
                                                        <tr>
                                                            <td colSpan="8">Loading...</td>
                                                        </tr>
                                                    ) : error ? (
                                                        <tr>
                                                            <td colSpan="8">Error: {error}</td>
                                                        </tr>
                                                    ) : (
                                                        Array.isArray(posts) && posts.length > 0 ? (
                                                            getPaginatedData().map((dataItem, index) => (
                                                                <tr key={dataItem.model_id || dataItem.id || index}>
                                                                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                                                    <td style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '250px' }}>{dataItem.model_name || '-'}</td>
                                                                    <td>{dataItem.model_type || '-'}</td>
                                                                    <td>{dataItem.wp_device_quantity ?? '-'}</td>
                                                                    <td>{dataItem.createdby || '-'}</td>
                                                                    <td>{dataItem.createddate ? new Date(dataItem.createddate).toLocaleString() : '-'}</td>
                                                                    <td>
                                                                        <span className={dataItem.status ? 'text-success' : 'text-danger'}>
                                                                            {dataItem.status ? 'Active' : 'Inactive'}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-outline-success btn-icon-text"
                                                                            onClick={() => handleViewProduct(dataItem)}
                                                                        >
                                                                            <i className="mdi mdi-eye"></i> View
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="8">No models found.</td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {totalRecords > 0 && (
                                            <Pagination
                                                currentPage={currentPage}
                                                totalPages={getTotalPages()}
                                                pageSize={pageSize}
                                                onPageChange={handlePageChange}
                                                onPageSizeChange={handlePageSizeChange}
                                                totalRecords={totalRecords}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default ManageProducts;

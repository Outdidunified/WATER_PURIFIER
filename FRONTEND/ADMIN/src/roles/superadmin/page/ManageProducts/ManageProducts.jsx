//ManageProducts
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import InputField from '../../../../utils/InputField';
import useManageProducts from '../../hooks/ManageProducts/ManageProductsHooks';

const ManageProducts = ({ userInfo, handleLogout }) => {
    const navigate = useNavigate();

    const {
        posts,
        loading,
        error,
        handleSearchInputChange,
    } = useManageProducts(userInfo);

    const handleAddProduct = () => {
        navigate('/superadmin/AddProducts');
    };

    const handleViewProduct = (dataItem) => {
        navigate(`/superadmin/ViewProducts`, { state: { dataItem } });
    };

    return (
        <div className='container-scroller'>
            <Header userInfo={userInfo} handleLogout={handleLogout} />
            <div className="container-fluid page-body-wrapper">
                <Sidebar />
                <div className="main-panel">
                    <div className="content-wrapper">
                        <div className="row">
                            <div className="col-md-12 grid-margin">
                                <div className="row">
                                    <div className="col-12 col-xl-6 mb-4 mb-xl-0">
                                        <h3 className="font-weight-bold">Manage Products</h3>
                                    </div>
                                    <div className="col-12 col-xl-6">
                                        <div className="justify-content-end d-flex">
                                            <button
                                                type="button"
                                                className="btn btn-success"
                                                onClick={handleAddProduct}
                                                style={{ marginBottom: '10px', marginRight: '10px' }}
                                            >
                                                Create
                                            </button>
                                        </div>
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
                                            <div className="col-md-12 grid-margin">
                                                <div className="row">
                                                    <div className="col-4 col-xl-8">
                                                        <h4 className="card-title" style={{ paddingTop: '10px' }}>
                                                            List of Products
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
                                        <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                            <table className="table table-striped">
                                                <thead style={{ textAlign: 'center', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                                                    <tr>
                                                        <th>Sl.No</th>
                                                        <th>Model Name</th>
                                                        <th>Image</th>
                                                        <th>Quantity</th>
                                                        <th>Status</th>
                                                        <th>Option</th>
                                                    </tr>
                                                </thead>
                                                <tbody style={{ textAlign: 'center' }}>
                                                    {loading ? (
                                                        <tr>
                                                            <td colSpan="6">Loading...</td>
                                                        </tr>
                                                    ) : error ? (
                                                        <tr>
                                                            <td colSpan="6">Error: {error}</td>
                                                        </tr>
                                                    ) : (
                                                        Array.isArray(posts) && posts.length > 0 ? (
                                                            posts.map((dataItem, index) => (
                                                                <tr key={index}>
                                                                    <td>{index + 1}</td>
                                                                    <td >{dataItem.model_name || '-'}</td>
                                                                    <td className="py-1">
                                                                        <img
                                                                            src={`/upload/img/${dataItem.main_img}`}
                                                                            alt="Product"
                                                                            style={{
                                                                                width: '100px',
                                                                                height: 'auto',
                                                                                objectFit: 'contain',
                                                                                borderRadius: '15px',
                                                                            }}
                                                                        />



                                                                    </td>
                                                                    <td>{dataItem.wp_device_quantity ?? '-'}</td>
                                                                    <td>
                                                                        {dataItem.status
                                                                            ? <span className="text-success">Active</span>
                                                                            : <span className="text-danger">DeActive</span>
                                                                        }
                                                                    </td>
                                                                    <td>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-outline-success btn-icon-text"
                                                                            onClick={() => handleViewProduct(dataItem)}
                                                                            style={{ marginBottom: '10px', marginRight: '10px' }}
                                                                        >
                                                                            <i className="mdi mdi-eye"></i>View
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="6">No products found</td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
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

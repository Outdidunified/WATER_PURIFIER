import React from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
const Blog = ({ userInfo, token, handleLogout }) => {
    return (
        <div>

            {/* Header */}
            <Header userInfo={userInfo} handleLogout={handleLogout} />

            <main className="main">

                {/* <!-- Contact Section --> */}
                <section id="hero" className="hero section">

                    {/* <!-- Section Title --> */}
                    <div className="container section-title" data-aos="fade-up" style={{ paddingBottom: '0px' }}>
                        <h2>ionHive Blogs</h2>
                        <p>ionHive: India's most trusted customized water purifier. Read about the water purifier, its technology, healthy lifestyle habits with safe water and more!</p>
                    </div>
                    {/* <!-- End Section Title --> */}

                </section>
                {/* <!-- /Contact Section --> */}

                {/* <!-- Contact Section --> */}
                <section id="contact" style={{ textAlign: 'center', padding: '1rem', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', maxWidth: '1140px', width: '100%', gap: '1rem', justifyContent: 'space-between', }}>
                        <div style={{ backgroundColor: '#d5d5d5', borderRadius: '20px', padding: '1rem', width: '32%', minWidth: '280px', height: '300px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', }}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <img alt="img"
                                    src="assets/img/3-copper-alive-product-features-production.webp"
                                    style={{ width: '100%', height: '175px', objectFit: 'cover', borderRadius: '10px', marginBottom: '0.5rem', }}
                                />
                                <h5 style={{ margin: '0 0 0.3rem 0', fontSize: '0.9rem' }}>
                                    pH-Balanced Water Benefits | Improve Hydration & Well-Being
                                </h5>
                                <p style={{ fontStyle: 'italic', margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>
                                    On May 15, 2025 By ionHive
                                </p>
                                <h5 style={{ color: '#0d83fd', marginTop: 'auto', fontSize: '0.9rem' }}>
                                    <a href="#view" style={{ color: '#0d83fd', textDecoration: 'none' }}>View</a>
                                </h5>
                            </div>
                        </div>
                        <div style={{ backgroundColor: '#d5d5d5', borderRadius: '20px', padding: '1rem', width: '32%', minWidth: '280px', height: '300px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', }}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <img alt="img"
                                    src="assets/img/4-copper-alive-product-features-production.webp"
                                    style={{ width: '100%', height: '175px', objectFit: 'cover', borderRadius: '10px', marginBottom: '0.5rem', }}
                                />
                                <h5 style={{ margin: '0 0 0.3rem 0', fontSize: '0.9rem' }}>
                                    pH-Balanced Water Benefits | Improve Hydration & Well-Being
                                </h5>
                                <p style={{ fontStyle: 'italic', margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>
                                    On May 15, 2025 By ionHive
                                </p>
                                <h5 style={{ color: '#0d83fd', marginTop: 'auto', fontSize: '0.9rem' }}>
                                    <a href="#view" style={{ color: '#0d83fd', textDecoration: 'none' }}>View</a>
                                </h5>
                            </div>
                        </div>
                        <div style={{ backgroundColor: '#d5d5d5', borderRadius: '20px', padding: '1rem', width: '32%', minWidth: '280px', height: '300px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', }}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <img alt="img"
                                    src="assets/img/IOT-1-cu-alive-production.webp"
                                    style={{ width: '100%', height: '175px', objectFit: 'cover', borderRadius: '10px', marginBottom: '0.5rem', }}
                                />
                                <h5 style={{ margin: '0 0 0.3rem 0', fontSize: '0.9rem' }}>
                                    pH-Balanced Water Benefits | Improve Hydration & Well-Being
                                </h5>
                                <p style={{ fontStyle: 'italic', margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>
                                    On May 15, 2025 By ionHive
                                </p>
                                <h5 style={{ color: '#0d83fd', marginTop: 'auto', fontSize: '0.9rem' }}>
                                    <a href="#view" style={{ color: '#0d83fd', textDecoration: 'none' }}>View</a>
                                </h5>
                            </div>
                        </div>
                        <div style={{ backgroundColor: '#d5d5d5', borderRadius: '20px', padding: '1rem', width: '32%', minWidth: '280px', height: '300px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', }}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <img alt="img"
                                    src="assets/img/IOT-2-cu-alive-production.webp"
                                    style={{ width: '100%', height: '175px', objectFit: 'cover', borderRadius: '10px', marginBottom: '0.5rem', }}
                                />
                                <h5 style={{ margin: '0 0 0.3rem 0', fontSize: '0.9rem' }}>
                                    pH-Balanced Water Benefits | Improve Hydration & Well-Being
                                </h5>
                                <p style={{ fontStyle: 'italic', margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>
                                    On May 15, 2025 By ionHive
                                </p>
                                <h5 style={{ color: '#0d83fd', marginTop: 'auto', fontSize: '0.9rem' }}>
                                    <a href="#view" style={{ color: '#0d83fd', textDecoration: 'none' }}>View</a>
                                </h5>
                            </div>
                        </div>
                        <div style={{ backgroundColor: '#d5d5d5', borderRadius: '20px', padding: '1rem', width: '32%', minWidth: '280px', height: '300px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', }}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <img alt="img"
                                    src="assets/img/IOT-2-cu-alive-production.webp"
                                    style={{ width: '100%', height: '175px', objectFit: 'cover', borderRadius: '10px', marginBottom: '0.5rem', }}
                                />
                                <h5 style={{ margin: '0 0 0.3rem 0', fontSize: '0.9rem' }}>
                                    pH-Balanced Water Benefits | Improve Hydration & Well-Being
                                </h5>
                                <p style={{ fontStyle: 'italic', margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>
                                    On May 15, 2025 By ionHive
                                </p>
                                <h5 style={{ color: '#0d83fd', marginTop: 'auto', fontSize: '0.9rem' }}>
                                    <a href="#view" style={{ color: '#0d83fd', textDecoration: 'none' }}>View</a>
                                </h5>
                            </div>
                        </div>
                        <div style={{ backgroundColor: '#d5d5d5', borderRadius: '20px', padding: '1rem', width: '32%', minWidth: '280px', height: '300px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', }}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <img alt="img"
                                    src="assets/img/3-copper-alive-product-features-production.webp"
                                    style={{ width: '100%', height: '175px', objectFit: 'cover', borderRadius: '10px', marginBottom: '0.5rem', }}
                                />
                                <h5 style={{ margin: '0 0 0.3rem 0', fontSize: '0.9rem' }}>
                                    pH-Balanced Water Benefits | Improve Hydration & Well-Being
                                </h5>
                                <p style={{ fontStyle: 'italic', margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>
                                    On May 15, 2025 By ionHive
                                </p>
                                <h5 style={{ color: '#0d83fd', marginTop: 'auto', fontSize: '0.9rem' }}>
                                    <a href="#view" style={{ color: '#0d83fd', textDecoration: 'none' }}>View</a>
                                </h5>
                            </div>
                        </div>

                    </div>
                </section>

                {/* <!-- /Contact Section --> */}


            </main>

            {/* Footer */}
            < Footer />
        </div>
    );
};
export default Blog;
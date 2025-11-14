import React from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';

const TermsOfService = ({ userInfo, token, handleLogout }) => {
    return (
        <div>

            {/* Header */}
            <Header userInfo={userInfo} handleLogout={handleLogout} />


            <main className="main">

                {/* <!-- Terms Of Service Section --> */}

                <section id="hero" className="hero section" style={{ marginBottom: '0px', paddingBottom: '0px' }}>

                    {/* <!-- Section Title --> */}
                    <div className="container section-title" data-aos="fade-up" style={{ paddingBottom: '0px' }}>
                        <h2>ionHive Terms and Service</h2>
                        <p> Last Updated: May 15, 2025</p>
                    </div>
                    {/* <!-- End Section Title --> */}

                </section>
                {/* <!-- Terms Of Service Section --> */}

                {/* <!-- Terms Of Service Section --> */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                    <section id="terms-of-service" className="contact section light-background" style={{ fontFamily: 'Arial, sans-serif', lineHeight: 1.6, color: '#333', maxWidth: '1140px', width: '100%', }}>
                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>1. Definitions</h2>
                        <p><strong>"Service(s)"</strong> means services provided through the Platform, as described in clause 3 below. Services may change at the Company’s sole discretion.</p>
                        <p><strong>“User” or “You”</strong> refers to individuals who use or wish to use the Services.</p>
                        <p><strong>“Product”</strong> means any water purifier offered by ionHive for rental or purchase.</p>
                        <p><strong>“Seller”</strong> refers to the Company or authorized entities selling Products on the Platform.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>2. Updation of Terms and Conditions</h2>
                        <p>These Terms may be updated without notice. Continued use implies your acceptance of any modifications. Users are advised to review Terms periodically.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>3. Service(s) Provided to Users</h2>
                        <p>ionHive offers Smart RO Water Purifiers on rental. Users are billed for water consumed. Installation and maintenance are handled by the Company. The Platform also facilitates product sales.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>4. Eligibility</h2>
                        <p>Users must be at least 18 and legally competent under the Indian Contract Act, 1872. By using the Platform, you accept the Terms. Organizations must authorize representatives accordingly.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>5. Product Transactions</h2>
                        <p>All commercial terms are between the User and the Company. Placing an order is an offer and may be declined. Refunds are issued upon cancellations initiated by the Company.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>6. Payment & Refund</h2>
                        <p>Payments are made via available methods on the Platform. The ₹1,500 security deposit is refundable upon product return in good condition. Deductions apply for damage or dues.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>7. Maintenance & Support</h2>
                        <p>ionHive handles purifier maintenance. Users can reach out to support for servicing, which will be addressed in a reasonable timeframe.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>8. Termination</h2>
                        <p>The Company may terminate or suspend access for any violations. Users may also cancel subscriptions per applicable policies.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>9. Limitation of Liability</h2>
                        <p>ionHive is not liable for indirect or incidental damages related to use or inability to use the Platform or Services.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>10. Governing Law</h2>
                        <p>These Terms are governed by Indian law. All disputes are subject to jurisdiction in Bangalore, Karnataka.</p>
                    </section>
                </div>
                {/* <!-- Terms Of Service Section --> */}

            </main>

            {/* Footer */}
            < Footer />
        </div>
    );
};
export default TermsOfService;
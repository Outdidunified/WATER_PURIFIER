import React from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';

const PrivacyPolicy = ({ userInfo, token, handleLogout }) => {
    return (
        <div>

            {/* Header */}
            <Header userInfo={userInfo} handleLogout={handleLogout} />


            <main className="main">

                {/* <!-- Privacy Policy Section --> */}

                <section id="hero" className="hero section" style={{ marginBottom: '0px', paddingBottom: '0px' }}>

                    {/* <!-- Section Title --> */}
                    <div className="container section-title" data-aos="fade-up" style={{ paddingBottom: '0px' }}>
                        <h2>ionHive Privacy Policy</h2>
                        <p> Last Updated: May 15, 2025</p>
                    </div>
                    {/* <!-- End Section Title --> */}

                </section>
                {/* <!-- Privacy Policy Section --> */}

                {/* <!-- Privacy Policy Section --> */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                    <section id="privacy-policy" className="section light-background" style={{ fontFamily: 'Arial, sans-serif', lineHeight: 1.6, color: '#333', maxWidth: '1140px', width: '100%', }}>
                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>1. Introduction and Applicability of the Privacy Policy</h2>
                        <p>
                            We are committed to respecting your privacy and ensuring the security of any personal information collected via the ionHive platform. This Privacy Policy outlines our methods for collecting, using, and protecting your data when you engage with our water purifier rental services.
                        </p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>2. Disclaimer</h2>
                        <p>
                            Information collected will be processed lawfully for providing services, kept only as long as necessary, and reviewed periodically. We are not liable for data disclosure due to legitimate reasons or technical errors. Use of our services indicates your acceptance of this policy.
                        </p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>3. Your Consent</h2>
                        <p>
                            By sharing your information with us, you consent to our use of it for service delivery, research, analytics, and necessary third-party integrations such as payment processing and customer service. You may withdraw consent at any time by contacting us at support@ionhive.in.
                        </p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>4. Types of Information Collected</h2>
                        <p><strong>Personal Data:</strong> Includes name, contact details, address, and identification.</p>
                        <p><strong>Sensitive Personal Data:</strong> Includes financial information and government IDs.</p>
                        <p><strong>Technical Information:</strong> Includes IP address, device/browser type, and usage logs.</p>
                        <p><strong>Locational Information:</strong> Derived via GPS or other geo-services for better service delivery.</p>
                        <p><strong>Non-Personal Information:</strong> Includes anonymized browser and usage patterns.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>5. Use of Information</h2>
                        <p>
                            We use your information to fulfill service requests, provide support, improve performance, offer new services, and communicate policy updates. Data may also be analyzed internally to enhance our offerings.
                        </p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>6. Sharing of Information</h2>
                        <p>
                            Information may be shared with affiliates or third-party vendors for operations like installation, maintenance, billing, or customer care. We ensure these partners comply with data privacy laws and obligations.
                        </p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>7. Data Security</h2>
                        <p>
                            ionHive uses commercially reasonable security practices such as encryption, secure servers, and access control mechanisms to protect your data. However, no digital transmission is 100% secure, and we do not guarantee absolute security.
                        </p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>8. Cookies and Tracking Technologies</h2>
                        <p>
                            We use cookies and similar technologies to personalize your experience, monitor site performance, and collect anonymous analytics. You can modify cookie settings in your browser if desired.
                        </p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>9. User Rights</h2>
                        <p>
                            You have the right to access, modify, delete, or withdraw consent for your personal data. Requests can be sent to support@ionhive.in. We may retain some data as required by law or for legal defense.
                        </p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>10. Governing Law and Dispute Resolution</h2>
                        <p>
                            This Privacy Policy is governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Bangalore, Karnataka.
                        </p>
                    </section>
                </div>

                {/* <!-- Privacy Policy Section --> */}

            </main>

            {/* Footer */}
            < Footer />
        </div>
    );
};
export default PrivacyPolicy;


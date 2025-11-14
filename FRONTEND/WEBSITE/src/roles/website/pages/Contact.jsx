import React from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import useContact from "../hooks/useContact";
const Contact = ({ userInfo, token, handleLogout }) => {
    const { formData, handleChange, handleSubmits, loading, sanitizeEmail } = useContact();

    return (
        <div>

            {/* Header */}
            <Header userInfo={userInfo} handleLogout={handleLogout} />

            <main className="main">
                {/* <!-- Contact Section --> */}

                <section id="hero" className="hero contact section light-background">

                    {/* <!-- Section Title --> */}
                    <div className="container section-title" data-aos="fade-up">
                        <h2>Contact Us</h2>
                        <p>Speak to a water-wellness expert today</p>
                    </div>
                    {/* <!-- End Section Title --> */}

                    <div className="container" data-aos="fade-up" data-aos-delay="100">

                        <div className="row g-4 g-lg-5">
                            <div className="col-lg-5">
                                <div className="info-box" data-aos="fade-up" data-aos-delay="200">
                                    <h3>Contact Info</h3>

                                    <div className="info-item" data-aos="fade-up" data-aos-delay="300">
                                        <div className="icon-box">
                                            <i className="bi bi-geo-alt"></i>
                                        </div>
                                        <div className="content">
                                            <h4>Our Location</h4>
                                            <p>Outdid Unified Private Limited,</p>
                                            <p>2nd Floor, Indian Water Works Association, 10(P),</p>
                                            <p>7th Main Road, BTM Layout, 2nd Stage,</p>
                                            <p>MICO HBCS(1st Stage), Bangalore-560076.</p>
                                        </div>
                                    </div>

                                    <div className="info-item" data-aos="fade-up" data-aos-delay="400">
                                        <div className="icon-box">
                                            <i className="bi bi-telephone"></i>
                                        </div>
                                        <div className="content">
                                            <h4>Phone Number</h4>
                                            <p>+91 80959 45298</p>
                                        </div>
                                    </div>

                                    <div className="info-item" data-aos="fade-up" data-aos-delay="500">
                                        <div className="icon-box">
                                            <i className="bi bi-envelope"></i>
                                        </div>
                                        <div className="content">
                                            <h4>Email Address</h4>
                                            <p>info@outdidunified.com</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-7">
                                <div className="contact-form" data-aos="fade-up" data-aos-delay="300">
                                    <h3>Get In Touch</h3>
                                    <p>How Can We Assist You Today?</p>

                                    <form className="php-email-form" onSubmit={handleSubmits}>
                                        <div className="row gy-4">
                                            <div className="col-md-6">
                                                <input type="text" name="name" className="form-control" placeholder="Your Name" required value={formData.name} onChange={(e) => {
                                                    if (/^[a-zA-Z\s]*$/.test(e.target.value)) handleChange(e);
                                                }} />
                                            </div>

                                            <div className="col-md-6">
                                                <input type="email" name="email" className="form-control" placeholder="Your Email" required
                                                    value={formData.email}
                                                    onChange={(e) =>
                                                        handleChange({
                                                            target: {
                                                                name: 'email',
                                                                value: sanitizeEmail(e.target.value),
                                                            },
                                                        })
                                                    }
                                                />
                                            </div>

                                            <div className="col-12">
                                                <input type="text" name="subject" className="form-control" placeholder="Subject" required value={formData.subject} onChange={handleChange} />
                                            </div>

                                            <div className="col-12">
                                                <textarea name="message" rows="6" className="form-control" placeholder="Message" required value={formData.message} onChange={handleChange}></textarea>
                                            </div>

                                            <div className="col-12 text-center">
                                                <button type="submit" className="btn">{loading ? "Processing..." : "Send Message"}</button>
                                            </div>
                                        </div>
                                    </form>

                                </div>
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
export default Contact;
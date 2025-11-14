import React from 'react';

const Footer = ({ }) => {
    const year = new Date();

    return (

        <footer id="footer" className="footer" style={{ backgroundColor: '#bfe4ff69' }}>

            <div className="container footer-top">
                <div className="row gy-4">
                    <div className="col-lg-6 col-md-12 footer-about">
                        <a href="index.html" className="logo d-flex align-items-center">
                            <span className="sitename">ionHive Water Purifier</span>
                        </a>
                        <div className="footer-contact pt-3">
                            <p>Outdid Unified Pvt Ltd</p>
                            <p>2nd Floor, Indian Water Works Association, 10(P), 7th Main Road, BTM Layout, 2nd Stage, MICO HBCS(1st Stage), Bangalore-560076.</p>
                            <p className="mt-3"><strong>Phone:</strong> <span>+91 80959 45298</span> <strong> Email:</strong> <span>info@outdidunified.com</span></p>
                        </div>
                        <div className="social-links d-flex mt-4">
                            <a href=""><i className="bi bi-twitter-x"></i></a>
                            <a href=""><i className="bi bi-facebook"></i></a>
                            <a href=""><i className="bi bi-instagram"></i></a>
                            <a href=""><i className="bi bi-linkedin"></i></a>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-4 footer-links">
                        <h4>Useful Links</h4>
                        <ul>
                            <li><a href="/">Home</a></li>
                            <li><a href="/about">About Us</a></li>
                            <li><a href="/contact">Contact Us</a></li>
                            <li><a href="/blog">Blog</a></li>
                            <li><a href="/faqs">FAQs</a></li>
                        </ul>
                    </div>

                    <div className="col-lg-3 col-md-4 footer-links">
                        <h4>Terms</h4>
                        <ul>
                            <li><a href="/terms-of-service">Terms of service</a></li>
                            <li><a href="/privacy-policy">Privacy policy</a></li>
                        </ul>
                    </div>

                </div>
            </div>


            <div className="container copyright text-center mt-4">
                <p><span> Copyright &copy; {year.getFullYear()}
                    <a to="/" className="font-weight-bold" target="_blank"> ionHive Water Purifier </a>
                    All Rights Reserved. </span></p>
            </div>

        </footer>
    );
};

export default Footer;
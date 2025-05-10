import React from 'react';

const Footer = ({ }) => {
    const year = new Date();

    return (

        <footer id="footer" className="footer">

            <div className="container footer-top">
                <div className="row gy-4">
                    <div className="col-lg-4 col-md-6 footer-about">
                        <a href="index.html" className="logo d-flex align-items-center">
                            <span className="sitename">Outdid Water Purifier</span>
                        </a>
                        <div className="footer-contact pt-3">
                            <p>Outdid Unified Pvt Ltd</p>
                            <p>No.57, 17th Cross, 7th Main road,</p>
                            <p>BTM 2nd Stage, Bangalore-560076.</p>
                            <p className="mt-3"><strong>Phone:</strong> <span>+91 80959 45298</span></p>
                            <p><strong>Email:</strong> <span>info@outdidunified.com</span></p>
                        </div>
                        <div className="social-links d-flex mt-4">
                            <a href=""><i className="bi bi-twitter-x"></i></a>
                            <a href=""><i className="bi bi-facebook"></i></a>
                            <a href=""><i className="bi bi-instagram"></i></a>
                            <a href=""><i className="bi bi-linkedin"></i></a>
                        </div>
                    </div>

                    <div className="col-lg-2 col-md-3 footer-links">
                        <h4>Useful Links</h4>
                        <ul>
                            <li><a href="#">Home</a></li>
                            <li><a href="#">About us</a></li>
                            <li><a href="#">Services</a></li>
                        </ul>
                    </div>

                    <div className="col-lg-2 col-md-3 footer-links">
                        <h4>Premium Drinking Water</h4>
                        <ul>
                            <li><a href="#">Plans</a></li>
                            <li><a href="#">How it works</a></li>
                            <li><a href="#">DrinkPrime Advantage</a></li>
                        </ul>
                    </div>

                    <div className="col-lg-2 col-md-3 footer-links">
                        <h4>Contact Us</h4>
                        <ul>
                            <li><a href="#">FAQs</a></li>
                        </ul>
                    </div>

                    <div className="col-lg-2 col-md-3 footer-links">
                        <h4>Terms</h4>
                        <ul>
                            <li><a href="#">Terms of service</a></li>
                            <li><a href="#">Privacy policy</a></li>
                        </ul>
                    </div>

                </div>
            </div>


            <div className="container copyright text-center mt-4">
                <p><span> Copyright &copy; {year.getFullYear()}
                    <a to="/" className="font-weight-bold" target="_blank"> Outdid Water Purifier </a>
                    All Rights Reserved. </span></p>
            </div>

        </footer>
    );
};

export default Footer;
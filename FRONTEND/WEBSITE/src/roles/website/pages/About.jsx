import { useState } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';

const About = ({ userInfo, token, handleLogout }) => {

    return (
        <div>

            {/* Header */}
            <Header userInfo={userInfo} handleLogout={handleLogout} />

            <main className="main">

                {/* <!-- Start Advantage Section --> */}
                <section id="hero" className="hero section">
                    {/* <!-- Section Title --> */}
                    <div className="container section-title" data-aos="fade-up">
                        <h2>We Are On A Mission To Provide Access To Clean, <br />Safe, And Healthy Drinking Water.</h2>
                        <p>ionHive was started to solve a personal problem - How do we get access to clean, safe, and healthy drinking water? Seems simple, but here’s what we found.</p>
                        <p>First, most of the water you get in plastic cans isn’t fit for drinking. Second, less than 10% of Indians actually own a water purifier! That’s when we realised this wasn’t just a personal problem but an opportunity to help a lot of people.</p>
                        <p>It’s been seven+ years since we started on this journey. Today, more than 1 Lakh users in 7 cities trust us to access clean and safe drinking water!</p>
                    </div>
                    {/* <!-- End Section Title --> */}

                </section>
                {/* <!-- End Advantage Section --> */}

                {/* <!-- Call To Action Section --> */}
                <section id="call-to-action" className="call-to-action section" style={{padding:'0px'}}>

                    <div className="container" data-aos="fade-up" data-aos-delay="100">

                        <div className="row content justify-content-center align-items-center position-relative">
                            <div className="col-lg-8 mx-auto text-center">
                                <div className="scroll-wrapper">
                                    <div className="scroll-container" >
                                        <div className="scroll-row">
                                            {/* Pricing Card Start  */}
                                            <div className="pricing-card-container" style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px' }}>
                                                <div className="pricing-card">
                                                    {/* Video Thumbnail Section */}
                                                    <div className="youtube-thumbnail relative rounded-[16px] overflow-hidden mb-4" style={{ height: '200px' }}>
                                                        <a
                                                            href="https://www.youtube.com/watch?v=Y7f98aduVJ8"
                                                            className="glightbox block w-full h-full"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <img
                                                                src="https://i.ytimg.com/vi/Y7f98aduVJ8/hqdefault.jpg"
                                                                alt="Video Thumbnail"
                                                                loading="lazy"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                                <svg width="60" height="60" fill="white" viewBox="0 0 24 24">
                                                                    <path d="M8 5v14l11-7z" />
                                                                </svg>
                                                            </div>
                                                        </a>
                                                    </div>

                                                    {/* Textual Content */}
                                                    <div style={{ color: 'black' }}>
                                                        <p className="mb-1" style={{ color: 'black' }}>
                                                            It’s just something that you fit and forget.<br />
                                                            You fit the device, you subscribe to a plan and that's it. <br />
                                                            And you have an app so I think it's convenient, <br />
                                                            it's cost effective and it's safe.
                                                        </p>
                                                        <h3 className="text-xl font-semibold mb-2">Kesavan D</h3>
                                                        <div className="price text-lg mb-2">
                                                            <span className="amount font-bold">Bangalore</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pricing-card-container" style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px' }}>
                                                <div className="pricing-card">
                                                    {/* Video Thumbnail Section */}
                                                    <div className="youtube-thumbnail relative rounded-[16px] overflow-hidden mb-4" style={{ height: '200px' }}>
                                                        <a
                                                            href="https://www.youtube.com/watch?v=Y7f98aduVJ8"
                                                            className="glightbox block w-full h-full"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <img
                                                                src="https://i.ytimg.com/vi/Y7f98aduVJ8/hqdefault.jpg"
                                                                alt="Video Thumbnail"
                                                                loading="lazy"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                                <svg width="60" height="60" fill="white" viewBox="0 0 24 24">
                                                                    <path d="M8 5v14l11-7z" />
                                                                </svg>
                                                            </div>
                                                        </a>
                                                    </div>

                                                    {/* Textual Content */}
                                                    <div style={{ color: 'black' }}>
                                                        <p className="mb-1" style={{ color: 'black' }}>
                                                            It’s just something that you fit and forget.<br />
                                                            You fit the device, you subscribe to a plan and that's it. <br />
                                                            And you have an app so I think it's convenient, <br />
                                                            it's cost effective and it's safe.
                                                        </p>
                                                        <h3 className="text-xl font-semibold mb-2">Kesavan D</h3>
                                                        <div className="price text-lg mb-2">
                                                            <span className="amount font-bold">Bangalore</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pricing-card-container" style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px' }}>
                                                <div className="pricing-card">
                                                    {/* Video Thumbnail Section */}
                                                    <div className="youtube-thumbnail relative rounded-[16px] overflow-hidden mb-4" style={{ height: '200px' }}>
                                                        <a
                                                            href="https://www.youtube.com/watch?v=Y7f98aduVJ8"
                                                            className="glightbox block w-full h-full"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <img
                                                                src="https://i.ytimg.com/vi/Y7f98aduVJ8/hqdefault.jpg"
                                                                alt="Video Thumbnail"
                                                                loading="lazy"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                                <svg width="60" height="60" fill="white" viewBox="0 0 24 24">
                                                                    <path d="M8 5v14l11-7z" />
                                                                </svg>
                                                            </div>
                                                        </a>
                                                    </div>

                                                    {/* Textual Content */}
                                                    <div style={{ color: 'black' }}>
                                                        <p className="mb-1" style={{ color: 'black' }}>
                                                            It’s just something that you fit and forget.<br />
                                                            You fit the device, you subscribe to a plan and that's it. <br />
                                                            And you have an app so I think it's convenient, <br />
                                                            it's cost effective and it's safe.
                                                        </p>
                                                        <h3 className="text-xl font-semibold mb-2">Kesavan D</h3>
                                                        <div className="price text-lg mb-2">
                                                            <span className="amount font-bold">Bangalore</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Duplicate as needed for 4-5 cards */}
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* <!-- Abstract Background Elements --> */}
                            <div className="shape shape-1">
                                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M47.1,-57.1C59.9,-45.6,68.5,-28.9,71.4,-10.9C74.2,7.1,71.3,26.3,61.5,41.1C51.7,55.9,35,66.2,16.9,69.2C-1.3,72.2,-21,67.8,-36.9,57.9C-52.8,48,-64.9,32.6,-69.1,15.1C-73.3,-2.4,-69.5,-22,-59.4,-37.1C-49.3,-52.2,-32.8,-62.9,-15.7,-64.9C1.5,-67,34.3,-68.5,47.1,-57.1Z" transform="translate(100 100)"></path>
                                </svg>
                            </div>

                            <div className="shape shape-2">
                                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M41.3,-49.1C54.4,-39.3,66.6,-27.2,71.1,-12.1C75.6,3,72.4,20.9,63.3,34.4C54.2,47.9,39.2,56.9,23.2,62.3C7.1,67.7,-10,69.4,-24.8,64.1C-39.7,58.8,-52.3,46.5,-60.1,31.5C-67.9,16.4,-70.9,-1.4,-66.3,-16.6C-61.8,-31.8,-49.7,-44.3,-36.3,-54C-22.9,-63.7,-8.2,-70.6,3.6,-75.1C15.4,-79.6,28.2,-58.9,41.3,-49.1Z" transform="translate(100 100)"></path>
                                </svg>
                            </div>

                            {/* <!-- Dot Pattern Groups --> */}
                            <div className="dots dots-1">
                                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                    <pattern id="dot-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <circle cx="2" cy="2" r="2" fill="currentColor"></circle>
                                    </pattern>
                                    <rect width="100" height="100" fill="url(#dot-pattern)"></rect>
                                </svg>
                            </div>

                            <div className="dots dots-2">
                                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                    <pattern id="dot-pattern-2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <circle cx="2" cy="2" r="2" fill="currentColor"></circle>
                                    </pattern>
                                    <rect width="100" height="100" fill="url(#dot-pattern-2)"></rect>
                                </svg>
                            </div>

                            <div className="shape shape-3">
                                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M43.3,-57.1C57.4,-46.5,71.1,-32.6,75.3,-16.2C79.5,0.2,74.2,19.1,65.1,35.3C56,51.5,43.1,65,27.4,71.7C11.7,78.4,-6.8,78.3,-23.9,72.4C-41,66.5,-56.7,54.8,-65.4,39.2C-74.1,23.6,-75.8,4,-71.7,-13.2C-67.6,-30.4,-57.7,-45.2,-44.3,-56.1C-30.9,-67,-15.5,-74,0.7,-74.9C16.8,-75.8,33.7,-70.7,43.3,-57.1Z" transform="translate(100 100)"></path>
                                </svg>
                            </div>
                        </div>

                    </div>

                </section>
                {/* <!-- /Call To Action Section --> */}

            </main>

            {/* Footer */}
            < Footer />
        </div>
    );
};

export default About;
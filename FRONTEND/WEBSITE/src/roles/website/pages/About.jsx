import { useState } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';

const About = ({ userInfo, token, handleLogout }) => {
    return (
        <div>
            {/* Header */}
            <Header userInfo={userInfo} handleLogout={handleLogout} />

            <main className="main">

                {/* Hero / Intro Section */}
                <section id="hero" className="hero section">
                    <div className="container section-title" data-aos="fade-up" style={{ paddingBottom: '0px' }}>
                        <h2>We are on a mission to provide access to clean, <br />Safe and healthy drinking water.</h2>
                        <p>
                            ionHive was started to solve a personal problem - How do we get access to clean,
                            safe, and healthy drinking water? Seems simple, but here’s what we found.
                        </p>
                        <p>
                            First, most of the water you get in plastic cans isn’t fit for drinking. Second,
                            less than 10% of Indians actually own a water purifier! That’s when we realised
                            this wasn’t just a personal problem but an opportunity to help a lot of people.
                        </p>
                        <p>
                            It’s been seven+ years since we started on this journey. Today, more than
                            <b> 1 Lakh users in 7 cities</b> trust us to access clean and safe drinking water!
                        </p>
                    </div>
                </section>

                {/* About Us Section */}
                <section id="about" className="about section">
                    <div className="container" data-aos="fade-up">
                        <h3>About Us</h3>
                        <p>
                            ionHive is a smart water service backed by cutting-edge technology and superior
                            engineering of water purification products.
                        </p>
                        <p>
                            With thousands of installations across the country, ionHive is becoming one of
                            the most trusted names in drinking water solutions. Our aim is to set new
                            benchmarks in water purification and give Indian consumers world-class access
                            to modern potable water systems.
                        </p>
                        <p>
                            Our state-of-the-art systems are researched, developed, and refined to maintain
                            the highest standards of hygiene and quality. Each purifier is assembled and
                            tested thoroughly to ensure zero contamination and maximum safety.
                        </p>
                        <p>
                            With the ionHive app, customers not only get real-time health insights of their
                            machines but also instant service support that ensures a completely hassle-free
                            experience.
                        </p>
                        <p>
                            Backed by a legacy of trust and excellence, ionHive is working towards changing
                            the face of India’s water purifier industry.
                        </p>
                    </div>
                    <div className="container" data-aos="fade-up" style={{ paddingTop: '20px' }}>
                        <h3>Our Vision</h3>
                        <p>
                            ionHive strives to make every Indian healthy and ensure purity in their lives
                            through water — without the hassle of buying or maintaining water purifiers or
                            depending on unsafe, expensive jar bottles.
                        </p>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default About;

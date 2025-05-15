import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Swal from 'sweetalert2';
const ProductList = ({ }) => {

    // copper
    const [usage, setUsage] = useState("SOLO");
    const [tenure, setTenure] = useState(28);

    const plans = {
        SOLO: { liters: "130 ltrs/m", base: 449 },
        COUPLE: { liters: "200 ltrs/m", base: 549 },
        FAMILY: { liters: "500 ltrs/m", base: 749 },
        UNLIMITED: { liters: "Unlimited/m", base: 999 },
    };

    const discounts = {
        28: { label: "28 days", discount: 0 },
        90: { label: "90 days", discount: 10 },
        360: { label: "360 days", discount: 20 },
    };

    const basePrice = plans[usage].base;
    const discount = discounts[tenure].discount;
    const finalPrice = basePrice - (basePrice * discount) / 100;
    const savings = (basePrice * discount) / 100;

    const [mainImage, setMainImage] = useState("assets/img/copper_purifier.webp");

    const thumbnails = [
        "assets/img/copper_purifier.webp",
        "assets/img/uv_purification.webp",
        "assets/img/copper_filter.webp",
        "assets/img/multistage_purification.webp",
        "assets/img/wall_mount.webp",
    ];

    // RO+
    const [usageRO, setUsageRO] = useState("BASIC");
    const [tenureRO, setTenureRO] = useState(28);

    const plansRO = {
        BASIC: { liters: "250 ltrs/m", base: 449 },
        UNLIMITED: { liters: "Unlimited/m", base: 999 },
    };

    const discountsRO = {
        28: { label: "28 days", discount: 0 },
        360: { label: "360 days", discount: 20 },
    };

    const basePriceRO = plansRO[usageRO].base;
    const discountRO = discountsRO[tenureRO].discount;
    const finalPriceRO = basePriceRO - (basePriceRO * discountRO) / 100;
    const savingsRO = (basePriceRO * discountRO) / 100;

    const [mainImageRO, setMainImageRO] = useState("assets/img/ro+_water_purifier.webp");

    const thumbnailsRO = [
        "assets/img/ro+_water_purifier.webp",
        "assets/img/ro_membrane.webp",
        "assets/img/multistage_purification.webp",
        "assets/img/dual_cartridge.webp",
        "assets/img/wall_mount.webp",
    ];

    // Alkaline
    const [usageAlkaline, setUsageAlkaline] = useState("STANDARD");
    const [tenureAlkaline, setTenureAlkaline] = useState(28);

    const plansAlkaline = {
        STANDARD: { liters: "250 ltrs/m", base: 449 },
        UNLIMITED: { liters: "Unlimited/m", base: 999 },
    };

    const discountsAlkaline = {
        28: { label: "28 days", discount: 0 },
        360: { label: "360 days", discount: 20 },
    };

    const basePriceAlkaline = plansAlkaline[usageAlkaline].base;
    const discountAlkaline = discountsAlkaline[tenureAlkaline].discount;
    const finalPriceAlkaline = basePriceAlkaline - (basePriceAlkaline * discountAlkaline) / 100;
    const savingsAlkaline = (basePriceAlkaline * discountAlkaline) / 100;

    const [mainImageAlkaline, setMainImageAlkaline] = useState("assets/img/alkaline_water_purifier.webp");

    const thumbnailsAlkaline = [
        "assets/img/alkaline_water_purifier.webp",
        "assets/img/alkaline_boost.webp",
        "assets/img/multistage_purification.webp",
        "assets/img/alkaline_cartridge.webp",
        "assets/img/capacity.webp",
    ];

    {/* Sub model */ }
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [emailID, setEmailID] = useState("");
    const [referral, setReferral] = useState("");
    const [city, setCity] = useState("Bangalore");

    const handleSubmit = async (e) => {
        e.preventDefault();

        const phoneRegex = /^[1-9][0-9]{9}$/; // 10 digits, not starting with 0
        const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
        const referralRegex = /^[a-zA-Z0-9]{6}$/; // for alphanumeric

        if (!phoneRegex.test(phone)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Phone Number',
                text: 'Phone number must be 10 digits and not start with 0.'
            });
            return;
        }

        if (!emailRegex.test(emailID)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Email ID',
                text: 'Email ID must only contain letters and numbers, one @, and a valid domain.'
            });
            return;
        }
        if (!referralRegex.test(referral)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Referral Code',
                text: 'Referral code must be exactly 6 letters or numbers.'
            });
            return;
        }

        const payload = { name, phone, emailID, referral, city };

        try {
            const res = await fetch("http://localhost:5000/api/subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Submitted Successfully!',
                    showConfirmButton: false,
                    timer: 2000
                });
                setShowModal(false);
                // Reset fields
                setName("");
                setPhone("");
                setEmailID("");
                setReferral("");
                setCity("Bangalore");
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Submission Failed',
                    text: data.message || "Please try again."
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Something went wrong!'
            });
            console.error(error);
        }
    };

    // Set the first item (index 0) as default open
    const [activeIndex, setActiveIndex] = useState(0);

    // FAQ data
    const faqs = [
        {
            question: "Why is subscribing to a ionHive water purifier for home better than buying?",
            answer: "Subscribing to home water purification eliminates upfront costs, AMC, and service charges. Enjoy hassle-free access to pure drinking water.",
        },
        {
            question: "Can I modify or upgrade my water purifier subscription plan later?",
            answer: "Yes, enjoy flexibility in modifying or upgrading your water purifier subscription plan using the ionHive mobile app based on your changing needs.",
        },
        {
            question: "How does ionHive ensure prompt RO water purifier service?",
            answer: "Enjoy hassle-free after-sales RO water purifier service with ionHive at no additional cost. Our IoT technology constantly monitors water quality, triggering proactive RO water purifier service alerts. The ionHive mobile app aids in diagnosing water dispensing issues, while our call center and company-operated technician network ensure speedy resolutions.",
        },
        {
            question: "Will my water purifier subscription balance be carried forward?",
            answer: "Your balance will be carried forward until you continue using the same water purifier subscription plan. The balance gets reset when you change plans.",
        },
        {
            question: "Does this require drilling/change in my water and power lines?",
            answer: "More than 85% of our customers choose to use the water purifier as a wall-hanging unit. However, you can choose to use the unit both as a wall-hanging and a countertop unit. Our experienced RO installation team will take care of all the necessary power/water line changes required during the process.",
        },
        {
            question: "What are the key features of the ionHive Alkaline water purifier?",
            answer: "The ionHive Alkaline purifier comes fully loaded with a multistage purification process that includes alkaline water purification, reverse osmosis purification and UV purification.",
        },
    ];

    const handleToggle = (index) => {
        // Close if already open, otherwise open the clicked item
        setActiveIndex(index === activeIndex ? null : index);
    };

    const slides = [
        {
            src: 'assets/img/IOT-1-cu-alive-production.webp',
            alt: 'Slide 1: IOT Enabled Water Purifier 1',
        },
        {
            src: 'assets/img/IOT-2-cu-alive-production.webp',
            alt: 'Slide 2: IOT Enabled Water Purifier 2',
        },
        {
            src: 'assets/img/IOT-3-cu-alive-production.webp',
            alt: 'Slide 3: IOT Enabled Water Purifier 3',
        },
    ];

    const [currentSlide, setCurrentSlide] = useState(0);
    const timeoutRef = useRef(null);

    useEffect(() => {
        const next = (currentSlide + 1) % slides.length;
        timeoutRef.current = setTimeout(() => {
            setCurrentSlide(next);
        }, 3000); // Change slide every 3 seconds

        return () => clearTimeout(timeoutRef.current);
    }, [currentSlide]);

    const [isOpen, setIsOpen] = useState(false); // This will toggle the accordion

    return (
        <div>

            {/* Header */}
            < Header />

            <main className="main" style={{ marginTop: '5%' }}>

                {/* <!-- Features Section --> */}
                <section id="features" className="features section">

                    {/* <!-- Section Title --> */}
                    <div className="container section-title" data-aos="fade-up">
                        <h2>Products That Fit Every Lifestyle And Budget</h2>
                        <p>Each of our smart water purifiers comes with advanced multi-stage purification and IoT technology.</p>
                    </div>
                    {/* <!-- End Section Title --> */}

                    <div className="container">

                        <div className="d-flex justify-content-center">

                            <ul className="nav nav-tabs" data-aos="fade-up" data-aos-delay="100">

                                <li className="nav-item">
                                    <a className="nav-link active show" data-bs-toggle="tab" data-bs-target="#features-tab-1">
                                        <h4>ionHive Copper</h4>
                                    </a>
                                </li>
                                {/* <!-- End tab nav item --> */}

                                <li className="nav-item">
                                    <a className="nav-link" data-bs-toggle="tab" data-bs-target="#features-tab-2">
                                        <h4>ionHive RO+</h4>
                                    </a>
                                    {/* <!-- End tab nav item --> */}
                                </li>

                                <li className="nav-item">
                                    <a className="nav-link" data-bs-toggle="tab" data-bs-target="#features-tab-3">
                                        <h4>ionHive Alkaline</h4>
                                    </a>
                                </li>
                                {/* <!-- End tab nav item --> */}

                            </ul>

                        </div>

                        <div className="tab-content" data-aos="fade-up" data-aos-delay="200">

                            <div className="tab-pane fade active show" id="features-tab-1">
                                <div className="container" data-aos="fade-up" data-aos-delay="100">

                                    <div className="row gy-4">

                                        <div className="col-lg-3 col-md-6">
                                            <div className="stats-item text-center w-100 h-100">
                                                <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> Multistage Universal Water purifier</p>
                                            </div>
                                        </div>
                                        {/* <!-- End Stats Item --> */}

                                        <div className="col-lg-3 col-md-6">
                                            <div className="stats-item text-center w-100 h-100">
                                                <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> Goodness of copper</p>
                                            </div>
                                        </div>
                                        {/* <!-- End Stats Item --> */}

                                        <div className="col-lg-3 col-md-6">
                                            <div className="stats-item text-center w-100 h-100">
                                                <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> RO Purification</p>
                                            </div>
                                        </div>
                                        {/* <!-- End Stats Item --> */}

                                        <div className="col-lg-3 col-md-6">
                                            <div className="stats-item text-center w-100 h-100">
                                                <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> In-line UV purification</p>
                                            </div>
                                        </div>
                                        {/* <!-- End Stats Item --> */}

                                    </div>

                                </div>
                                <div className="row" style={{ paddingTop: '30px' }}>
                                    <div className="col-lg-6 order-2 order-lg-1 mt-3 mt-lg-0 d-flex flex-column justify-content-center">
                                        <h3>Flexible Rental Plans</h3>
                                        <p className="fst-italic">Security deposit of ₹1,500 will be 100% refundable</p>

                                        {/* Step 1 - Monthly Usage */}
                                        <h5 className="mt-3">Step 1: Choose Monthly Usage</h5>
                                        <div className="d-flex flex-wrap gap-2 mb-3">
                                            {Object.entries(plans).map(([key, value]) => (
                                                <button
                                                    key={key}
                                                    className={`btn ${usage === key ? "btn-primary" : "btn-outline-primary"}`}
                                                    onClick={() => setUsage(key)}
                                                >
                                                    {key}<br /><small>{value.liters}</small>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Step 2 - Tenure */}
                                        <h5 className="mt-3">Step 2: Choose Tenure</h5>
                                        <div className="d-flex flex-wrap gap-2 mb-3">
                                            {Object.entries(discounts).map(([key, value]) => (
                                                <button
                                                    key={key}
                                                    className={`btn ${tenure === parseInt(key) ? "btn-primary" : "btn-outline-primary"}`}
                                                    onClick={() => setTenure(parseInt(key))}
                                                >
                                                    {value.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Step 3 - Pricing Info */}
                                        <div className="mt-3 p-3 border rounded bg-light">
                                            <h5 style={{ color: "#0d83fd" }}>₹{finalPrice}/month</h5>
                                            <p className="mb-1">{discount > 0 ? `Discount: ${discount}%` : "0% discount"}, Savings of ₹{savings}</p>
                                            <div className="d-flex flex-wrap gap-2 mb-3">
                                                <button className="btn btn-primary me-0 me-sm-2 mx-1" onClick={() => setShowModal(true)}>
                                                    Subscribe Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-6 order-1 order-lg-2 text-center">
                                        {/* Main Image */}
                                        <img
                                            src={mainImage}
                                            alt="Main Product"
                                            className="img-fluid mb-3"
                                            style={{
                                                boxShadow: 'rgb(0 111 255 / 72%) 0px 8px 15px',
                                                borderRadius: '20px', maxWidth: '80%',
                                            }}
                                        />

                                        {/* Thumbnails */}
                                        <div className="d-flex justify-content-center gap-2 sm:gap-4">
                                            {thumbnails.map((img, index) => (
                                                <img
                                                    key={index}
                                                    src={img}
                                                    alt={`Thumbnail ${index + 1}`}
                                                    className={`cursor-pointer rounded-[10px] border ${mainImage === img ? 'border-blue-600' : 'border-gray-300'
                                                        }`}
                                                    style={{
                                                        width: "80px",
                                                        height: "auto",
                                                        cursor: "pointer",
                                                        border: mainImage === img ? "1px solid #0d83fd" : "1px solid #ccc",
                                                        borderRadius: "10px"
                                                    }}
                                                    onClick={() => setMainImage(img)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* <!-- End tab content item --> */}

                            <div className="row stats-row gy-4 mt-5" data-aos="fade-up" data-aos-delay="500" style={{ backgroundColor: '#cff7ff', borderRadius: '20px', margin: '10px' }}>
                                <div className="col-lg-3 col-md-6">
                                    <div className="stat-item" style={{ padding: '0px' }}>
                                        <div className="stat-content">
                                            <h4>Lifetime Free Maintenance</h4>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-3 col-md-6">
                                    <div className="stat-item" style={{ padding: '0px' }}>
                                        <div className="stat-content">
                                            <h4>7 days Risk-Free Trial</h4>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-3 col-md-6">
                                    <div className="stat-item" style={{ padding: '0px' }}>
                                        <div className="stat-content">
                                            <h4>48-hour Installation</h4>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-3 col-md-6">
                                    <div className="stat-item" style={{ padding: '0px' }}>
                                        <div className="stat-content">
                                            <h4>Plans starting 299/month</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <section className="lg:pl-4">
                                <h2 className="font-semibold text-[24px] leading-[140%] lg:text-[32px] mb-6 lg:mb-8">
                                    Copper Water Purifier Product Features
                                </h2>
                                <div className="row" style={{ paddingTop: '30px' }}>
                                    <div className="col-lg-6 order-2 order-lg-1 mt-3 mt-lg-0 d-flex flex-column justify-content-center">
                                        <img src="assets/img/Multistage-Purification-production.webp"
                                            className="rounded-lg shadow w-full"
                                            alt="24*7 Safe and Pure 5 Multistage Copper Water Purification System for home in Bengaluru"
                                            style={{ borderRadius: '10px' }}
                                        /><br />
                                        <img src="assets/img/3-copper-alive-product-features-production.webp"
                                            className="rounded-lg shadow w-full"
                                            alt="High storage capacity for copper water purifier in Bengaluru"
                                            style={{ borderRadius: '10px' }}
                                        />
                                    </div>
                                    <div className="col-lg-6 order-2 order-lg-1 mt-3 mt-lg-0 d-flex flex-column justify-content-center">
                                        <img src="assets/img/2-storm-product-features-production.webp"
                                            className="rounded-lg shadow w-full"
                                            alt="Copper filter for Copper Water Purifier On Rent in Bengaluru"
                                            style={{ borderRadius: '10px' }}
                                        /><br />
                                        <img src="assets/img/4-copper-alive-product-features-production.webp"
                                            className="rounded-lg shadow w-full"
                                            alt="15 LPH Purification for copper water purifier in Bengaluru"
                                            style={{ borderRadius: '10px' }}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="bg-[#FAFAFA] py-10 px-4 lg:px-0 rounded-lg max-w-4xl mx-auto">
                                <h2 className="text-2xl lg:text-3xl font-semibold mb-6">
                                    IOT Enabled Smart Features
                                </h2>

                                <div className="relative overflow-hidden rounded-2xl d-flex flex-column justify-content-center">
                                    <img src={slides[currentSlide].src} alt={slides[currentSlide].alt} className="w-full rounded-2xl transition-all duration-500" style={{ borderRadius: '20px' }} />
                                </div>

                                {/* Dots */}
                                <div className="flex justify-center gap-2 mt-4" style={{ textAlign: 'center' }}>
                                    {slides.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentSlide(index)}
                                            className={`rounded-full transition-colors border w-2.5 h-2.5 ${currentSlide === index
                                                ? 'bg-primary' // Active button with the primary color (you can replace 'bg-primary' with your desired color)
                                                : 'bg-gray-200' // Inactive buttons with gray color
                                                }`}
                                            aria-label={`Go to slide ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </section>

                            <section className="ml-auto md:px-2" style={{ padding: '0px' }}>
                                <div data-orientation="vertical">
                                    <div data-state={isOpen ? "open" : "closed"} data-orientation="vertical" style={{ textAlign: 'center' }} >
                                        <h3 data-orientation="vertical" data-state="open" className="flex">
                                            <button className="btn btn-primary me-0 me-sm-2 mx-1" id="tech-specs-btn" onClick={() => setIsOpen(!isOpen)}>Tech Specifications
                                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200">
                                                    <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </h3>

                                        {isOpen && (
                                            <div id="tech-specs" role="region" aria-labelledby="tech-specs-btn" className="overflow-hidden text-sm">
                                                <div className="pt-0 pb-0 bg-[#F7F7FC]">
                                                    <div className="w-full max-w-4xl mx-auto p-4 px-2 rounded-lg">
                                                        <div className="border border-[#E7E8F1] rounded-lg shadow-lg">
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full table-auto border-collapse border border-[#E7E8F1] [&_td]:bg-[#F7F7FC] [&_th]:text-center [&_th]:text-sm [&_td]:text-[13px] [&_th]:font-bold">
                                                                    <thead>
                                                                        <tr className="bg-[#FCFCFC]">
                                                                            <th colSpan="2" className="text-left p-4 py-[14px] text-title-active font-semibold uppercase border-b border-[#E7E8F1]">
                                                                                Purifier Model
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="py-2 px-2 md:px-4 font-medium">Model</td>
                                                                            <td className="py-2 px-2 md:px-4">ionHive ALIVE RO+UV+Cu</td>
                                                                        </tr>
                                                                        <tr className="bg-[#FCFCFC] border-y border-[#E7E8F1]">
                                                                            <th colSpan="2" className="text-left p-4 py-[14px] text-title-active font-semibold uppercase">
                                                                                Product Specification
                                                                            </th>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Dimension (D x W x H)</td>
                                                                            <td className="py-2 px-2 md:px-4">330mm X 230mm X 490 mm (Approx.)</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Material Details</td>
                                                                            <td className="py-2 px-2 md:px-4">Outer Body - ABS - BACK COVER , FRONT FASCIA</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Weight (Approx.)</td>
                                                                            <td className="py-2 px-2 md:px-4">Net weight 8 Kgs (Approx.)</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Purification Technology</td>
                                                                            <td className="py-2 px-2 md:px-4">RO + UV + Cu</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Purification Stages / Filtration System</td>
                                                                            <td className="py-2 px-2 md:px-4 space-y-1">
                                                                                <p>Stage 1: Sediment</p>
                                                                                <p>Stage 2: Pre carbon</p>
                                                                                <p>Dual Filter</p>
                                                                                <p>Stage 3: RO Membrane</p>
                                                                                <p>Stage 4: UV Lamp 4 watts</p>
                                                                                <p>Stage 5: Post carbon+ copper cartridge</p>
                                                                            </td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Tank Overflow Control</td>
                                                                            <td className="py-2 px-2 md:px-4">MECHANICAL FLOAT</td>
                                                                        </tr>
                                                                        <tr className="bg-[#FCFCFC] border-y border-[#E7E8F1]">
                                                                            <th colSpan="2" className="text-left p-4 py-[14px] text-title-active font-semibold uppercase">
                                                                                Electrical Specifications
                                                                            </th>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Operating Voltage</td>
                                                                            <td className="py-2 px-2 md:px-4">150 to 250 VAC, 50 Hz</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>

                                                                            <td className="px-4 py-2 font-medium">Power Supply</td>
                                                                            <td className="py-2 px-2 md:px-4">Input 230V AC, 50Hz. Output 24V, (On Board SMPS ) External adaptor</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Power Rating</td>
                                                                            <td className="py-2 px-2 md:px-4">40 Watt Maxx</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">UV Lamp</td>
                                                                            <td className="py-2 px-2 md:px-4">4 Watts</td>
                                                                        </tr>
                                                                        <tr className="bg-[#FCFCFC] border-y border-[#E7E8F1]">
                                                                            <th colSpan="2" className="text-left py-1 sm:p-4 sm:py-[14px] text-title-active font-semibold uppercase">
                                                                                Recommended Input <br className="sm:hidden" /> Water Parameters
                                                                            </th>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Total Dissolved Solids (TDS)</td>
                                                                            <td className="py-2 px-2 md:px-4">Up to 2000 mg/L</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Hardness</td>
                                                                            <td className="py-2 px-2 md:px-4">Max. 600 mg/L (If the Hardness level is more than 300mg/L, recommended to use antiscalant cartridge)</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Turbidity</td>
                                                                            <td className="py-2 px-2 md:px-4">Max. 5 NTU</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Iron Content</td>
                                                                            <td className="py-2 px-2 md:px-4">Max. 0.3 mg/L</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Temperature Range</td>
                                                                            <td className="py-2 px-2 md:px-4">5°C to 40°C</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Input Water Pressure</td>
                                                                            <td className="py-2 px-2 md:px-4">Up to 3 Bar (Max)</td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-0 pb-0 bg-[#F7F7FC]">
                                                    <div className="w-full max-w-4xl mx-auto p-4 px-2 rounded-lg">
                                                        <div className="border border-[#E7E8F1] rounded-lg shadow-lg">
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full table-auto border-collapse border border-[#E7E8F1] [&_td]:bg-[#F7F7FC] [&_th]:text-center [&_th]:text-sm [&_td]:text-[13px] [&_th]:font-bold">
                                                                    <thead>
                                                                        <tr className="bg-[#FCFCFC]">
                                                                            <th colSpan="2" className="text-left p-4 py-[14px] text-title-active font-semibold uppercase border-b border-[#E7E8F1]">
                                                                                Purifier Model
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        <tr style={{ borderWidth: '0px' }}>
                                                                            <td className="py-2 px-2 md:px-4 font-medium">Model</td>
                                                                            <td className="py-2 px-2 md:px-4">ionHive RO+</td>
                                                                        </tr>

                                                                        <tr className="bg-[#FCFCFC] border-y border-[#E7E8F1]">
                                                                            <th colSpan="2" className="text-left p-4 py-[14px] text-title-active font-semibold uppercase">
                                                                                Product Specification
                                                                            </th>
                                                                        </tr>
                                                                        <tr style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Dimension (D x W x H)</td>
                                                                            <td className="py-2 px-2 md:px-4">350 x 210 x 520 mm</td>
                                                                        </tr>
                                                                        <tr style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Material Details</td>
                                                                            <td className="py-2 px-2 md:px-4">ABS Body and Front Cover, PP Tank</td>
                                                                        </tr>
                                                                        <tr style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Weight (Approx.)</td>
                                                                            <td className="py-2 px-2 md:px-4">5 Kgs (Approx.)</td>
                                                                        </tr>
                                                                        <tr style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Purification Technology</td>
                                                                            <td className="py-2 px-2 md:px-4">RO + Mineral Cartridge</td>
                                                                        </tr>
                                                                        <tr style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Purification Stages / Filtration System</td>
                                                                            <td className="py-2 px-2 md:px-4 space-y-1">
                                                                                <p>Stage 1: Sediment</p>
                                                                                <p>Stage 2: Pre carbon</p>
                                                                                <p>Dual Filter</p>
                                                                                <p>Stage 3: RO Membrane HR</p>
                                                                                <p>Stage 4: MINERAL CARTRIDGE</p>
                                                                            </td>
                                                                        </tr>
                                                                        <tr style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Tank Overflow Control</td>
                                                                            <td className="py-2 px-2 md:px-4">6.5L (Dispensable Water)</td>
                                                                        </tr>

                                                                        <tr className="bg-[#FCFCFC] border-y border-[#E7E8F1]">
                                                                            <th colSpan="2" className="text-left p-4 py-[14px] text-title-active font-semibold uppercase">
                                                                                Electrical Specifications
                                                                            </th>
                                                                        </tr>
                                                                        <tr style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Operating Voltage</td>
                                                                            <td className="py-2 px-2 md:px-4">24V</td>
                                                                        </tr>
                                                                        <tr style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Power Supply</td>
                                                                            <td className="py-2 px-2 md:px-4">Input 230V / External AC-DC Adaptor, 24V DC, 2 AMPS</td>
                                                                        </tr>
                                                                        <tr style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Power Rating</td>
                                                                            <td className="py-2 px-2 md:px-4">30 Watt (working power)</td>
                                                                        </tr>
                                                                        <tr style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Solenoid Valve</td>
                                                                            <td className="py-2 px-2 md:px-4">24V DC, PL4 Inlet & Outlet (Direct Acting)</td>
                                                                        </tr>
                                                                        <tr style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Pump</td>
                                                                            <td className="py-2 px-2 md:px-4">RO Booster Pump LX100GPD</td>
                                                                        </tr>

                                                                        <tr className="bg-[#FCFCFC] border-y border-[#E7E8F1]">
                                                                            <th colSpan="2" className="text-left p-4 py-[14px] text-title-active font-semibold uppercase">
                                                                                Recommended Input <br className="sm:hidden" /> Water Parameters
                                                                            </th>
                                                                        </tr>
                                                                        <tr style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Total Dissolved Solids (TDS)</td>
                                                                            <td className="py-2 px-2 md:px-4">Up to 2000 mg/L</td>
                                                                        </tr>
                                                                        <tr style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Hardness</td>
                                                                            <td className="py-2 px-2 md:px-4">Max. 600 mg/L (If the Hardness level is more than 300mg/L, recommended to use antiscalant cartridge)</td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-0 pb-0 bg-[#F7F7FC]">
                                                    <div className="w-full max-w-4xl mx-auto p-4 px-2 rounded-lg">
                                                        <div className="border border-[#E7E8F1] rounded-lg shadow-lg">
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full table-auto border-collapse border border-[#E7E8F1] [&_td]:bg-[#F7F7FC] [&_th]:text-center [&_th]:text-sm [&_td]:text-[13px] [&_th]:font-bold">
                                                                    <thead>
                                                                        <tr className="bg-[#FCFCFC]">
                                                                            <th colSpan="2" className="text-left p-4 py-[14px] text-title-active font-semibold uppercase border-b border-[#E7E8F1]">
                                                                                Purifier Model
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="py-2 px-2 md:px-4 font-medium">Model</td>
                                                                            <td className="py-2 px-2 md:px-4">ionHive ALIVE RO + UV + ALKALINE</td>
                                                                        </tr>
                                                                        <tr className="bg-[#FCFCFC] border-y border-[#E7E8F1]">
                                                                            <th colSpan="2" className="text-left p-4 py-[14px] text-title-active font-semibold uppercase">
                                                                                Product Specification
                                                                            </th>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Dimension (D x W x H)</td>
                                                                            <td className="py-2 px-2 md:px-4">330mm X 230mm X 490mm (Approx.)</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Material Details</td>
                                                                            <td className="py-2 px-2 md:px-4">Outer Body – ABS – BACK COVER , FRONT FASCIA</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Weight (Approx.)</td>
                                                                            <td className="py-2 px-2 md:px-4">Net weight 8 Kgs (Approx.)</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Purification Technology</td>
                                                                            <td className="py-2 px-2 md:px-4">RO + UV + Alkaline</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Purification Stages / Filtration System</td>
                                                                            <td className="py-2 px-2 md:px-4 space-y-1">
                                                                                <p>Stage 1: Sediment</p>
                                                                                <p>Stage 2: Pre carbon</p>
                                                                                <p>Dual Filter</p>
                                                                                <p>Stage 3: RO Membrane</p>
                                                                                <p>Stage 4: UV Lamp 4 watts</p>
                                                                                <p>Stage 5: ALKALINE CARTRIDGE</p>
                                                                            </td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Tank Overflow Control</td>
                                                                            <td className="py-2 px-2 md:px-4">MECHANICAL FLOAT</td>
                                                                        </tr>
                                                                        <tr className="bg-[#FCFCFC] border-y border-[#E7E8F1]">
                                                                            <th colSpan="2" className="text-left p-4 py-[14px] text-title-active font-semibold uppercase">
                                                                                Electrical Specifications
                                                                            </th>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Operating Voltage</td>
                                                                            <td className="py-2 px-2 md:px-4">150 to 250 VAC, 50 Hz</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Power Supply</td>
                                                                            <td className="py-2 px-2 md:px-4">Input 230V AC, 50Hz. Output 24V, (On Board SMPS ) External adaptor</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Power Rating</td>
                                                                            <td className="py-2 px-2 md:px-4">40 Watt Maxx</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">UV Lamp</td>
                                                                            <td className="py-2 px-2 md:px-4">4 Watts</td>
                                                                        </tr>
                                                                        <tr className="bg-[#FCFCFC] border-y border-[#E7E8F1]">
                                                                            <th colSpan="2" className="text-left py-1 sm:p-4 sm:py-[14px] text-title-active font-semibold uppercase">
                                                                                Recommended Input <br className="sm:hidden" /> Water Parameters
                                                                            </th>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Total Dissolved Solids (TDS)</td>
                                                                            <td className="py-2 px-2 md:px-4">Up to 2000 mg/L</td>
                                                                        </tr>
                                                                        <tr className="border-b border-[#E7E8F1]" style={{ borderWidth: '0px' }}>
                                                                            <td className="px-4 py-2 font-medium">Hardness</td>
                                                                            <td className="py-2 px-2 md:px-4">Max. 600 mg/L (If the Hardness level is more than 300mg/L, recommended to use antiscalant cartridge)</td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <div className="tab-pane fade" id="features-tab-2">
                                <div className="container" data-aos="fade-up" data-aos-delay="100">

                                    <div className="row gy-4">

                                        <div className="col-lg-3 col-md-6">
                                            <div className="stats-item text-center w-100 h-100">
                                                <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> Multistage Universal Water purifier</p>
                                            </div>
                                        </div>
                                        {/* <!-- End Stats Item --> */}

                                        <div className="col-lg-3 col-md-6">
                                            <div className="stats-item text-center w-100 h-100">
                                                <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> Mineral cartridge</p>
                                            </div>
                                        </div>
                                        {/* <!-- End Stats Item --> */}

                                        <div className="col-lg-3 col-md-6">
                                            <div className="stats-item text-center w-100 h-100">
                                                <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> RO Purification</p>
                                            </div>
                                        </div>
                                        {/* <!-- End Stats Item --> */}

                                        <div className="col-lg-3 col-md-6">
                                            <div className="stats-item text-center w-100 h-100">
                                                <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> Intuitive 3 LED Display</p>
                                            </div>
                                        </div>
                                        {/* <!-- End Stats Item --> */}

                                    </div>

                                </div>
                                <div className="row" style={{ paddingTop: '30px' }}>
                                    <div className="col-lg-6 order-2 order-lg-1 mt-3 mt-lg-0 d-flex flex-column justify-content-center">
                                        <h3>Flexible Rental Plans</h3>
                                        <p className="fst-italic">Security deposit of ₹1,500 will be 100% refundable</p>

                                        {/* Step 1 - Monthly Usage */}
                                        <h5 className="mt-3">Step 1: Choose Monthly Usage</h5>
                                        <div className="d-flex flex-wrap gap-2 mb-3">
                                            {Object.entries(plansRO).map(([key, value]) => (
                                                <button
                                                    key={key}
                                                    className={`btn ${usageRO === key ? "btn-primary" : "btn-outline-primary"}`}
                                                    onClick={() => setUsageRO(key)}
                                                >
                                                    {key}<br /><small>{value.liters}</small>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Step 2 - Tenure */}
                                        <h5 className="mt-3">Step 2: Choose Tenure</h5>
                                        <div className="d-flex flex-wrap gap-2 mb-3">
                                            {Object.entries(discountsRO).map(([key, value]) => (
                                                <button
                                                    key={key}
                                                    className={`btn ${tenureRO === parseInt(key) ? "btn-primary" : "btn-outline-primary"}`}
                                                    onClick={() => setTenureRO(parseInt(key))}
                                                >
                                                    {value.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Step 3 - Pricing Info */}
                                        <div className="mt-3 p-3 border rounded bg-light">
                                            <h5 style={{ color: "#0d83fd" }}>₹{finalPriceRO}/month</h5>
                                            <p className="mb-1">{discountRO > 0 ? `Discount: ${discountRO}%` : "0% discount"}, Savings of ₹{savingsRO}</p>
                                            <div className="d-flex flex-wrap gap-2 mb-3">
                                                <button className="btn btn-primary me-0 me-sm-2 mx-1" onClick={() => setShowModal(true)}>
                                                    Subscribe Now
                                                </button>
                                                <button className="btn btn-primary me-0 me-sm-2 mx-1">Know More</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-6 order-1 order-lg-2 text-center">
                                        {/* Main Image */}
                                        <img
                                            src={mainImageRO}
                                            alt="Main Product"
                                            className="img-fluid mb-3"
                                            style={{
                                                boxShadow: 'rgb(0 111 255 / 72%) 0px 8px 15px',
                                                borderRadius: '20px', maxWidth: '80%',
                                            }}
                                        />

                                        {/* Thumbnails */}
                                        <div className="d-flex justify-content-center gap-2">
                                            {thumbnailsRO.map((img, index) => (
                                                <img
                                                    key={index}
                                                    src={img}
                                                    alt={`Thumbnail ${index + 1}`}
                                                    className="img-thumbnail"
                                                    style={{
                                                        width: "80px",
                                                        height: "auto",
                                                        cursor: "pointer",
                                                        border: mainImageRO === img ? "1px solid #0d83fd" : "1px solid #ccc",
                                                        borderRadius: "10px"
                                                    }}
                                                    onClick={() => setMainImageRO(img)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>
                            {/* <!-- End tab content item --> */}

                            <div className="tab-pane fade" id="features-tab-3">
                                <div className="container" data-aos="fade-up" data-aos-delay="100">

                                    <div className="row gy-4">

                                        <div className="col-lg-3 col-md-6">
                                            <div className="stats-item text-center w-100 h-100">
                                                <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> Multistage Universal Water purifier</p>
                                            </div>
                                        </div>
                                        {/* <!-- End Stats Item --> */}

                                        <div className="col-lg-3 col-md-6">
                                            <div className="stats-item text-center w-100 h-100">
                                                <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> Alkaline boost</p>
                                            </div>
                                        </div>
                                        {/* <!-- End Stats Item --> */}

                                        <div className="col-lg-3 col-md-6">
                                            <div className="stats-item text-center w-100 h-100">
                                                <p style={{ color: '#0d83fd' }}><i className="bi bi-check2-circle"></i> RO Purification</p>
                                            </div>
                                        </div>
                                        {/* <!-- End Stats Item --> */}

                                        <div className="col-lg-3 col-md-6">
                                            <div className="stats-item text-center w-100 h-100">
                                                <p style={{ color: '#0d83fd' }}> <i className="bi bi-check2-circle"></i> In-line UV purification</p>
                                            </div>
                                        </div>
                                        {/* <!-- End Stats Item --> */}

                                    </div>

                                </div>
                                <div className="row" style={{ paddingTop: '30px' }}>
                                    <div className="col-lg-6 order-2 order-lg-1 mt-3 mt-lg-0 d-flex flex-column justify-content-center">
                                        <h3>Flexible Rental Plans</h3>
                                        <p className="fst-italic">Security deposit of ₹1,500 will be 100% refundable</p>

                                        {/* Step 1 - Monthly Usage */}
                                        <h5 className="mt-3">Step 1: Choose Monthly Usage</h5>
                                        <div className="d-flex flex-wrap gap-2 mb-3">
                                            {Object.entries(plansAlkaline).map(([key, value]) => (
                                                <button
                                                    key={key}
                                                    className={`btn ${usageAlkaline === key ? "btn-primary" : "btn-outline-primary"}`}
                                                    onClick={() => setUsageAlkaline(key)}
                                                >
                                                    {key}<br /><small>{value.liters}</small>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Step 2 - Tenure */}
                                        <h5 className="mt-3">Step 2: Choose Tenure</h5>
                                        <div className="d-flex flex-wrap gap-2 mb-3">
                                            {Object.entries(discountsAlkaline).map(([key, value]) => (
                                                <button
                                                    key={key}
                                                    className={`btn ${tenureAlkaline === parseInt(key) ? "btn-primary" : "btn-outline-primary"}`}
                                                    onClick={() => setTenureAlkaline(parseInt(key))}
                                                >
                                                    {value.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Step 3 - Pricing Info */}
                                        <div className="mt-3 p-3 border rounded bg-light">
                                            <h5 style={{ color: "#0d83fd" }}>₹{finalPriceAlkaline}/month</h5>
                                            <p className="mb-1">{discountAlkaline > 0 ? `Discount: ${discountAlkaline}%` : "0% discount"}, Savings of ₹{savingsAlkaline}</p>
                                            <div className="d-flex flex-wrap gap-2 mb-3">
                                                <button className="btn btn-primary me-0 me-sm-2 mx-1" onClick={() => setShowModal(true)}>
                                                    Subscribe Now
                                                </button>
                                                <button className="btn btn-primary me-0 me-sm-2 mx-1">Know More</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-6 order-1 order-lg-2 text-center">
                                        {/* Main Image */}
                                        <img
                                            src={mainImageAlkaline}
                                            alt="Main Product"
                                            className="img-fluid mb-3"
                                            style={{
                                                boxShadow: 'rgb(0 111 255 / 72%) 0px 8px 15px',
                                                borderRadius: '20px', maxWidth: '80%',
                                            }}
                                        />

                                        {/* Thumbnails */}
                                        <div className="d-flex justify-content-center gap-2">
                                            {thumbnailsAlkaline.map((img, index) => (
                                                <img
                                                    key={index}
                                                    src={img}
                                                    alt={`Thumbnail ${index + 1}`}
                                                    className="img-thumbnail"
                                                    style={{
                                                        width: "80px",
                                                        height: "auto",
                                                        cursor: "pointer",
                                                        border: mainImageAlkaline === img ? "1px solid #0d83fd" : "1px solid #ccc",
                                                        borderRadius: "10px"
                                                    }}
                                                    onClick={() => setMainImageAlkaline(img)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>
                            {/* <!-- End tab content item --> */}

                            {/* Subscribe model start */}
                            {/* Modal Component */}
                            <div className={`modal ${showModal ? "d-block" : "d-none"}`} tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                                <div className="modal-dialog">
                                    <div className="modal-content" style={{ marginTop: '30%' }}>
                                        <div className="modal-header" style={{ alignItems: 'center' }}>
                                            <h5 className="modal-title">Submit Your Details</h5>
                                            <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                        </div>
                                        <div className="modal-body">
                                            <form onSubmit={handleSubmit}>
                                                <div className="mb-3">
                                                    <label>Name</label>
                                                    <input type="text" className="form-control" required value={name} onChange={(e) => setName(e.target.value)} />
                                                </div>
                                                <div className="mb-3">
                                                    <label>Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        className="form-control"
                                                        required
                                                        value={phone}
                                                        maxLength={10}
                                                        onChange={(e) => {
                                                            let input = e.target.value;
                                                            // Remove all non-digit characters
                                                            input = input.replace(/\D/g, '');
                                                            // Remove the first character if it's a zero
                                                            if (input.startsWith('0')) {
                                                                input = input.substring(1);
                                                            }
                                                            setPhone(input);
                                                        }}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label>Email ID</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        required
                                                        value={emailID}
                                                        onChange={(e) => setEmailID(e.target.value)}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label>Referral Code</label>
                                                    <input type="text" className="form-control" maxLength={6}
                                                        value={referral} onChange={(e) => setReferral(e.target.value)} />
                                                </div>
                                                <div className="mb-3">
                                                    <label>City</label>
                                                    <select className="form-control" value={city} onChange={(e) => setCity(e.target.value)}>
                                                        <option value="Bangalore">Bangalore</option>
                                                        <option value="Hyderabad">Hyderabad</option>
                                                        <option value="Mumbai">Mumbai</option>
                                                        {/* Add other cities */}
                                                    </select>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                                    <h6 className="modal-title mb-3">Trusted by 1M+ customers across 9 cities</h6>

                                                    <p>
                                                        <i className="bi bi-check2-circle" style={{ color: '#0d83fd' }}></i> Lifetime Free Maintenance<br />
                                                        <i className="bi bi-check2-circle" style={{ color: '#0d83fd' }}></i> 7 Day Free Trial<br />
                                                        <i className="bi bi-check2-circle" style={{ color: '#0d83fd' }}></i> 48 Hours Installation - Starting at ₹299/month
                                                    </p>

                                                    <button type="submit" className="btn btn-primary mb-2">Get a call back</button>

                                                    <p style={{ fontSize: '0.9rem', color: '#666' }}>
                                                        By creating an account on <strong>ionHive</strong>, you agree to our <a href="#">Terms of Use</a>
                                                    </p>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Subscribe model end */}

                        </div>

                    </div>

                </section>
                {/* <!-- /Features Section --> */}

                {/* <!-- Start Advantage Section --> */}
                <section id="features" className="features section" style={{ padding: '0px' }}>

                    {/* <!-- Section Title --> */}
                    <div className="container section-title" data-aos="fade-up">
                        <h2>The ionHive Advantage Next-gen Water Purification at Best Costs</h2>
                        <p>Experience the smartest water purification solutions with ionHive.</p>
                    </div>
                    {/* <!-- End Section Title --> */}

                    {/* <!-- Stats Section --> */}
                    <section id="stats" className="stats section" style={{ padding: '10px', borderRadius: '10px' }}>

                        <div className="container" data-aos="fade-up" data-aos-delay="100">

                            <div style={{ height: '100%', width: '100%', overflow: 'scroll', borderRadius: 'inherit', }} >
                                <div style={{ minWidth: '100%', display: 'table' }}>
                                    <table style={{ marginTop: '3rem', width: '100%', minWidth: '750px', borderCollapse: 'collapse', }} >
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ width: '150px', height: '160px', padding: '20px', fontSize: '1.5rem', fontWeight: 600, textAlign: 'center', lineHeight: '2rem', }} >
                                                    Choose <br /> Smart
                                                </th>
                                                <th style={{ width: '150px', padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', }} >
                                                        <img src="assets/img/download.webp" alt="water can" style={{ height: '90px', width: '74px' }} loading="lazy" />
                                                        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Water Can</p>
                                                    </div>
                                                </th>
                                                <th style={{ width: '150px', padding: '20px', textAlign: 'center', }} >
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', }} >
                                                        <img src="assets/img/other_purifier copy-production.webp" alt="other water purifier" style={{ height: '90px', width: '74px' }} loading="lazy" />
                                                        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Other Purifiers</p>
                                                    </div>
                                                </th>
                                                <th style={{ backgroundColor: '#F5F5F5', width: '150px', padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', top: '3px', }} >
                                                        <svg width="47" height="36" style={{ fill: '#292929' }}>
                                                            <use href="#dp-initials" />
                                                        </svg>
                                                        <p style={{ marginTop: '38px', fontSize: '0.75rem' }}>ionHive</p>
                                                    </div>
                                                </th>
                                                <th style={{ width: '150px', padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', top: '3px', }}>
                                                        <img src="assets/img/mark-success.jpg" alt="other water purifier" style={{ height: '90px' }} loading="lazy" />
                                                        <p style={{ marginTop: '28px', fontSize: '0.75rem' }}>ionHive Advantage</p>
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ fontWeight: 'bold', color: '#00AEEF', fontSize: '0.875rem', padding: '20px', }} >SAFE Drinking Water</td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-x-circle" style={{ color: "red" }}></i>
                                                        <span>Unfit for drinking</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }} >
                                                        <i className="bi bi-exclamation-circle" style={{ color: "red" }}></i>
                                                        <span>Under or Over Purified Water</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F5F5F5', }} >
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-check2-circle" style={{ color: "#2c8a00" }}></i>
                                                        <span>Perfectly purified water</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <span>Pure & healthy drinking water</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ fontWeight: 'bold', color: '#00AEEF', fontSize: '0.875rem', padding: '20px', }} >MULTISTAGE Purification</td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-x-circle" style={{ color: "red" }}></i>
                                                        <span>Unknown process</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }} >
                                                        <i className="bi bi-exclamation-circle" style={{ color: "red" }}></i>
                                                        <span>Options Available At High Costs</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F5F5F5', }} >
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-check2-circle" style={{ color: "#2c8a00" }}></i>
                                                        <span>RO + UV with Copper or Alkaline filter</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <span>Advanced purification at best prices</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ fontWeight: 'bold', color: '#00AEEF', fontSize: '0.875rem', padding: '20px', }} >AFFORDABLE Prices</td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-x-circle" style={{ color: "red" }}></i>
                                                        <span>₹2 - ₹4/litre No maintenance</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }} >
                                                        <i className="bi bi-exclamation-circle" style={{ color: "red" }}></i>
                                                        <span>₹20,000 to purchase ₹5,000/year to maintain</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F5F5F5', }} >
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-check2-circle" style={{ color: "#2c8a00" }}></i>
                                                        <span>Starts at ₹1/litre FREE maintenance</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <span>ZERO upfront cost Lifetime FREE maintenance</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ fontWeight: 'bold', color: '#00AEEF', fontSize: '0.875rem', padding: '20px', }} >RELIABLE Service</td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-x-circle" style={{ color: "red" }}></i>
                                                        <span>Hassle to order, replace, transport</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }} >
                                                        <i className="bi bi-exclamation-circle" style={{ color: "red" }}></i>
                                                        <span>Manual coordination</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F5F5F5', }} >
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-check2-circle" style={{ color: "#2c8a00" }}></i>
                                                        <span>App for easy recharge & service requests</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <span>Tech-enabled service</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ fontWeight: 'bold', color: '#00AEEF', fontSize: '0.875rem', padding: '20px', }} >TECH Enabled Features</td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-x-circle" style={{ color: "red" }}></i>
                                                        <span>NA</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }} >
                                                        <i className="bi bi-exclamation-circle" style={{ color: "red" }}></i>
                                                        <span>NA</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F5F5F5', }} >
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <i className="bi bi-check2-circle" style={{ color: "#2c8a00" }}></i>
                                                        <span>One-click tracking of consumption, water quality & filter health</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'center', }}>
                                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.75rem', }}>
                                                        <span>IoT enabled SMART purifiers</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </section>
                    {/* <!-- /Stats Section --> */}

                </section>
                {/* <!-- End Advantage Section --> */}

                {/* <!-- Call To Action Section --> */}
                <section id="call-to-action" className="call-to-action section">

                    <div className="container" data-aos="fade-up" data-aos-delay="100">

                        <div className="row content justify-content-center align-items-center position-relative">
                            <div className="col-lg-8 mx-auto text-center">
                                <h2 className="display-4 mb-4">Start Your 7-Day Risk-Free Trial</h2>
                                <p className="mb-4">Trusted by a community of 1M+ accross 9 cities</p>
                                <div className="container" data-aos="fade-up" data-aos-delay="100" style={{ padding: '0px' }}>
                                    <div className="row g-4">
                                        <div className="col-lg-12">
                                            <div className="contact-form" data-aos="fade-up" data-aos-delay="300">

                                                <form method="post" className="php-email-form" data-aos="fade-up" data-aos-delay="200">
                                                    <div className="row gy-4">

                                                        <div className="col-md-6">
                                                            <input type="text" name="name" className="form-control" placeholder="Enter Your Name" required="" />
                                                        </div>

                                                        <div className="col-md-6">
                                                            <input type="text" name="name" className="form-control" placeholder="Enter Your Phone" required="" />
                                                        </div>

                                                        <div className="col-md-6 ">
                                                            <input type="email" className="form-control" name="email" placeholder="Enter Your Email" required="" />
                                                        </div>

                                                        <div className="col-md-6 ">
                                                            <input type="referral code" className="form-control" name="email" placeholder="Referral code" required="" />
                                                        </div>

                                                        <div className="col-md-6">
                                                            <select className="form-control">
                                                                <option value="Bangalore" readOnly>City</option>
                                                                <option value="Bangalore">Bangalore</option>
                                                                <option value="Hyderabad">Hyderabad</option>
                                                                <option value="Mumbai">Mumbai</option>
                                                                {/* Add other cities */}
                                                            </select>
                                                        </div>

                                                        <div className="col-md-6 ">
                                                            <button type="submit" className="btn" style={{ backgroundColor: '#14ff10', borderRadius: '20px' }}>Book Now</button>
                                                        </div>

                                                        <div className="col-12 text-center">
                                                            <div className="loading">Loading</div>
                                                            <div className="error-message"></div>
                                                            <div className="sent-message">Your message has been sent. Thank you!</div>

                                                        </div>

                                                    </div>
                                                </form>
                                                <p style={{ fontSize: '0.9rem' }}>
                                                    By creating an account on  <strong>ionHive</strong>, you agree to our <a href="#" style={{ color: '#14ff10' }}>Terms of Use</a>
                                                </p>
                                            </div>
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

                {/* <!-- Faq Section --> */}
                <section className="faq-9 faq section light-background" id="faq">
                    <div className="container">
                        <div className="row">

                            <div className="col-lg-5" data-aos="fade-up">
                                <h2 className="faq-title">Frequently asked questions</h2>
                                <div className="faq-arrow d-none d-lg-block" data-aos="fade-up" data-aos-delay="200">
                                    <svg className="faq-arrow" width="200" height="211" viewBox="0 0 200 211" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M198.804 194.488C189.279 189.596 179.529 185.52 169.407 182.07L169.384 182.049C169.227 181.994 169.07 181.939 168.912 181.884C166.669 181.139 165.906 184.546 167.669 185.615C174.053 189.473 182.761 191.837 189.146 195.695C156.603 195.912 119.781 196.591 91.266 179.049C62.5221 161.368 48.1094 130.695 56.934 98.891C84.5539 98.7247 112.556 84.0176 129.508 62.667C136.396 53.9724 146.193 35.1448 129.773 30.2717C114.292 25.6624 93.7109 41.8875 83.1971 51.3147C70.1109 63.039 59.63 78.433 54.2039 95.0087C52.1221 94.9842 50.0776 94.8683 48.0703 94.6608C30.1803 92.8027 11.2197 83.6338 5.44902 65.1074C-1.88449 41.5699 14.4994 19.0183 27.9202 1.56641C28.6411 0.625793 27.2862 -0.561638 26.5419 0.358501C13.4588 16.4098 -0.221091 34.5242 0.896608 56.5659C1.8218 74.6941 14.221 87.9401 30.4121 94.2058C37.7076 97.0203 45.3454 98.5003 53.0334 98.8449C47.8679 117.532 49.2961 137.487 60.7729 155.283C87.7615 197.081 139.616 201.147 184.786 201.155L174.332 206.827C172.119 208.033 174.345 211.287 176.537 210.105C182.06 207.125 187.582 204.122 193.084 201.144C193.346 201.147 195.161 199.887 195.423 199.868C197.08 198.548 193.084 201.144 195.528 199.81C196.688 199.192 197.846 198.552 199.006 197.935C200.397 197.167 200.007 195.087 198.804 194.488ZM60.8213 88.0427C67.6894 72.648 78.8538 59.1566 92.1207 49.0388C98.8475 43.9065 106.334 39.2953 114.188 36.1439C117.295 34.8947 120.798 33.6609 124.168 33.635C134.365 33.5511 136.354 42.9911 132.638 51.031C120.47 77.4222 86.8639 93.9837 58.0983 94.9666C58.8971 92.6666 59.783 90.3603 60.8213 88.0427Z" fill="currentColor"></path>
                                    </svg>
                                </div>
                            </div>

                            <div className="col-lg-7" data-aos="fade-up" data-aos-delay="300">
                                <div className="faq-container">
                                    {faqs.map((faq, index) => (
                                        <div
                                            key={index}
                                            className={`faq-item ${activeIndex === index ? 'faq-active' : ''}`}
                                            onClick={() => handleToggle(index)}
                                        >
                                            <h3>{faq.question}</h3>
                                            <div className="faq-content" style={{ display: activeIndex === index ? 'block' : 'none' }}>
                                                <p>{faq.answer}</p>
                                            </div>
                                            <i className={`faq-toggle bi ${activeIndex === index ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
                {/* <!-- /Faq Section --> */}

                {/* <!-- City Section --> */}
                <section id="contact" className="contact section light-background">

                    {/* <!-- Section Title --> */}
                    <div className="container section-title" data-aos="fade-up">
                        <h2>Cities We Are Present In</h2>
                    </div>
                    {/* <!-- End Section Title --> */}

                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="container footer-top">
                            <div className="row gy-4">
                                <div className="col-lg-4 col-md-6 footer-about">
                                    <a href="index.html" className="logo d-flex align-items-center">
                                        <span className="sitename">copper Water purifier</span>
                                    </a>
                                    <div className="footer-contact pt-3">
                                        <p>copper Water purifier in Bengaluru</p>
                                        <p>copper Water purifier in Hyderabad</p>
                                        <p>copper Water purifier in Delhi</p>
                                        <p>copper Water purifier in Gurgaon</p>
                                        <p>copper Water purifier in Ghaziabad</p>
                                        <p>copper Water purifier in Faridabad</p>
                                        <p>copper Water purifier in Noida</p>
                                        <p>copper Water purifier in Mumbai</p>
                                    </div>
                                </div>

                                <div className="col-lg-4 col-md-6 footer-about">
                                    <a href="index.html" className="logo d-flex align-items-center">
                                        <span className="sitename">RO+  Water Purifier</span>
                                    </a>
                                    <div className="footer-contact pt-3">
                                        <p>RO+ Water purifier in Bengaluru</p>
                                        <p>RO+ Water purifier in Hyderabad</p>
                                        <p>RO+ Water purifier in Delhi</p>
                                        <p>RO+ Water purifier in Gurgaon</p>
                                        <p>RO+ Water purifier in Ghaziabad</p>
                                        <p>RO+ Water purifier in Faridabad</p>
                                        <p>RO+ Water purifier in Noida</p>
                                        <p>RO+ Water purifier in Mumbai</p>
                                    </div>
                                </div>

                                <div className="col-lg-4 col-md-6 footer-about">
                                    <a href="index.html" className="logo d-flex align-items-center">
                                        <span className="sitename">alkaline Water Purifier</span>
                                    </a>
                                    <div className="footer-contact pt-3">
                                        <p>alkaline Water purifier in Bengaluru</p>
                                        <p>alkaline Water purifier in Hyderabad</p>
                                        <p>alkaline Water purifier in Delhi</p>
                                        <p>alkaline Water purifier in Gurgaon</p>
                                        <p>alkaline Water purifier in Ghaziabad</p>
                                        <p>alkaline Water purifier in Faridabad</p>
                                        <p>alkaline Water purifier in Noida</p>
                                        <p>alkaline Water purifier in Mumbai</p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </section>
                {/* <!-- /City Section --> */}

            </main>

            {/* Footer */}
            < Footer />
        </div>
    );
};

export default ProductList;
import { useState } from "react";
import Swal from 'sweetalert2';

const useHome = () => {
    const productConfigs = {
        1: {
            name: "ionHive Copper",
            plans: {
                SOLO: { liters: "130 ltrs/m", base: 449 },
                COUPLE: { liters: "200 ltrs/m", base: 549 },
                FAMILY: { liters: "500 ltrs/m", base: 749 },
                UNLIMITED: { liters: "Unlimited/m", base: 999 },
            },
            discounts: {
                28: { label: "28 days", discount: 0 },
                90: { label: "90 days", discount: 10 },
                360: { label: "360 days", discount: 20 },
            },
            thumbnails: [
                "assets/img/copper_purifier.webp",
                "assets/img/uv_purification.webp",
                "assets/img/copper_filter.webp",
                "assets/img/multistage_purification.webp",
                "assets/img/wall_mount.webp",
            ],
            defaultImage: "assets/img/copper_purifier.webp",
            defaultUsage: "SOLO"
        },
        2: {
            name: "ionHive RO+",
            plans: {
                BASIC: { liters: "250 ltrs/m", base: 449 },
                UNLIMITED: { liters: "Unlimited/m", base: 999 },
            },
            discounts: {
                28: { label: "28 days", discount: 0 },
                360: { label: "360 days", discount: 20 },
            },
            thumbnails: [
                "assets/img/ro+_water_purifier.webp",
                "assets/img/ro_membrane.webp",
                "assets/img/multistage_purification.webp",
                "assets/img/dual_cartridge.webp",
                "assets/img/wall_mount.webp",
            ],
            defaultImage: "assets/img/ro+_water_purifier.webp",
            defaultUsage: "BASIC"
        },
        3: {
            name: "ionHive Alkaline",
            plans: {
                STANDARD: { liters: "250 ltrs/m", base: 449 },
                UNLIMITED: { liters: "Unlimited/m", base: 999 },
            },
            discounts: {
                28: { label: "28 days", discount: 0 },
                360: { label: "360 days", discount: 20 },
            },
            thumbnails: [
                "assets/img/alkaline_water_purifier.webp",
                "assets/img/alkaline_boost.webp",
                "assets/img/multistage_purification.webp",
                "assets/img/alkaline_cartridge.webp",
                "assets/img/capacity.webp",
            ],
            defaultImage: "assets/img/alkaline_water_purifier.webp",
            defaultUsage: "STANDARD"
        }
    };

    const [selectedTab, setSelectedTab] = useState(1); // 1 = Copper
    const [usage, setUsage] = useState(productConfigs[1].defaultUsage);
    const [tenure, setTenure] = useState(28);
    const [mainImage, setMainImage] = useState(productConfigs[1].defaultImage);

    const handleTabChange = (tabId) => {
        setSelectedTab(tabId);
        setUsage(productConfigs[tabId].defaultUsage);
        setTenure(28);
        setMainImage(productConfigs[tabId].defaultImage);
    };

    const currentConfig = productConfigs[selectedTab];
    const basePrice = currentConfig.plans[usage]?.base || 0;
    const discount = currentConfig.discounts[tenure]?.discount || 0;
    const finalPrice = basePrice - (basePrice * discount) / 100;
    const savings = (basePrice * discount) / 100;

    {/* Sub model */ }
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [emailID, setEmailID] = useState("");
    const [city, setCity] = useState("Bangalore");
    const [subLoading, setSubLoading] = useState(false);

    const RAZORPAY_KEY = "rzp_test_oHoZ3Q1fF6pYEI";

    const handleSubmit = async (e) => {
        e.preventDefault();

        const phoneRegex = /^[1-9][0-9]{9}$/;
        const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;

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
                text: 'Please enter a valid email address.'
            });
            return;
        }

        setSubLoading(true);

        const gst = parseFloat((finalPrice * 0.18).toFixed(2));
        const totalPrice = parseFloat((finalPrice * 1.18).toFixed(2));
        const months = Math.ceil(tenure / 30); // approximate month count from days
        const durationTotalPrice = parseFloat((months * totalPrice).toFixed(2));

        const payload = {
            name,
            phone: parseInt(phone),
            emailID,
            city,
            selectedProduct: currentConfig.name,
            planType: usage,
            tenure: `${tenure} days`, // in days
            basePrice,
            discountPercentage: discount,
            discountedPrice: finalPrice,
            savings,
            gst,
            totalPrice,
            durationTotalPrice
        };

        try {
            const res = await fetch("http://192.168.1.14:5000/api/subscription-plans/addplan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok || !data.razorpayOrderId) {
                Swal.fire({
                    icon: "error",
                    title: "Submission Failed",
                    text: data.message || "Server did not respond properly.",
                });
                return;
            }

            const options = {
                key: RAZORPAY_KEY,
                amount: durationTotalPrice * 100, // in paisa
                currency: "INR",
                name: "Subscription Payment",
                description: `Plan for ${months} month(s)`,
                image: "/assets/img/ionHive.png",
                order_id: data.razorpayOrderId,
                handler: async function (response) {
                    // Verify payment
                    const verifyRes = await fetch("http://192.168.1.14:5000/api/subscription-plans/verifyPayment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });

                    const verifyData = await verifyRes.json();

                    if (verifyData.status === "Success") {
                        Swal.fire({
                            icon: "success",
                            title: "Payment Successful",
                            text: "Your subscription is now active!",
                            timer: 2000,
                            showConfirmButton: false
                        }).then(() => {
                            setShowModal(false);
                            setName("");
                            setPhone("");
                            setEmailID("");
                            setCity("Bangalore");
                            window.location.href = "/"; // Go to homepage
                        });
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Payment Verification Failed",
                            text: "Please contact support.",
                        });
                    }
                },
                prefill: {
                    name,
                    email: emailID,
                    contact: phone,
                },
                theme: { color: "#3399cc" },
                modal: {
                    ondismiss: async () => {
                        await fetch("http://192.168.1.14:5000/api/subscription-plans/addplan", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                reason: "User cancelled the payment",
                                orderId: data.orderId || "", // optional: if your backend returns orderId
                            }),
                        });

                        Swal.fire({
                            icon: "warning",
                            title: "Payment Cancelled",
                            text: "You cancelled the payment. Try again if needed.",
                        });
                    },
                },
            };

            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();
        } catch (error) {
            console.error("Subscription Error:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Something went wrong. Please try again later.",
            });
        } finally {
            setSubLoading(false);
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


    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateEmail = (email) => {
        // Basic email validation
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    };

    const handleSubmits = async (e) => {
        e.preventDefault();

        const { name, email, subject, message } = formData;

        if (!validateEmail(email)) {
            Swal.fire("Invalid Email", "Please enter a valid email address.", "error");
            return;
        }

        try {
            const response = await fetch("http://192.168.1.14:5000/api/contact/submitcontact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, subject, message }),
            });

            if (response.ok) {
                Swal.fire("Success", "Your message has been sent.", "success");
                setFormData({ name: "", email: "", subject: "", message: "" });
            } else {
                throw new Error("Failed to send message");
            }
        } catch (error) {
            Swal.fire("Error", "Something went wrong. Please try again later.", "error");
        }
    };

    // Call Request
    const [formDataCallRequest, setFormDataCallRequest] = useState({
        name: "",
        phone: "",
        city: "Bangalore",
    });

    const handleChangeCallRequest = (e) => {
        const { name, value } = e.target;

        if (name === "phone") {
            let phone = value.replace(/\D/g, ""); // Only digits
            if (phone.startsWith("0")) {
                phone = phone.substring(1); // Remove leading 0
            }
            if (phone.length > 10) {
                phone = phone.substring(0, 10); // Limit to 10 digits
            }
            setFormDataCallRequest({ ...formDataCallRequest, [name]: phone });
        } else {
            setFormDataCallRequest({ ...formDataCallRequest, [name]: value });
        }
    };

    const handleSubmitCallRequest = async (e) => {
        e.preventDefault();

        if (formDataCallRequest.phone.length !== 10) {
            Swal.fire("Error", "Phone number must be exactly 10 digits.", "error");
            return;
        }

        try {
            const response = await fetch(
                "http://192.168.1.66:5000/api/callRequest/callRequest",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formDataCallRequest),
                }
            );

            if (response.ok) {
                Swal.fire("Success", "Your message has been sent!", "success");
                setFormDataCallRequest({ name: "", phone: "", city: "Bangalore" });
            } else {
                Swal.fire("Error", "Something went wrong. Please try again.", "error");
            }
        } catch (error) {
            Swal.fire("Error", "Server error. Please try later.", "error");
        }
    };
    return {
        productConfigs, selectedTab, usage, tenure, mainImage, handleTabChange, showModal, setShowModal, name, setName, phone, setPhone, emailID, setEmailID, city, setCity, subLoading,
        handleSubmit, activeIndex, faqs, handleToggle, formData, handleChange, handleSubmits, formDataCallRequest, handleChangeCallRequest, handleSubmitCallRequest
    };
};
export default useHome;
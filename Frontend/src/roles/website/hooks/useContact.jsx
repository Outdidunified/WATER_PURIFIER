import React from "react";
import { useState } from "react";
import Swal from 'sweetalert2';

const useContact = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const [loading, setLoading] = useState(false);

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
        setLoading(ture);

        try {
            const response = await fetch("http://192.168.1.9:5000/api/contact/submitcontact", {
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
        } finally {
            setLoading(false);
        }
    };

    return { formData, handleChange, handleSubmits, loading };
};
export default useContact;
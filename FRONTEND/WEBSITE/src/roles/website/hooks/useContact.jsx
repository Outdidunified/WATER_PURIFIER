import React from "react";
import { useState } from "react";
import Swal from 'sweetalert2';

const useContact = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;

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

        try {
            const response = await fetch(`${API_BASE_URL}/api/website/contact/submitcontact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, subject, message }),
            });

            const data = await response.json(); // 🔥 Parse server response

            if (response.ok) {
                Swal.fire("Success", data.message || "Your message has been sent.", "success");
                setFormData({ name: "", email: "", subject: "", message: "" });
            } else {
                Swal.fire("Error", data.message || "Something went wrong. Please try again.", "error");
            }
        } catch (error) {
            Swal.fire("Error", "Server error. Please try again later.", "error");
        }
    };

    // Email validation
    const sanitizeEmail = (value) => {
        // Remove spaces and keep only valid characters for an email
        const noSpaces = value.replace(/\s/g, "");
        const validChars = noSpaces.replace(/[^a-zA-Z0-9@.]/g, ""); // Allow letters, digits, @, ., _, and -

        // Convert to lowercase
        const lowerCaseEmail = validChars.toLowerCase();

        // Handle multiple @ symbols by keeping only the first part of the email
        const atIndex = lowerCaseEmail.indexOf("@");
        if (atIndex !== -1) {
            const firstPart = lowerCaseEmail.slice(0, atIndex + 1); // Include first '@'
            const domainPart = lowerCaseEmail.slice(atIndex + 1).replace(/@/g, ""); // Remove additional '@'
            const sanitizedEmail = `${firstPart}${domainPart}`;

            // Limit the email address to 50 characters
            return sanitizedEmail.slice(0, 50);
        }

        // No @ symbol: Limit to 50 characters and return
        return lowerCaseEmail.slice(0, 50);
    };

    return { formData, handleChange, handleSubmits, loading, sanitizeEmail };
};
export default useContact;
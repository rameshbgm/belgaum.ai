"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
    Cpu,
    Mail,
    Phone,
    User,
    MessageSquare,
    MapPin,
    Send,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Clock,
    Building,
    Globe
} from "lucide-react";
import Background from "@/components/Background";
import ReCAPTCHA from "react-google-recaptcha";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        description: "",
    });
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = "Full name must be at least 2 characters";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        const phoneRegex = /^[\d\s+\-()]{10,20}$/;
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!phoneRegex.test(formData.phone)) {
            newErrors.phone = "Please enter a valid phone number";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Message is required";
        } else if (formData.description.trim().length < 10) {
            newErrors.description = "Message must be at least 10 characters";
        }

        if (!captchaToken) {
            newErrors.captcha = "Please complete the captcha verification";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus({ type: null, message: "" });

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    captchaToken,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setSubmitStatus({
                    type: "success",
                    message: result.message || "Thank you! We will get back to you soon.",
                });
                setFormData({ fullName: "", email: "", phone: "", description: "" });
                setCaptchaToken(null);
                recaptchaRef.current?.reset();
            } else {
                setSubmitStatus({
                    type: "error",
                    message: result.error || "Something went wrong. Please try again.",
                });
            }
        } catch {
            setSubmitStatus({
                type: "error",
                message: "Network error. Please check your connection and try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const onCaptchaChange = (token: string | null) => {
        setCaptchaToken(token);
        if (token) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.captcha;
                return newErrors;
            });
        }
    };

    // Scroll Reveal
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("active");
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <main>
            <Background />

            <header>
                <Link href="/" className="logo">
                    <Cpu className="logo-icon" />
                    <span className="brand">Belgaum</span>
                    <span className="suffix">.ai</span>
                </Link>
            </header>

            {/* Hero Section */}
            <section className="contact-hero">
                <Link href="/" className="back-link reveal">
                    <ArrowLeft size={20} />
                    <span>Back to Home</span>
                </Link>
                <h1 className="reveal">
                    Get in <span className="gradient-text">Touch</span>
                </h1>
                <p className="hero-subtitle reveal">
                    Have a question or want to collaborate? We&apos;d love to hear from you.
                    Fill out the form below and our team will get back to you promptly.
                </p>
            </section>

            {/* Main Content */}
            <section className="contact-section">
                <div className="container contact-container">
                    {/* Contact Info Cards */}
                    <div className="contact-info-grid reveal">
                        <div className="info-card">
                            <div className="info-icon">
                                <MapPin />
                            </div>
                            <h4>Our Location</h4>
                            <p>Belgaum, Karnataka</p>
                            <p className="info-secondary">India - 590001</p>
                        </div>

                        <div className="info-card">
                            <div className="info-icon purple">
                                <Mail />
                            </div>
                            <h4>Email Us</h4>
                            <a href="mailto:ask@belgaum.ai">ask@belgaum.ai</a>
                            <p className="info-secondary">We respond within 24 hours</p>
                        </div>

                        <div className="info-card">
                            <div className="info-icon emerald">
                                <Phone />
                            </div>
                            <h4>Call Us</h4>
                            <a href="tel:+919845507313">+91 98455 07313 (IN)</a>
                            <a href="tel:+6586024972">+65 8602 4972 (SG)</a>
                        </div>

                        <div className="info-card">
                            <div className="info-icon cyan">
                                <Clock />
                            </div>
                            <h4>Business Hours</h4>
                            <p>Mon - Sat: 9:00 AM - 6:00 PM</p>
                            <p className="info-secondary">IST (GMT+5:30)</p>
                        </div>
                    </div>

                    {/* Form and Map Container */}
                    <div className="contact-main-grid">
                        {/* Contact Form */}
                        <div className="contact-form-wrapper reveal">
                            <div className="form-header">
                                <h2>
                                    Send us a <span className="gradient-text">Message</span>
                                </h2>
                                <p>Fill in the details below and we&apos;ll get back to you</p>
                            </div>

                            <form onSubmit={handleSubmit} className="contact-form">
                                {/* Full Name */}
                                <div className="form-group">
                                    <label htmlFor="fullName">
                                        <User size={18} />
                                        Full Name <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="Enter your full name"
                                        className={errors.fullName ? "input-error" : ""}
                                    />
                                    {errors.fullName && (
                                        <span className="error-message">
                                            <AlertCircle size={14} />
                                            {errors.fullName}
                                        </span>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="form-group">
                                    <label htmlFor="email">
                                        <Mail size={18} />
                                        Email Address <span className="required">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="Enter your email address"
                                        className={errors.email ? "input-error" : ""}
                                    />
                                    {errors.email && (
                                        <span className="error-message">
                                            <AlertCircle size={14} />
                                            {errors.email}
                                        </span>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="form-group">
                                    <label htmlFor="phone">
                                        <Phone size={18} />
                                        Phone Number <span className="required">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="Enter your phone number"
                                        className={errors.phone ? "input-error" : ""}
                                    />
                                    {errors.phone && (
                                        <span className="error-message">
                                            <AlertCircle size={14} />
                                            {errors.phone}
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="form-group full-width">
                                    <label htmlFor="description">
                                        <MessageSquare size={18} />
                                        Your Message <span className="required">*</span>
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Tell us about your project or inquiry..."
                                        rows={5}
                                        className={errors.description ? "input-error" : ""}
                                    />
                                    <div className="char-count">
                                        {formData.description.length} / 1000
                                    </div>
                                    {errors.description && (
                                        <span className="error-message">
                                            <AlertCircle size={14} />
                                            {errors.description}
                                        </span>
                                    )}
                                </div>

                                {/* Google ReCAPTCHA */}
                                <div className="form-group full-width captcha-container">
                                    <ReCAPTCHA
                                        ref={recaptchaRef}
                                        sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Google Test Site Key
                                        theme="dark"
                                        onChange={onCaptchaChange}
                                    />
                                    {errors.captcha && (
                                        <span className="error-message">
                                            <AlertCircle size={14} />
                                            {errors.captcha}
                                        </span>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="form-group full-width">
                                    <button
                                        type="submit"
                                        className="submit-btn"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner"></span>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={20} />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Status Message */}
                                {submitStatus.type && (
                                    <div
                                        className={`status-message ${submitStatus.type}`}
                                    >
                                        {submitStatus.type === "success" ? (
                                            <CheckCircle size={20} />
                                        ) : (
                                            <AlertCircle size={20} />
                                        )}
                                        <span>{submitStatus.message}</span>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Map Section */}
                        <div className="map-wrapper reveal">
                            <div className="map-header">
                                <h3>
                                    <MapPin size={24} />
                                    Find Us in <span className="gradient-text">Belgaum</span>
                                </h3>
                                <p>Located in the heart of Karnataka&apos;s emerging tech hub</p>
                            </div>
                            <div className="map-container">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122379.38989563916!2d74.43844893281251!3d15.85292099999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbf65f366bb3c27%3A0x6a10a43b8d50b5c8!2sBelgaum%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1704791234567!5m2!1sen!2sin"
                                    width="100%"
                                    height="100%"
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Belgaum Location Map"
                                ></iframe>
                            </div>
                            <div className="map-details">
                                <div className="map-detail-item">
                                    <Building size={18} />
                                    <span>Belgaum, Karnataka 590001</span>
                                </div>
                                <div className="map-detail-item">
                                    <Globe size={18} />
                                    <span>Sovereign AI Development Hub</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="contact-footer">
                <div className="container">
                    <div className="footer-bottom">
                        &copy; 2026 BELGAUM.AI. SYSTEM DEPLOYMENT IN PROGRESS.
                    </div>
                </div>
            </footer>
        </main>
    );
}

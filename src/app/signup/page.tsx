'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import './signup.css';

export default function Signup() {
    const [step, setStep] = useState<'signup' | 'otp'>('signup');
    const [fullName, setFullName] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);

    // Refs for OTP inputs
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleSignup = () => {
        // Validation Logic
        const isPhone = /^\d{10}$/.test(contactInfo);
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo);

        if (fullName && (isPhone || isEmail) && password.length >= 6) {
            console.log('Sending OTP to', { contactInfo });
            setStep('otp');
        } else {
            alert("Please check your inputs. Password must be 6+ chars.");
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        // Only allow numbers
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1); // Only take last char
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        // Handle Backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = () => {
        const otpValue = otp.join('');
        console.log('Verifying & Creating Account:', { otpValue, fullName, contactInfo });
        alert("Account Created Successfully!");
        // Redirect to Dashboard or Login
    };

    return (
        <main className="signup-container">
            <div className="signup-card">

                {/* Header with Back Arrow */}
                <div className="signup-header">
                    {/* Logic: If in OTP mode, back arrow goes to Signup mode. If in Signup mode, back goes Home. */}
                    {step === 'otp' ? (
                        <button className="back-button" onClick={() => setStep('signup')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                    ) : (
                        <Link href="/" className="back-button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                        </Link>
                    )}

                    <h1 className="signup-title">{step === 'otp' ? 'Verify Account' : 'Create Account'}</h1>
                </div>

                {step === 'signup' ? (
                    <>
                        {/* Inputs */}
                        <div className="input-group">
                            <label className="input-label">Full Name</label>
                            <input
                                type="text"
                                className="slick-input"
                                placeholder="e.g. Aayush Makkar"
                                maxLength={40}
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Phone Number / Email</label>
                            <input
                                type="text"
                                className="slick-input"
                                placeholder="Phone or Email Address"
                                value={contactInfo}
                                onChange={(e) => setContactInfo(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <input
                                type="password"
                                className="slick-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {/* Sign Up Button */}
                        <button className="signup-button" onClick={handleSignup}>
                            Sign Up
                        </button>

                        {/* Divider & Google */}
                        <div className="divider-container">
                            <span className="divider-text">or</span>

                            <button className="google-button">
                                {/* Simple G icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                                </svg>
                                Sign Up with Google
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '20px' }}>
                            We've sent a code to {contactInfo}
                        </p>

                        {/* OTP Inputs */}
                        <div className="otp-container">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { otpRefs.current[index] = el }}
                                    type="text"
                                    className="otp-box"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    inputMode="numeric"
                                />
                            ))}
                        </div>

                        <button className="verify-button" onClick={handleVerify}>
                            Verify & Create Account
                        </button>
                    </>
                )}

            </div>
        </main>
    );
}

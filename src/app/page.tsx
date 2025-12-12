'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import './login.css';

export default function Login() {
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState(''); // Replaces phoneNumber, can be email or phone
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Refs for OTP inputs to manage focus
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Allow unrestricted input initially (alphanumeric for email/phone mix)
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo(e.target.value);
  };

  const handleLogin = () => {
    // Validation Logic
    const isPhone = /^\d{10}$/.test(contactInfo);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo);

    if (fullName && (isPhone || isEmail)) {
      console.log('Requesting OTP for', { fullName, contactInfo, type: isPhone ? 'phone' : 'email' });
      setStep('otp');
    } else {
      alert("Please enter a valid Name and a valid Email Address or 10-digit Phone Number.");
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
    console.log('Verifying OTP:', otpValue);
    // Add verification logic here
  };

  return (
    <main className="login-container">

      {/* LEFT SIDE - BRANDING */}
      <div className="split-left">
        <div className="branding-content">
          <div className="logo-placeholder">
            {/* Custom "FI" Speed Logo */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-16 w-16" fill="none" stroke="currentColor">
              <path
                d="M 20 20 L 60 20 L 55 35 L 30 35 L 25 50 L 50 50 L 45 65 L 20 65 Z"
                fill="white"
                stroke="none"
                style={{ filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))" }}
              />
              <path
                d="M 65 20 L 80 20 L 65 80 L 50 80 Z"
                fill="white"
                stroke="none"
                style={{ filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))" }}
              />
              {/* Speed Lines */}
              <path d="M 10 30 L 0 30" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
              <path d="M 15 45 L 5 45" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
              <path d="M 10 60 L 0 60" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
              <path d="M 85 30 L 95 30" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
              <path d="M 80 70 L 90 70" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
            </svg>
          </div>
          <h1 className="brand-name">FastInn</h1>
          <p className="brand-tagline">Seamless Hotel Check-ins</p>
        </div>
      </div>

      {/* RIGHT SIDE - DYNAMIC CONTENT */}
      <div className="split-right">
        <div className="form-content">

          {step === 'login' ? (
            <>
              <div>
                <h2 className="form-title">Welcome Back</h2>
                <p className="form-subtitle">Please enter your details to continue.</p>
              </div>

              {/* Full Name Input */}
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

              {/* Contact Input (Phone or Email) */}
              <div className="input-group">
                <label className="input-label">Phone Number / Email</label>
                <input
                  type="text"
                  className="slick-input"
                  placeholder="Phone or Email Address"
                  value={contactInfo}
                  onChange={handleContactChange}
                // inputMode removed to allow full keyboard for email
                />
              </div>

              {/* Login Button */}
              <button className="login-button" onClick={handleLogin}>
                Login to FastInn
              </button>

              {/* Login With Google Button */}
              <button className="google-button">
                {/* Simple G icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                Login With Google
              </button>

              {/* Sign Up Link */}
              <div className="signup-text">
                Not a user? <Link href="/signup" className="signup-link">Sign Up!</Link>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="form-title">Enter Verification Code</h2>
                <p className="form-subtitle">We've sent a code to {contactInfo}</p>
              </div>

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

              {/* Verify Button */}
              <button className="verify-button" onClick={handleVerify}>
                Verify & Login
              </button>

              {/* Back Link */}
              <div className="signup-text">
                <span className="signup-link" onClick={() => setStep('login')}>Back to Login</span>
              </div>
            </>
          )}

        </div>
      </div>

    </main>
  );
}

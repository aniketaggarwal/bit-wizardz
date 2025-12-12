'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import './login.css';


export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo(e.target.value);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) alert(error.message);
  };

  const handleLogin = async () => {
    const isPhone = /^\d{10}$/.test(contactInfo);
    // Allow standard email regex
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo);

    if (fullName && (isPhone || isEmail)) {
      setLoading(true);
      if (isPhone) {
        // Phone OTP
        const { error } = await supabase.auth.signInWithOtp({
          phone: `+91${contactInfo}`,
        });
        if (error) alert(error.message);
        else setStep('otp');
      } else {
        // Email + Password Login
        // Note: For this flow to work well, we need a password input field which is currently missing in the UI
        // I will add a prompt for password if not present, or assumed strictly 'login' means we have credentials.
        // Wait, the UI doesn't have a password field yet in this merged version (it was name + email).
        // I need to add a password input state and field first.

        if (!password) {
          alert("Please enter your password.");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: contactInfo,
          password: password,
        });

        if (error) {
          console.error(error);
          // Check if user doesn't exist or invalid credentials
          if (error.message.includes("Invalid login credentials")) {
            // Could be wrong password OR user doesn't exist. 
            // Security wise it's better not to distinguish, but user asked for redirect.
            // We'll trust the user wants to sign up if login fails.
            alert("Login failed. Redirecting to Sign Up.");
            router.push("/signup");
          } else {
            alert(error.message);
          }
        } else {
          router.push("/dashboard");
        }
      }
      setLoading(false);
    } else {
      alert("Please enter a valid Name and Contact Info.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    setLoading(true);
    // Assuming Phone OTP for verification step as email magic link redirects automatically
    // But if user used email, they wouldn't be on this step usually unless we did Email OTP (Supabase supports magic link by default)
    // For MVP, assuming if they are on OTP step, it was phone.

    const { error } = await supabase.auth.verifyOtp({
      phone: `+91${contactInfo}`,
      token: otpValue,
      type: 'sms',
    });

    if (error) {
      alert(error.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
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
                />
              </div>

              {/* Password Input (Only show if not phone, or just always show but optional for phone?) 
                User said "when someone logs in with email, ask password".
            */}
              <div className="input-group">
                <label className="input-label">Password (for Email)</label>
                <input
                  type="password"
                  className="slick-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Login Button */}
              <button className="login-button" onClick={handleLogin}>
                Login to FastInn
              </button>

              {/* Login With Google Button */}
              <button className="google-button" onClick={handleGoogleLogin}>
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

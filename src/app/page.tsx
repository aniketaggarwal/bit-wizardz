'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './login.css';

export default function Login() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Validation Logic
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (fullName && isEmail && password) {
      if (password === '123456') {
        console.log('Login Successful');
        router.push('/dashboard');
      } else {
        alert("Incorrect Password. Try '123456'.");
      }
    } else {
      alert("Please enter a valid Name, Email, and Password.");
    }
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

      {/* RIGHT SIDE - FORM */}
      <div className="split-right">
        <div className="form-content">

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

          {/* Email Input */}
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="slick-input"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password Input */}
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

        </div>
      </div>

    </main>
  );
}

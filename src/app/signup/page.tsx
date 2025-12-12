'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './signup.css';

export default function Signup() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState(''); // Only Email now
    const [password, setPassword] = useState('');

    const handleSignup = () => {
        // Validation Logic
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (fullName && isEmail && password.length >= 6) {
            console.log('Signing Up', { fullName, email, password });
            // Redirect to P1SU (Page 1 Sign Up)
            router.push(`/p1su?name=${encodeURIComponent(fullName)}`);
        } else {
            alert("Please enter a valid Name, Email, and Password (6+ chars).");
        }
    };

    return (
        <main className="signup-container">
            <div className="signup-card">

                {/* Header with Back Arrow */}
                <div className="signup-header">
                    <Link href="/" className="back-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </Link>
                    <h1 className="signup-title">Create Account</h1>
                </div>

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
                    <label className="input-label">Email Address</label>
                    <input
                        type="email"
                        className="slick-input"
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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

            </div>
        </main>
    );
}

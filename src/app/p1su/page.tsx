'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import '../signup/signup.css';

export default function P1SU() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Form State
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [aadhaar, setAadhaar] = useState('');

    // Phone Authentication State
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initial Load & Auth Check
    useEffect(() => {
        const nameParam = searchParams.get('name');
        if (nameParam) setName(nameParam);

        const checkProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // If user already has a valid profile (checked by ID presence), redirect
                const { data } = await supabase.from('users').select('id_last4').eq('id', user.id).single();
                if (data?.id_last4) router.replace('/menu');

                // Pre-fill phone if available from Google Auth
                if (user.phone) {
                    setPhone(user.phone.replace('+91', ''));
                    setPhoneVerified(true);
                }
            }
        };
        checkProfile();
    }, [searchParams, router]);

    // Handlers
    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) return alert('Enter valid mobile number');
        setLoading(true);
        try {
            const res = await fetch('/api/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send', phone: `+91${phone}` })
            });
            const data = await res.json();
            if (data.success) {
                setOtpSent(true);
                alert(`OTP Sent to +91 ${phone}`);
            } else {
                throw new Error(data.error);
            }
        } catch (e: any) {
            alert(e.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) return alert('Enter OTP');
        setLoading(true);
        try {
            const res = await fetch('/api/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', phone: `+91${phone}`, token: otp })
            });
            const data = await res.json();
            if (data.success) {
                setPhoneVerified(true);
                alert('Phone Verified Successfully!');
            } else {
                throw new Error(data.error);
            }
        } catch (e: any) {
            alert(e.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = async () => {
        if (!name || !dob || !aadhaar) return alert('Please fill all details');
        if (!phoneVerified) return alert('Please verify phone number first');

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user found');

            const { error } = await supabase.from('users').upsert({
                id: user.id,
                name,
                email: user.email,
                dob,
                id_last4: aadhaar.slice(-4), // Storing last 4 for reference
                phone: `+91${phone}`,
                updated_at: new Date().toISOString()
            });

            if (error) throw error;
            router.push('/upload-id');

        } catch (e: any) {
            console.error(e);
            alert('Failed to save profile: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="signup-container">
            <div className="signup-card animate-fadeIn">
                <div className="signup-header">
                    <button onClick={() => router.back()} className="back-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <h1 className="signup-title">Setup Profile</h1>
                </div>

                {/* Name */}
                <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <input
                        className="slick-input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. John Doe"
                    />
                </div>

                {/* DOB & Aadhaar */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="input-group">
                        <label className="input-label">Date of Birth</label>
                        <input
                            type="date"
                            className="slick-input"
                            value={dob}
                            onChange={e => setDob(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Aadhaar No.</label>
                        <input
                            type="text"
                            className="slick-input"
                            value={aadhaar}
                            onChange={e => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                            placeholder="12-digit UID"
                        />
                    </div>
                </div>

                {/* Phone Section */}
                <div className="input-group">
                    <label className="input-label">Mobile Number {phoneVerified && '✅'}</label>
                    <div className="flex gap-2">
                        <input
                            type="tel"
                            className="slick-input flex-1"
                            value={phone}
                            onChange={e => {
                                if (!phoneVerified) setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                            }}
                            placeholder="9876543210"
                            disabled={phoneVerified || otpSent}
                        />
                        {!phoneVerified && !otpSent && (
                            <button
                                onClick={handleSendOtp}
                                disabled={phone.length < 10 || loading}
                                className="px-3 bg-blue-600/20 text-blue-300 border border-blue-500/50 rounded hover:bg-blue-600/40 transition-colors text-sm font-bold"
                            >
                                {loading ? '...' : 'Send OTP'}
                            </button>
                        )}
                    </div>
                </div>

                {/* OTP Input */}
                {otpSent && !phoneVerified && (
                    <div className="input-group animate-slideUp">
                        <label className="input-label">Enter OTP</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="slick-input flex-1 text-center tracking-[0.5em] font-mono text-lg"
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="------"
                            />
                            <button
                                onClick={handleVerifyOtp}
                                disabled={otp.length < 6 || loading}
                                className="px-4 bg-green-600/20 text-green-300 border border-green-500/50 rounded hover:bg-green-600/40 transition-colors text-sm font-bold"
                            >
                                {loading ? '...' : 'Verify'}
                            </button>
                        </div>
                        <button onClick={() => setOtpSent(false)} className="text-xs text-blue-400 mt-2 hover:underline">Change Number</button>
                    </div>
                )}

                {/* Continue */}
                <button
                    onClick={handleContinue}
                    disabled={!phoneVerified || loading}
                    className="signup-button mt-4"
                    style={{ opacity: phoneVerified ? 1 : 0.5, cursor: phoneVerified ? 'pointer' : 'not-allowed' }}
                >
                    {loading ? 'Processing...' : 'Continue'}
                </button>
            </div>
        </main>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import '../signup/signup.css'; // Reusing styling from Signup

export default function P1SU() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [aadhaarLast4, setAadhaarLast4] = useState('');

    // Phone & OTP State
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [isPhoneValid, setIsPhoneValid] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const nameParam = searchParams.get('name');
        if (nameParam) {
            setName(nameParam);
        }

        // Check if already verified
        const checkExistingProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('id_last4')
                    .eq('id', user.id)
                    .single();

                if (profile?.id_last4) {
                    router.replace('/menu'); // Redirect if already setup
                }
            }
        };
        checkExistingProfile();
    }, [searchParams, router]);

    const handleSendOtp = async () => {
        if (!isPhoneValid) return;
        setIsLoading(true);
        try {
            // Using updateUser triggers a 'phone_change' OTP for logged-in users
            const { error } = await supabase.auth.updateUser({ phone: `+91${phone}` });
            if (error) throw error;

            setOtpSent(true);
            alert('OTP sent to +91 ' + phone);
        } catch (error: any) {
            console.error('Error sending OTP:', error);
            alert(error.message || 'Failed to send OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) return;
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                phone: `+91${phone}`,
                token: otp,
                type: 'phone_change'
            });
            if (error) throw error;

            setIsPhoneVerified(true);
            alert('Phone Number Verified Successfully! ✅');
        } catch (error: any) {
            console.error('Error verifying OTP:', error);
            alert(error.message || 'Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinue = async () => {
        if (dob && aadhaarLast4.length === 4 && isPhoneVerified) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { error } = await supabase.from('users').upsert({
                        id: user.id,
                        name: name,
                        email: user.email, // Save Email from Auth
                        id_last4: aadhaarLast4,
                        dob: dob,
                        phone: user.phone || `+91${phone}`, // Use verified phone from Auth or state
                        updated_at: new Date().toISOString()
                    });
                    if (error) throw error;
                }
                router.push('/upload-id');
            } catch (error) {
                console.error('Error saving profile:', error);
                alert('Failed to save details. Please try again.');
            }
        } else {
            alert("Please verify your Phone Number and fill all details.");
        }
    };

    const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^\d*$/.test(val) && val.length <= 4) {
            setAadhaarLast4(val);
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isPhoneVerified) return; // Lock if already verified
        const val = e.target.value.replace(/\D/g, '');
        if (val.length <= 10) {
            setPhone(val);
            setIsPhoneValid(val.length === 10);
            setOtpSent(false); // Reset if number changes
        }
    };

    return (
        <main className="signup-container">
            <div className="signup-card">

                {/* Header */}
                <div className="signup-header">
                    <button className="back-button" onClick={() => router.back()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <h1 className="signup-title">Enter Details</h1>
                </div>

                {/* Name (Editable) */}
                <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <input
                        type="text"
                        className="slick-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. John Doe"
                    />
                </div>

                {/* DOB */}
                <div className="input-group">
                    <label className="input-label">Date of Birth</label>
                    <input
                        type="date"
                        className="slick-input"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                    />
                </div>

                {/* Aadhaar Last 4 */}
                <div className="input-group">
                    <label className="input-label">Aadhaar (Last 4 Digits)</label>
                    <input
                        type="password"
                        className="slick-input"
                        placeholder="XXXX"
                        maxLength={4}
                        value={aadhaarLast4}
                        onChange={handleAadhaarChange}
                        inputMode="numeric"
                        style={{ letterSpacing: '4px' }}
                    />
                </div>

                {/* Phone Number */}
                <div className="input-group">
                    <label className="input-label">Phone Number {isPhoneVerified && '✅'}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ padding: '12px', background: '#e2e8f0', borderRadius: '8px', color: '#64748b' }}>+91</span>
                        <input
                            type="tel"
                            className="slick-input"
                            placeholder="9876543210"
                            maxLength={10}
                            value={phone}
                            onChange={handlePhoneChange}
                            inputMode="numeric"
                            disabled={isPhoneVerified}
                            style={{ flex: 1, backgroundColor: isPhoneVerified ? '#f0fdf4' : 'white' }}
                        />
                    </div>
                </div>

                {/* Send OTP Button */}
                {isPhoneValid && !otpSent && !isPhoneVerified && (
                    <button
                        className="signup-button"
                        onClick={handleSendOtp}
                        disabled={isLoading}
                        style={{ backgroundColor: '#3b82f6', marginTop: '0px', marginBottom: '16px' }}
                    >
                        {isLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                )}

                {/* OTP Input & Verify */}
                {otpSent && !isPhoneVerified && (
                    <div className="input-group animate-fade-in" style={{ marginTop: '0' }}>
                        <label className="input-label">Enter OTP</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                className="slick-input"
                                placeholder="123456"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                inputMode="numeric"
                                style={{ letterSpacing: '4px', textAlign: 'center' }}
                            />
                            <button
                                onClick={handleVerifyOtp}
                                disabled={otp.length !== 6 || isLoading}
                                style={{
                                    padding: '0 20px',
                                    borderRadius: '8px',
                                    backgroundColor: otp.length === 6 ? '#22c55e' : '#cbd5e1',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    cursor: otp.length === 6 ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {isLoading ? '...' : 'Verify'}
                            </button>
                        </div>
                        <p className="text-xs text-blue-400 mt-1 cursor-pointer" onClick={() => setOtpSent(false)}>
                            Change Number?
                        </p>
                    </div>
                )}

                {/* Continue Button */}
                <button className="signup-button" onClick={handleContinue}>
                    Continue
                </button>

            </div>
        </main>
    );
}

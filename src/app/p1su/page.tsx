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

    useEffect(() => {
        const nameParam = searchParams.get('name');
        if (nameParam) {
            setName(nameParam);
        }
    }, [searchParams]);

    const handleContinue = async () => {
        if (dob && aadhaarLast4.length === 4) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('profiles').upsert({
                        id: user.id,
                        full_name: name,
                        aadhaar_last4: aadhaarLast4,
                        phone: user.phone || '', // Capture phone if available
                        last_active: new Date().toISOString()
                    });
                }
                router.push('/upload-id');
            } catch (error) {
                console.error('Error saving profile:', error);
                alert('Failed to save details. Please try again.');
            }
        } else {
            alert("Please enter a valid DOB and the last 4 digits of your Aadhaar.");
        }
    };

    const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^\d*$/.test(val) && val.length <= 4) {
            setAadhaarLast4(val);
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

                {/* Name (Read-Only) */}
                <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <input
                        type="text"
                        className="slick-input"
                        value={name}
                        readOnly
                        style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
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

                {/* Continue Button */}
                <button className="signup-button" onClick={handleContinue}>
                    Continue
                </button>

            </div>
        </main>
    );
}

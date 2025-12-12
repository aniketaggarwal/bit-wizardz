'use client';

import { useState, useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import '../login.css';

import Image from 'next/image';

export default function MenuPage() {
    const router = useRouter();

    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileCloseTimeout = useRef<any>(null);
    const profileWrapperRef = useRef<HTMLDivElement | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const [userName, setUserName] = useState<string>('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
                if (data?.full_name) setUserName(data.full_name);
            }
        }
        fetchProfile();
        // mark mounted after client-side render to avoid hydration mismatch
        setMounted(true);
    }, []);

    return (
        <main
            className="min-h-screen relative"
            style={{
                background: "linear-gradient(rgba(0,20,40,0.68), rgba(0,17,36,0.68)), url('/city-life.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: '#e6eef8',
                overflow: 'hidden',
                backgroundRepeat: 'no-repeat'
            }}
        >

            {/* Header bar */}
            <header className="top-header">
                <div style={{ width: 120 }}></div>
                <div className="header-brand">FastInn</div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <button className="header-cta" onClick={() => router.push('/how-to')}>How To Use?</button>
                </div>
                <div style={{ width: 120, display: 'flex', justifyContent: 'flex-end', paddingRight: 24 }}>
                    <div
                        className="profile-avatar-wrapper"
                        ref={(el) => (profileWrapperRef.current = el)}
                        onMouseEnter={() => {
                            if (profileCloseTimeout.current) {
                                clearTimeout(profileCloseTimeout.current);
                                profileCloseTimeout.current = null;
                            }
                            setProfileMenuOpen(true);
                        }}
                        onMouseLeave={() => {
                            profileCloseTimeout.current = setTimeout(() => setProfileMenuOpen(false), 220);
                        }}
                    >
                        <div className="profile-avatar" role="img" aria-label="user avatar">
                            <div className="avatar-letter">{(userName && userName.charAt(0).toUpperCase()) || 'U'}</div>
                        </div>
                        {profileMenuOpen && (
                            <div
                                className="profile-popup"
                                onMouseEnter={() => {
                                    if (profileCloseTimeout.current) {
                                        clearTimeout(profileCloseTimeout.current);
                                        profileCloseTimeout.current = null;
                                    }
                                    setProfileMenuOpen(true);
                                }}
                                onMouseLeave={() => {
                                    profileCloseTimeout.current = setTimeout(() => setProfileMenuOpen(false), 220);
                                }}
                            >
                                <button className="profile-popup-item" onClick={() => { router.push('/profile'); setProfileMenuOpen(false); }}>Visit Profile</button>
                                <button className="profile-popup-item" onClick={() => { router.push('/how-to'); setProfileMenuOpen(false); }}>How To Use?</button>
                                <button className="profile-popup-item profile-logout-inline" onClick={() => { setShowLogoutConfirm(true); setProfileMenuOpen(false); }}>Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Decorative background icons integrated into the page graphic (large, faded, absolute) */}
            <img src="/file.svg" alt="icon" style={{ position: 'absolute', left: 40, top: 80, width: 180, opacity: 0.08, transform: 'rotate(-8deg)' }} />
            <img src="/globe.svg" alt="icon" style={{ position: 'absolute', right: 60, top: 140, width: 220, opacity: 0.06, transform: 'rotate(6deg)' }} />
            <img src="/window.svg" alt="icon" style={{ position: 'absolute', left: 60, bottom: 120, width: 200, opacity: 0.06, transform: 'rotate(4deg)' }} />
            <img src="/webcam-overlay-new.jpg" alt="overlay" style={{ position: 'absolute', right: 80, bottom: 60, width: 300, opacity: 0.04 }} />

            {/* Top Corner Name */}
            {mounted && userName && (
                null
            )}

            {/* Logout confirmation modal */}
            {showLogoutConfirm && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h2 style={{ color: '#dc2626', fontSize: 20, marginBottom: 12 }}>Logging Out?</h2>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button className="modal-btn" onClick={async () => {
                                setShowLogoutConfirm(false);
                                const { error } = await supabase.from('profiles').update({ active_device_id: null }).eq('id', (await supabase.auth.getUser()).data.user?.id);
                                await supabase.auth.signOut();
                                router.push('/');
                            }} style={{ color: '#dc2626' }}>Yes</button>
                            <button className="modal-btn" onClick={() => setShowLogoutConfirm(false)} style={{ color: '#16a34a' }}>No</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main content: no popup card — buttons sit directly on background with login-button styling */}
            <div className="w-full flex items-center justify-center" style={{ padding: '6rem 1rem' }}>
                <div style={{ width: '100%', maxWidth: 1100 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <div>
                            {mounted ? (
                                <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0 }}>{`${(userName && userName.split(' ')[0]) || 'User'}'s Menu`}</h1>
                            ) : (
                                <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0 }}>User Menu</h1>
                            )}
                        </div>
                    </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button onClick={() => router.push('/upload-id')} className="login-button menu-button" style={{ textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center', background: 'linear-gradient(90deg,#fff1f2,#f0f9ff)', color: '#081028', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: 32 }}>📄</div>
                                    <div>
                                        <div style={{ fontSize: 18, fontWeight: 700 }}>Re-Verify ID</div>
                                        <div style={{ fontSize: 13, color: '#475569' }}>Manage ID</div>
                                    </div>
                                </button>

                                <button onClick={() => router.push('/register-face')} className="login-button menu-button" style={{ textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center', background: 'linear-gradient(90deg,#fff7ed,#eef2ff)', color: '#081028', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: 32 }}>👤</div>
                                    <div>
                                        <div style={{ fontSize: 18, fontWeight: 700 }}>Re-Scan Face</div>
                                        <div style={{ fontSize: 13, color: '#475569' }}>Manage Biometrics</div>
                                    </div>
                                </button>

                                <button onClick={() => router.push('/checkin')} className="login-button menu-button" style={{ textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center', background: 'linear-gradient(90deg,#fff7f0,#f0fff4)', color: '#081028', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: 32 }}>🏨</div>
                                    <div>
                                        <div style={{ fontSize: 18, fontWeight: 700 }}>Self Check-in</div>
                                        <div style={{ fontSize: 13, color: '#475569' }}>Guest Kiosk Mode</div>
                                    </div>
                                </button>

                                <button onClick={() => router.push('/profile')} className="login-button menu-button" style={{ textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center', background: 'linear-gradient(90deg,#f8fbff,#fff6fb)', color: '#081028', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: 32 }}>🆔</div>
                                    <div>
                                        <div style={{ fontSize: 18, fontWeight: 700 }}>Your Profile</div>
                                        <div style={{ fontSize: 13, color: '#475569' }}>View Account Details</div>
                                    </div>
                                </button>
                            </div>

                    {/* footer logout removed; logout only available in profile dropdown */}
                </div>
            </div>

        </main>
    );
}

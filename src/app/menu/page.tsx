'use client';

import { useState, useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import '../login.css';

import Image from 'next/image';

import ProfileDropdown from '@/components/ProfileDropdown';

import { enforceDeviceLock } from '@/lib/device';

export default function MenuPage() {
    const router = useRouter();
    // Removed inline profile state
    const [userName, setUserName] = useState<string>('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // 1. Enforce Device Lock
                const allowed = await enforceDeviceLock(user.id);
                if (!allowed) {
                    router.replace('/device-mismatch');
                    return;
                }

                // 2. Fetch Profile
                const { data } = await supabase.from('users').select('name').eq('id', user.id).single();
                if (data?.name) setUserName(data.name);
            }
        }
        init();
        setMounted(true);
    }, [router]);

    return (
        <main
            className="min-h-screen relative"
            style={{
                minHeight: '100vh',
                background: 'var(--bg-color)',
                color: 'var(--text-color)',
                fontFamily: 'var(--font-family)',
                // Cosmic City Overlay
                backgroundImage: `linear-gradient(rgba(20, 0, 50, 0.85), rgba(60, 10, 100, 0.8)), url('/city-life.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <header className="top-header">
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <div className="header-brand">FastInn</div>
                </div>
                <div style={{ flex: 1 }}></div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <ProfileDropdown />
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

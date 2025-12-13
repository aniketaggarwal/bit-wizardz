'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ProfileDropdown from '@/components/ProfileDropdown';
import '../login.css';

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/');
                return;
            }

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile({ ...data, email: user.email });
            }
            setLoading(false);
        }
        fetchProfile();
    }, [router]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-white font-mono" style={{ background: 'var(--bg-color)' }}>
            Loading Profile...
        </div>
    );

    return (
        <div
            className="min-h-screen text-white p-8 flex flex-col items-center"
            style={{
                background: 'var(--bg-color)',
                color: 'var(--text-color)',
                fontFamily: 'var(--font-family)',
                // Cosmic City Overlay
                backgroundImage: `linear-gradient(rgba(20, 0, 50, 0.85), rgba(60, 10, 100, 0.8)), url('/city-life.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >

            {/* Header */}
            <div className="w-full max-w-md flex items-center justify-between mb-8 relative">
                <Link href="/menu" className="p-2 rounded-full transition-colors flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--primary-color)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </Link>
                <h1 className="text-xl font-bold text-center" style={{ fontFamily: 'var(--font-brand)', color: 'var(--secondary-color)', fontSize: '1.5rem' }}>Your Profile</h1>
                <ProfileDropdown />
            </div>

            {/* Profile Card */}
            <div
                className="w-full max-w-md rounded-2xl p-8 relative overflow-hidden shadow-2xl"
                style={{
                    background: 'rgba(20, 0, 50, 0.6)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(138, 43, 226, 0.3)'
                }}
            >
                <div className="absolute top-0 right-0 p-4 opacity-10" style={{ color: 'var(--primary-color)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                </div>

                <div className="flex flex-col gap-6 relative z-10">

                    {/* Name */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest mb-1 block" style={{ color: 'var(--primary-color)' }}>Full Name</label>
                        <p className="text-2xl font-bold text-white capitalize">{profile?.name || 'User'}</p>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest mb-1 block" style={{ color: 'var(--primary-color)', opacity: 0.8 }}>Email</label>
                            <p className="text-lg text-gray-300 font-mono">{profile?.email}</p>
                        </div>
                        {profile?.phone && (
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest mb-1 block" style={{ color: 'var(--primary-color)', opacity: 0.8 }}>Phone</label>
                                <p className="text-lg text-gray-300 font-mono">{profile.phone}</p>
                            </div>
                        )}
                    </div>

                    {/* ID Details */}
                    <div className="p-4 rounded-xl border" style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.1)' }}>
                        <label className="text-xs font-bold uppercase tracking-widest mb-2 block flex items-center gap-2" style={{ color: 'var(--secondary-color)' }}>
                            <span>🔒</span> Identity Verified
                        </label>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-gray-500">Aadhaar Linked</p>
                                <p className="text-xl font-mono text-white tracking-widest">
                                    •••• •••• {profile?.id_last4 || 'XXXX'}
                                </p>
                            </div>
                            <div className="px-2 py-1 rounded text-xs font-bold" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}>
                                ACTIVE
                            </div>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="pt-4 border-t text-xs text-gray-400 font-mono" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        User ID: {profile?.id}<br />
                        Last Active: {new Date(profile?.last_active).toLocaleString()}
                    </div>

                </div>
            </div>

            {/* Logout button under profile card */}
            <div style={{ width: '100%', maxWidth: 640, marginTop: 18 }}>
                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    style={{
                        background: 'rgba(220, 38, 38, 0.15)',
                        color: '#ef4444',
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: '1px solid rgba(220, 38, 38, 0.4)',
                        fontWeight: 700,
                        width: '100%'
                    }}
                >
                    Logout
                </button>
            </div>

            {/* Styled logout modal (centered) */}
            {showLogoutConfirm && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h2 style={{ color: '#ef4444' }}>Logging Out?</h2>
                        <p>You're about to sign out of your account. This will remove your active session.</p>
                        <div className="modal-actions">
                            <button className="modal-btn modal-btn--yes" onClick={async () => {
                                setShowLogoutConfirm(false);
                                await supabase.from('users').update({ active_device_id: null }).eq('id', (await supabase.auth.getUser()).data.user?.id);
                                await supabase.auth.signOut();
                                router.push('/');
                            }}>Yes</button>
                            <button className="modal-btn modal-btn--no" onClick={() => setShowLogoutConfirm(false)}>No</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

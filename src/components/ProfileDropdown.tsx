'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

import { unlockDevice } from '@/lib/device';

export default function ProfileDropdown() {
    const router = useRouter();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileCloseTimeout = useRef<any>(null);
    const profileWrapperRef = useRef<HTMLDivElement | null>(null);
    const [userName, setUserName] = useState<string>('');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Try 'users' table first (aligned schema)
                const { data } = await supabase.from('users').select('name').eq('id', user.id).single();
                if (data?.name) {
                    setUserName(data.name);
                } else {
                    // Fallback to metadata
                    setUserName(user.user_metadata?.name || 'User');
                }
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await unlockDevice(user.id);
        }
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <>
            <div
                className="profile-avatar-wrapper"
                ref={(el) => { profileWrapperRef.current = el; }}
                onMouseEnter={() => {
                    if (profileCloseTimeout.current) {
                        clearTimeout(profileCloseTimeout.current);
                        profileCloseTimeout.current = null;
                    }
                    setProfileMenuOpen(true);
                }}
                onMouseLeave={() => {
                    // Delay closing to allow moving mouse to popup
                    profileCloseTimeout.current = setTimeout(() => setProfileMenuOpen(false), 220);
                }}
                style={{ position: 'relative', cursor: 'pointer' }}
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

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="modal-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', minWidth: '300px', color: 'black' }}>
                        <h2 style={{ color: '#dc2626', fontSize: 20, marginBottom: 16, fontWeight: 'bold' }}>Logging Out?</h2>
                        <p style={{ marginBottom: 20, color: '#4b5563' }}>Are you sure you want to sign out?</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button className="modal-btn" onClick={() => setShowLogoutConfirm(false)} style={{ color: '#4b5563', padding: '8px 16px', fontWeight: 600 }}>Cancel</button>
                            <button className="modal-btn" onClick={handleLogout} style={{ color: '#dc2626', padding: '8px 16px', fontWeight: 600 }}>Yes, Logout</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

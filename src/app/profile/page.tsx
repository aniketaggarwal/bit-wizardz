'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

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

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Profile...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center">

            {/* Header */}
            <div className="w-full max-w-md flex items-center mb-8 relative">
                <Link href="/menu" className="absolute left-0 p-2 bg-gray-900 rounded-full hover:bg-gray-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </Link>
                <h1 className="text-xl font-bold w-full text-center">Your Profile</h1>
            </div>

            {/* Profile Card */}
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                </div>

                <div className="flex flex-col gap-6 relative z-10">

                    {/* Name */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Full Name</label>
                        <p className="text-2xl font-bold text-white capitalize">{profile?.name || 'User'}</p>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Email</label>
                            <p className="text-lg text-gray-300 font-mono">{profile?.email}</p>
                        </div>
                        {profile?.phone && (
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Phone</label>
                                <p className="text-lg text-gray-300 font-mono">{profile.phone}</p>
                            </div>
                        )}
                    </div>

                    {/* ID Details */}
                    <div className="p-4 bg-black/40 rounded-xl border border-gray-800">
                        <label className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                            <span>🔒</span> Identity Verified
                        </label>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-gray-500">Aadhaar Linked</p>
                                <p className="text-xl font-mono text-white tracking-widest">
                                    •••• •••• {profile?.id_last4 || 'XXXX'}
                                </p>
                            </div>
                            <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold">
                                ACTIVE
                            </div>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="pt-4 border-t border-gray-800 text-xs text-gray-600 font-mono">
                        User ID: {profile?.id}<br />
                        Last Active: {new Date(profile?.last_active).toLocaleString()}
                    </div>

                </div>
            </div>

        </div>
    );
}

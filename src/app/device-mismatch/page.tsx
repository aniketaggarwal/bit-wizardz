'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import '../globals.css';

export default function DeviceMismatchPage() {
    const router = useRouter();

    const handleLogout = async () => {
        // Clearing session here is just local
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
            style={{
                background: 'var(--bg-color)',
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(138, 43, 226, 0.2) 0%, transparent 60%)`,
                color: 'var(--text-color)'
            }}>

            <div className="glass-panel p-8 max-w-md w-full border border-red-500/30">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-2xl font-bold mb-2 text-red-400">Access Restricted</h1>
                <p className="text-gray-300 mb-6">
                    This account is currently active on another device.
                    <br /><br />
                    To continue usage here, please ensure you have logged out from the other device.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleLogout}
                        className="w-full py-3 rounded-lg font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
                    >
                        Force Logout (Local)
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 rounded-lg font-bold bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        Retry Check
                    </button>
                </div>
            </div>
        </div>
    );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BackButton from '@/components/BackButton';

export default function MenuPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center relative">
            <h1 className="text-3xl font-bold mb-2 mt-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Bit Wizardz
            </h1>
            <p className="text-gray-400 mb-12">Main Menu</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">

                {/* 1. Upload ID (Retry/Update) */}
                <Link href="/upload-id" className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-blue-500 transition-all group">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📄</div>
                    <h2 className="text-xl font-bold mb-1">Verify ID</h2>
                    <p className="text-sm text-gray-500">Scan Aadhaar Card</p>
                </Link>

                {/* 2. Register Face */}
                <Link href="/register-face" className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-purple-500 transition-all group">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">👤</div>
                    <h2 className="text-xl font-bold mb-1">Face ID</h2>
                    <p className="text-sm text-gray-500">Manage Biometrics</p>
                </Link>

                {/* 3. Check-in (Kiosk) */}
                <Link href="/checkin" className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-green-500 transition-all group">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏨</div>
                    <h2 className="text-xl font-bold mb-1">Self Check-in</h2>
                    <p className="text-sm text-gray-500">Guest Kiosk Mode</p>
                </Link>

                {/* 4. Admin Dashboard */}
                <Link href="/dashboard" className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-orange-500 transition-all group">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🛠️</div>
                    <h2 className="text-xl font-bold mb-1">Admin Dashboard</h2>
                    <p className="text-sm text-gray-500">Session Manager & Logs</p>
                </Link>
            </div>

            <footer className="mt-auto py-8">
                <button
                    onClick={async () => {
                        const { error } = await supabase.from('profiles').update({ active_device_id: null }).eq('id', (await supabase.auth.getUser()).data.user?.id);
                        await supabase.auth.signOut();
                        router.push('/');
                    }}
                    className="text-red-500 hover:text-red-400 underline text-sm"
                >
                    Logout
                </button>
            </footer>
        </div>
    );
}

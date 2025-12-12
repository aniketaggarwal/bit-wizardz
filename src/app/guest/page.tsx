'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GuestPage() {
    const router = useRouter();
    const [guestName, setGuestName] = useState('');
    const [roomNo, setRoomNo] = useState('');
    const [sessionId, setSessionId] = useState('');

    useEffect(() => {
        // Load Guest Session
        const name = localStorage.getItem('guest_name');
        const room = localStorage.getItem('guest_room');
        const session = localStorage.getItem('guest_session');

        if (!name || !room || !session) {
            // alert('No active guest session found.'); // Can be annoying on refresh
            router.push('/');
            return;
        }

        setGuestName(name);
        setRoomNo(room);
        setSessionId(session);

        // POLL for status (Auto-Logout if Admin checks out)
        const checkStatus = async () => {
            try {
                // Dynamic import to avoid SSR issues if any, though we are client side
                const { supabase } = await import('@/lib/supabase');

                const { data, error } = await supabase
                    .from('checkins')
                    .select('status')
                    .eq('session_id', session)
                    .single();

                if (data && data.status === 'checked_out') {
                    // Admin checked us out!
                    localStorage.removeItem('guest_name');
                    localStorage.removeItem('guest_room');
                    localStorage.removeItem('guest_session');
                    alert('You have been checked out by the Front Desk.');
                    router.push('/');
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        };

        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);

    }, [router]);

    const handleCheckout = async () => {
        if (!confirm('Are you sure you want to checkout? This will clear your room.')) return;

        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_no: roomNo })
            });

            if (res.ok) {
                // Clear Session
                localStorage.removeItem('guest_name');
                localStorage.removeItem('guest_room');
                localStorage.removeItem('guest_session');

                alert('Checked out successfully!');
                router.push('/');
            } else {
                const data = await res.json();
                alert('Checkout failed: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert('Network error during checkout');
        }
    };

    if (!guestName) return <div className="p-8 text-center text-gray-500">Loading your room...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm text-center border-t-8 border-blue-600">
                <div className="mb-6">
                    <p className="text-gray-500 uppercase tracking-widest text-xs font-bold mb-2">Welcome Guest</p>
                    <h1 className="text-2xl font-bold text-gray-800">{guestName}</h1>
                </div>

                <div className="py-8 bg-blue-50 rounded-lg border border-blue-100 mb-8">
                    <p className="text-blue-600 uppercase font-bold text-sm mb-1">Your Room</p>
                    <p className="text-6xl font-black text-blue-900">{roomNo}</p>
                </div>

                <div className="text-xs text-center text-gray-400 font-mono mb-8">
                    Session: {sessionId}
                </div>

                <button
                    onClick={handleCheckout}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                >
                    <span className="text-xl">👋</span> Checkout Now
                </button>
            </div>

            <p className="mt-8 text-gray-400 text-sm">Have a pleasant stay!</p>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import BackButton from '@/components/BackButton';
import AuthKeyManager from '@/components/AuthKeyManager';
import { getSessionQrUrl, monitorCheckinStatus, pollCheckinStatus } from '@/lib/checkin-monitor';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();

    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(true);
    // Tab State
    const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'settings'>('overview');

    // Stats State
    const [totalGuests, setTotalGuests] = useState(0);
    const [activeRooms, setActiveRooms] = useState(0);

    // Session State
    const [sessionId, setSessionId] = useState('');
    const [monitorStatus, setMonitorStatus] = useState<'idle' | 'waiting' | 'verified'>('idle');
    const [verifiedData, setVerifiedData] = useState<any>(null);

    // Load Stats
    useEffect(() => {
        const fetchStats = async () => {
            const { count: guestCount } = await supabase.from('checkins').select('id', { count: 'exact' }).neq('status', 'checked_out');
            const { count: roomCount } = await supabase.from('rooms').select('room_no', { count: 'exact' }).eq('status', 'occupied');
            setTotalGuests(guestCount || 0);
            setActiveRooms(roomCount || 0);
        };
        fetchStats();
    }, []);

    const handleGenerateSession = async () => {
        const newId = `BOOKING-${Math.floor(Math.random() * 10000)}`;

        // Create in DB
        const { error } = await supabase
            .from('checkins')
            .insert([{ session_id: newId, status: 'pending', created_at: new Date().toISOString() }]);

        if (error) {
            alert('Failed to create session: ' + error.message);
            return;
        }

        setSessionId(newId);
        setMonitorStatus('waiting');
        setVerifiedData(null);
    };

    // Monitor Effect
    useEffect(() => {
        if (monitorStatus === 'waiting' && sessionId) {
            // 1. Try Realtime
            const cleanup = monitorCheckinStatus(sessionId, (status, data) => {
                console.log('Realtime update:', status, data);
                setMonitorStatus('verified');
                setVerifiedData(data);
            });

            // 2. Fallback Polling (since Supabase Realtime sometimes needs setup)
            const stopPolling = pollCheckinStatus(sessionId, (data) => {
                console.log('Poll update:', data);
                setMonitorStatus('verified');
                setVerifiedData(data);
            });

            return () => {
                cleanup();
                stopPolling();
            };
        }
    }, [sessionId, monitorStatus]);

    // Render Logic
    return (
        <div
            className="flex h-screen overflow-hidden font-sans"
            style={{
                background: 'var(--bg-color)',
                color: 'var(--text-color)',
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(138, 43, 226, 0.1) 0%, transparent 70%)'
            }}
        >

            {/* Sidebar Navigation */}
            <aside
                className={`flex-shrink-0 h-full border-r shadow-2xl z-30 transition-all duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 lg:w-0 lg:translate-x-0 lg:opacity-100'}`}
                style={{
                    width: sidebarOpen ? '16rem' : '0',
                    background: 'rgba(15, 5, 24, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                }}
            >
                <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight" style={{ color: 'var(--primary-color)' }}>
                        <span className="text-3xl">🛡️</span> ADMIN
                    </h1>
                    {/* Desktop Collapse Button */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="hidden lg:block text-slate-400 hover:text-white transition-colors p-1"
                        title="Collapse Sidebar"
                    >
                        ◀
                    </button>
                    {/* Mobile Close Button */}
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">✕</button>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
                    <TabButton
                        label="Overview"
                        icon="🖥️"
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                    />
                    <TabButton
                        label="Room Management"
                        icon="🏨"
                        active={activeTab === 'rooms'}
                        onClick={() => setActiveTab('rooms')}
                    />
                    <TabButton
                        label="Device Security"
                        icon="🔐"
                        active={activeTab === 'settings'}
                        onClick={() => setActiveTab('settings')}
                    />
                </nav>

                <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <button
                        onClick={async () => {
                            if (!confirm('Logout from Admin Console?')) return;
                            await supabase.from('users').update({ active_device_id: null }).eq('id', (await supabase.auth.getUser()).data.user?.id);
                            await supabase.auth.signOut();
                            router.push("/");
                        }}
                        className="w-full py-3 px-4 rounded-lg text-left text-red-400 hover:bg-red-900/20 hover:text-red-300 font-bold transition-all flex items-center gap-3"
                    >
                        <span>🚪</span> Terminate Session
                    </button>
                    <p className="text-xs text-slate-500 mt-3 px-4 font-mono">v1.2.0 • Secure Build</p>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 h-full overflow-y-auto relative p-8">

                {/* Header */}
                <div
                    className="flex justify-between items-center mb-10 p-4 rounded-xl border shadow-lg sticky top-0 z-40 backdrop-blur-md"
                    style={{
                        background: 'rgba(20, 0, 50, 0.6)',
                        borderColor: 'var(--primary-color)',
                        boxShadow: '0 0 20px rgba(138, 43, 226, 0.15)'
                    }}
                >
                    <div className="flex items-center gap-6">
                        {/* Toggle Button */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-3 rounded-lg text-slate-200 transition-colors border shadow-sm"
                            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                            title="Toggle Sidebar"
                        >
                            {sidebarOpen ? '◀' : '☰'}
                        </button>

                        <div>
                            <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-color)' }}>
                                {activeTab === 'overview' && 'Kiosk Operations'}
                                {activeTab === 'rooms' && 'Room Inventory'}
                                {activeTab === 'settings' && 'Security Settings'}
                            </h2>
                            <p className="text-sm font-mono" style={{ color: 'var(--primary-color)', opacity: 0.8 }}>System Online • Ready</p>
                        </div>
                    </div>

                    {/* Top Stats */}
                    <div className="flex gap-8 pr-4">
                        <div className="text-right">
                            <p className="text-xs uppercase font-bold tracking-wider opacity-60">Total Guests</p>
                            <p className="text-2xl font-black" style={{ color: 'var(--secondary-color)' }}>{totalGuests}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase font-bold tracking-wider opacity-60">Occupied</p>
                            <p className="text-2xl font-black" style={{ color: 'var(--primary-color)' }}>{activeRooms}</p>
                        </div>
                    </div>
                </div>

                {/* TAB CONTENT: OVERVIEW (QR & MONITOR) */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Kiosk Controller */}
                        <div className="rounded-xl shadow-lg border overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}>
                            <div className="p-6 flex justify-between items-center text-white border-b" style={{ background: 'linear-gradient(90deg, #4B0082, #1a0b2e)', borderColor: 'rgba(255,255,255,0.1)' }}>
                                <h3 className="font-bold text-lg flex items-center gap-2">📱 Session Control</h3>
                                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                            </div>
                            <div className="p-8 flex flex-col items-center min-h-[400px] justify-center">
                                {!sessionId ? (
                                    <div className="text-center">
                                        <div className="text-7xl mb-6 opacity-80">🎫</div>
                                        <p className="text-slate-400 mb-8 text-lg">No active session.</p>
                                        <button
                                            onClick={handleGenerateSession}
                                            className="px-8 py-4 font-bold rounded-xl shadow-lg hover:scale-105 transition-all w-full md:w-auto"
                                            style={{ background: 'var(--primary-color)', color: '#000' }}
                                        >
                                            Generate New Session
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center w-full max-w-md">
                                        <div className="p-4 bg-white rounded-2xl shadow-xl mb-6">
                                            <QRCodeSVG value={getSessionQrUrl(sessionId)} size={240} />
                                        </div>
                                        <p className="font-mono font-bold text-2xl tracking-wider mb-2" style={{ color: 'var(--primary-color)' }}>{sessionId}</p>
                                        <p className="text-sm text-slate-500 mb-8">Ready for checking</p>

                                        <div className="flex gap-4 w-full">
                                            <button
                                                onClick={() => { if (confirm('Reset Session?')) setSessionId(''); }}
                                                className="flex-1 py-3 bg-red-900/20 text-red-400 font-bold rounded-xl hover:bg-red-900/30 transition-colors border border-red-900/50"
                                            >
                                                Discard
                                            </button>
                                            <a
                                                href={getSessionQrUrl(sessionId)}
                                                target="_blank"
                                                className="flex-1 py-3 text-black font-bold text-center rounded-xl hover:opacity-90 transition-colors shadow-lg"
                                                style={{ background: 'var(--primary-color)' }}
                                            >
                                                Launch Kiosk ↗
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Live Feed */}
                        <div className="rounded-xl shadow-lg border overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}>
                            <div className="p-6 border-b flex justify-between items-center" style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}>
                                <h3 className="font-bold text-slate-200 flex items-center gap-2">📡 Live Feed</h3>
                                <span className={`text-xs font-black px-3 py-1 rounded-full ${monitorStatus === 'idle' ? 'bg-slate-700 text-slate-400' :
                                    monitorStatus === 'waiting' ? 'bg-amber-900/30 text-amber-500 border border-amber-500/30' :
                                        'bg-green-900/30 text-green-400 border border-green-500/30'
                                    }`}>
                                    {monitorStatus.toUpperCase()}
                                </span>
                            </div>

                            <div className="p-8 flex-1 flex flex-col items-center justify-center min-h-[400px]">
                                {monitorStatus === 'idle' && (
                                    <div className="text-center opacity-40">
                                        <div className="text-6xl mb-4">💤</div>
                                        <p className="italic">System Idle</p>
                                    </div>
                                )}
                                {monitorStatus === 'waiting' && (
                                    <div className="text-center animate-pulse">
                                        <div className="mx-auto h-16 w-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                                        <p className="text-xl font-medium text-amber-500">Waiting for Scan...</p>
                                        <p className="text-sm text-slate-500 mt-2">Listening on Secure Channel</p>
                                    </div>
                                )}
                                {monitorStatus === 'verified' && (
                                    <div className="text-center w-full animate-in zoom-in duration-300">
                                        <div className="text-8xl mb-6">✅</div>
                                        <h2 className="text-3xl font-black text-green-400 mb-4">VERIFIED</h2>
                                        <div className="bg-black/50 p-6 rounded-xl border border-slate-700 text-left text-sm font-mono text-green-400 overflow-auto max-h-64 shadow-inner mb-6">
                                            {JSON.stringify(verifiedData, null, 2)}
                                        </div>
                                        <button
                                            onClick={() => { setMonitorStatus('waiting'); setVerifiedData(null); }}
                                            className="px-6 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition"
                                        >
                                            Clear & Ready Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: ROOMS */}
                {activeTab === 'rooms' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <RoomManager />
                    </div>
                )}

                {/* TAB CONTENT: SETTINGS */}
                {activeTab === 'settings' && (
                    <div className="rounded-xl shadow-lg border p-8 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}>
                        <h3 className="text-xl font-bold mb-6 text-white">Device Authorization</h3>
                        <AuthKeyManager />
                    </div>
                )}

            </main>
        </div>
    );
}

// Sub-components
function TabButton({ label, icon, active, onClick }: { label: string, icon: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 w-full ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 translate-x-1'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`}
        >
            <span className="text-lg opacity-80">{icon}</span>
            {label}
        </button>
    );
}

function RoomManager() {
    const [rooms, setRooms] = useState<any[]>([]);

    const fetchRooms = async () => {
        const res = await fetch('/api/rooms');
        const data = await res.json();
        if (data.rooms) setRooms(data.rooms);
    };

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleCheckout = async (roomNo: string) => {
        if (!confirm(`Checkout Room ${roomNo}?`)) return;

        const res = await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_no: roomNo })
        });

        if (res.ok) fetchRooms();
        else alert('Checkout failed');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                <div>
                    <h3 className="font-bold text-xl text-white">Room Grid</h3>
                    <p className="text-sm text-slate-400">Live Occupancy Status</p>
                </div>
                <button onClick={() => fetchRooms()} className="text-sm px-4 py-2 bg-slate-700 text-blue-400 rounded-lg hover:bg-slate-600 transition">Refresh Grid</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {rooms.map(room => (
                    <div
                        key={room.room_no}
                        className={`relative p-5 rounded-xl border-2 transition-all duration-300 group ${room.status === 'occupied'
                            ? 'bg-red-900/10 border-red-500/50 hover:border-red-500 hover:bg-red-900/20'
                            : 'bg-slate-800 border-slate-700 hover:border-green-500/50 hover:bg-slate-700/50'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="font-black text-3xl text-slate-100">{room.room_no}</span>
                            <div className={`h-3 w-3 rounded-full shadow-[0_0_8px] ${room.status === 'occupied'
                                ? 'bg-red-500 shadow-red-500/50'
                                : 'bg-green-500 shadow-green-500/50'
                                }`}></div>
                        </div>

                        <p className={`text-xs font-black uppercase tracking-widest mb-4 ${room.status === 'occupied' ? 'text-red-400' : 'text-green-500'
                            }`}>
                            {room.status}
                        </p>

                        {room.status === 'occupied' ? (
                            <button
                                onClick={() => handleCheckout(room.room_no)}
                                className="w-full py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded hover:bg-red-500 hover:text-white transition-all"
                            >
                                Force Checkout
                            </button>
                        ) : (
                            <div className="h-8 flex items-center justify-center text-xs text-slate-500 font-bold opacity-30">
                                AVAILABLE
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

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
    // Session State
    const [sessionId, setSessionId] = useState('');
    const [monitorStatus, setMonitorStatus] = useState<'idle' | 'waiting' | 'verified'>('idle');
    const [verifiedData, setVerifiedData] = useState<any>(null);

    const handleGenerateSession = () => {
        const newId = `BOOKING-${Math.floor(Math.random() * 10000)}`;
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

    return (
        <div className="min-h-screen p-8 relative pb-20">
            <BackButton />
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-white shadow rounded-lg border">
                    <h2 className="text-xl font-semibold mb-2">Total Check-ins</h2>
                    <p className="text-3xl text-blue-600">0</p>
                </div>
                {/* ... other stats ... */}
                <div className="p-6 bg-white shadow rounded-lg border">
                    <h2 className="text-xl font-semibold mb-2">Live Status</h2>
                    {monitorStatus === 'waiting' && <p className="text-3xl text-orange-500 animate-pulse">Waiting...</p>}
                    {monitorStatus === 'verified' && <p className="text-3xl text-green-600">Verified!</p>}
                    {monitorStatus === 'idle' && <p className="text-3xl text-gray-400">--</p>}
                </div>
            </div>

            {/* Session Manager */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left: QR Generator */}
                <div className="p-6 bg-white shadow rounded-lg border">
                    <h2 className="text-xl font-bold mb-4">Session Manager</h2>
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={handleGenerateSession}
                            className="bg-black text-white px-4 py-2 rounded font-bold hover:bg-gray-800"
                        >
                            Generate New Session
                        </button>
                        <input
                            type="text"
                            value={sessionId}
                            onChange={e => setSessionId(e.target.value)}
                            placeholder="Or enter custom ID"
                            className="border p-2 rounded flex-1 font-mono"
                        />
                    </div>

                    {sessionId && (
                        <div className="flex flex-col items-center p-4 bg-gray-50 rounded border">
                            <QRCodeSVG value={getSessionQrUrl(sessionId)} size={200} />
                            <p className="mt-4 font-mono font-bold text-lg">{sessionId}</p>
                            <p className="text-sm text-gray-500 mt-2">Scan this at the Kiosk</p>

                            <a
                                href={getSessionQrUrl(sessionId)}
                                target="_blank"
                                className="mt-4 text-blue-600 underline text-sm"
                            >
                                Open Kiosk Link (Test)
                            </a>
                        </div>
                    )}
                </div>

                {/* Right: Live Monitor Details */}
                <div className="p-6 bg-white shadow rounded-lg border">
                    <h2 className="text-xl font-bold mb-4">Live Check-in Feed</h2>

                    {monitorStatus === 'idle' && <p className="text-gray-400 italic">Generate a session to start monitoring.</p>}

                    {monitorStatus === 'waiting' && (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <div className="animate-spin h-10 w-10 border-4 border-orange-400 rounded-full border-t-transparent mb-4"></div>
                            <p>Waiting for Kiosk scan...</p>
                        </div>
                    )}

                    {monitorStatus === 'verified' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <h3 className="text-2xl font-bold text-green-800 mb-2">Guest Verified</h3>
                            <p className="text-gray-600">Session: <strong>{sessionId}</strong></p>
                            {verifiedData && (
                                <pre className="mt-4 bg-white p-2 rounded text-left text-xs overflow-auto border">
                                    {JSON.stringify(verifiedData, null, 2)}
                                </pre>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
                <h2 className="text-xl font-bold mb-4">Device Authentication</h2>
                <AuthKeyManager />
            </div>

            {/* Logout Footer (Integrated from Main) */}
            <footer className="mt-12 text-center text-gray-400 text-sm pb-4">
                <button
                    onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
                    className="underline hover:text-gray-600"
                >
                    Terminate Session (Logout)
                </button>
            </footer>
        </div>
    );
}

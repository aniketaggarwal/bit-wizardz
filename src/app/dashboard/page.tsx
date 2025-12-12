"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState<any[]>([]);
    const [checkins, setCheckins] = useState<any[]>([]);
    const [qrSessionId, setQrSessionId] = useState<string | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login"); // Redirect if not logged in
            } else {
                setUser(session.user);
                fetchData();
            }
            setLoading(false);
        };
        getUser();

        // Real-time subscriptions
        const roomSub = supabase
            .channel('rooms-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchData)
            .subscribe();

        const checkinSub = supabase
            .channel('checkins-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, fetchData)
            .subscribe();

        return () => {
            supabase.removeChannel(roomSub);
            supabase.removeChannel(checkinSub);
        };
    }, [router]);

    const fetchData = async () => {
        const { data: roomsData } = await supabase.from('rooms').select('*').order('room_no');
        const { data: checkinsData } = await supabase.from('checkins').select('*').order('created_at', { ascending: false }).limit(10);
        if (roomsData) setRooms(roomsData);
        if (checkinsData) setCheckins(checkinsData);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const generateQr = async () => {
        try {
            const res = await fetch('/api/session', { method: 'POST' });
            const data = await res.json();
            if (data.sessionId) {
                setQrSessionId(data.sessionId);
            }
        } catch (e) {
            console.error("Error generating session", e);
        }
    };

    if (loading) return <div>Loading dashboard...</div>;
    if (!user) return null;

    return (
        <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
                <h1>Dashboard</h1>
                <p>Welcome, {user.email || user.phone}</p>
                <button onClick={handleLogout} style={{ marginBottom: "20px" }}>Logout</button>

                <div style={{ padding: "20px", border: "1px solid #eee", marginBottom: "20px", borderRadius: "8px" }}>
                    <h3>Check-in Station</h3>
                    <button onClick={generateQr} style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}>
                        Generate New Check-in QR
                    </button>

                    {qrSessionId && (
                        <div style={{ marginTop: "20px", textAlign: "center" }}>
                            <p>Scan to Check-in:</p>
                            <QRCodeCanvas value={`${window.location.origin}/checkin?session=${qrSessionId}`} size={256} />
                            <p style={{ fontFamily: 'monospace', marginTop: '10px' }}>{qrSessionId}</p>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <div style={{ marginBottom: "40px" }}>
                    <h2>Rooms Status</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" }}>
                        {rooms.map(room => (
                            <div key={room.room_no} style={{
                                padding: "15px",
                                backgroundColor: room.status === 'vacant' ? '#d4edda' : '#f8d7da',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                textAlign: 'center'
                            }}>
                                <strong>{room.room_no}</strong>
                                <br />
                                <span style={{ fontSize: '12px' }}>{room.status}</span>
                            </div>
                        ))}
                        {rooms.length === 0 && <p>No rooms found.</p>}
                    </div>
                </div>

                <div>
                    <h2>Recent Check-ins</h2>
                    <table border={1} cellPadding={5} style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f8f9fa" }}>
                                <th>Time</th>
                                <th>Session</th>
                                <th>Status</th>
                                <th>Room</th>
                            </tr>
                        </thead>
                        <tbody>
                            {checkins.map(c => (
                                <tr key={c.id}>
                                    <td>{new Date(c.created_at).toLocaleTimeString()}</td>
                                    <td title={c.session_id}>{c.session_id.slice(0, 8)}...</td>
                                    <td>{c.status}</td>
                                    <td>{c.room_no || '-'}</td>
                                </tr>
                            ))}
                            {checkins.length === 0 && (
                                <tr><td colSpan={4}>No check-ins yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

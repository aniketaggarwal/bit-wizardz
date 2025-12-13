'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import FaceScanner from '@/components/FaceScanner';
import { loadEncryptedEmbeddings } from '@/lib/encryption';
import { verifyFaceMatch } from '@/lib/face-util';
import { getPrivateKey, getPublicKey } from '@/lib/auth-crypto';
import { fetchNonce, signNonce, sendVerification } from '@/lib/checkin-auth';
import '../login.css';

interface RegisteredFace {
    name: string;
    descriptor: Float32Array;
}

export default function CheckInPage() {
    const router = useRouter();
    const searchParams = useSearchParams(); // Hook to read URL params

    // Standard State
    const [faces, setFaces] = useState<RegisteredFace[]>([]);

    // Secure Check-in flow state
    const [checkinStep, setCheckinStep] = useState<'scan-qr' | 'fetch-nonce' | 'scan-face' | 'verifying-server' | 'complete'>('scan-qr');
    const [sessionId, setSessionId] = useState('');
    const [nonce, setNonce] = useState('');
    const [matchedName, setMatchedName] = useState('');
    const [allocatedRoom, setAllocatedRoom] = useState<string | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');

    useEffect(() => {
        loadEncryptedEmbeddings().then(setFaces);

        // Auto-Check Session from URL
        const urlSession = searchParams.get('session_id');
        if (urlSession) {
            setSessionId(urlSession);
            // Small timeout to allow state update before "scanning"
            setTimeout(() => {
                handleAutoStart(urlSession);
            }, 500);
        }
    }, [searchParams]);

    const handleAutoStart = async (sid: string) => {
        setCheckinStep('fetch-nonce');
        const fetchedNonce = await fetchNonce(sid);
        if (fetchedNonce) {
            setNonce(fetchedNonce);
            setCheckinStep('scan-face');
        } else {
            alert('Failed to fetch challenge from server. Check network.');
            setCheckinStep('scan-qr');
        }
    };

    // 1. Simulate QR Scan (Enter Session ID)
    const handleQrScan = async () => {
        if (!sessionId) {
            alert('Enter a Session ID (QR Code)');
            return;
        }
        await handleAutoStart(sessionId);
    };

    // 2. Face Scanned -> Verify -> Sign -> Send
    const handleFaceScan = async (liveDescriptor: Float32Array) => {
        // A. Verify Face locally first
        let bestMatchName = '';
        for (const face of faces) {
            if (verifyFaceMatch(face.descriptor, liveDescriptor, 0.45)) {
                bestMatchName = face.name;
                break;
            }
        }

        if (!bestMatchName) {
            setVerificationStatus('failed');
            setTimeout(() => setVerificationStatus('scanning'), 2000);
            return;
        }

        setMatchedName(bestMatchName);
        setVerificationStatus('success'); // Found local match
        setCheckinStep('verifying-server');

        // B. Sign & Send to Server
        try {
            // Fetch Public Key FIRST to ensure if regeneration happens, we get the fresh Private Key after.
            const publicKey = await getPublicKey();
            const privateKey = await getPrivateKey();

            if (!privateKey || !publicKey) {
                alert('Device keys missing! Go to Dashboard -> Auth.');
                setCheckinStep('scan-face'); // Go back
                return;
            }

            const signature = await signNonce(privateKey, nonce);

            if (signature) {
                const { success, error, room } = await sendVerification(signature, nonce, sessionId, publicKey, bestMatchName);
                if (success) {
                    // Success!
                    // Save Guest Session locally
                    if (room) {
                        localStorage.setItem('guest_room', room);
                        setAllocatedRoom(room); // Keep state just in case
                    }
                    localStorage.setItem('guest_name', bestMatchName);
                    localStorage.setItem('guest_session', sessionId);

                    setCheckinStep('complete');

                    // Redirect to Guest Home
                    setTimeout(() => {
                        router.push('/guest');
                    }, 1500);

                } else {
                    alert(`❌ Verification Failed: ${error || 'Server rejected signature'}`);
                    setCheckinStep('scan-face');
                }
            } else {
                alert('Signing failed.');
                setCheckinStep('scan-face');
            }
        } catch (e) {
            console.error(e);
            alert('Error during secure verification.');
            setCheckinStep('scan-face');
        }
    };

    return (
        <main
            className="min-h-screen relative"
            style={{
                background: "linear-gradient(rgba(0,20,40,0.68), rgba(0,17,36,0.68)), url('/city-life.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: '#e6eef8',
                overflow: 'hidden'
            }}
        >
            <header className="top-header">
                <div style={{ width: 120 }}></div>
                <div className="header-brand">FastInn</div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ height: 40 }} />
                </div>
                <div style={{ width: 120, display: 'flex', justifyContent: 'flex-end', paddingRight: 24 }} />
            </header>

            <div className="w-full flex items-center justify-center" style={{ padding: '3.5rem 1rem' }}>
                <div style={{ width: '100%', maxWidth: 1100 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Secure Check-in</h1>
                        <BackButton />
                    </div>

                    {/* Step cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, marginBottom: 18 }}>
                        {/* QR Card */}
                        <div style={{ background: 'rgba(255,255,255,0.06)', padding: 18, borderRadius: 12, boxShadow: '0 10px 30px rgba(2,6,23,0.4)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800 }}>1. Scan Booking QR</div>
                                    <div style={{ color: '#94a3b8', marginTop: 6, fontSize: 13 }}>Scan the QR or enter the session ID provided at the hotel desk.</div>
                                </div>
                                <div>
                                    <button
                                        onClick={handleQrScan}
                                        style={checkinStep === 'scan-qr' ? { background: '#000', color: '#fff', padding: '10px 14px', borderRadius: 10, fontWeight: 800 } : { background: '#ffffff', color: '#000', padding: '10px 14px', borderRadius: 10, fontWeight: 800 }}
                                    >
                                        {checkinStep === 'scan-qr' ? 'Scan/Next' : 'Scan'}
                                    </button>
                                </div>
                            </div>

                            {checkinStep === 'scan-qr' && (
                                <div style={{ marginTop: 12 }}>
                                    <input
                                        type="text"
                                        placeholder="Simulate QR (Session ID)"
                                        className="slick-input"
                                        value={sessionId}
                                        onChange={e => setSessionId(e.target.value)}
                                    />
                                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>In real life, this would automatically scan.</p>
                                </div>
                            )}
                        </div>

                        {/* Face Card */}
                        <div style={{ background: 'rgba(255,255,255,0.04)', padding: 18, borderRadius: 12, boxShadow: '0 10px 30px rgba(2,6,23,0.35)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800 }}>2. Webcam Face Scan</div>
                                    <div style={{ color: '#94a3b8', marginTop: 6, fontSize: 13 }}>Position your face in the frame and follow the on-screen guidance.</div>
                                </div>
                                <div>
                                    <button
                                        onClick={() => setCheckinStep('scan-face')}
                                        style={checkinStep === 'scan-face' ? { background: '#000', color: '#fff', padding: '10px 14px', borderRadius: 10, fontWeight: 800 } : { background: '#ffffff', color: '#000', padding: '10px 14px', borderRadius: 10, fontWeight: 800 }}
                                    >
                                        {checkinStep === 'scan-face' ? 'Start Scan' : 'Open'}
                                    </button>
                                </div>
                            </div>

                            {checkinStep === 'scan-face' && (
                                <div style={{ marginTop: 12 }}>
                                    <FaceScanner onScan={handleFaceScan} />
                                    <p style={{ marginTop: 8, fontWeight: 700, textAlign: 'center' }}>{verificationStatus === 'success' ? `Hello, ${matchedName}!` : 'Look at the camera...'}</p>
                                </div>
                            )}
                        </div>

                        {/* Finalize Card */}
                        <div style={{ background: 'rgba(255,255,255,0.04)', padding: 18, borderRadius: 12, boxShadow: '0 10px 30px rgba(2,6,23,0.32)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800 }}>3. Finalize</div>
                                    <div style={{ color: '#94a3b8', marginTop: 6, fontSize: 13 }}>After successful scan, we process verification and provide your room key.</div>
                                </div>
                                <div>
                                    <button
                                        onClick={() => setCheckinStep('verifying-server')}
                                        style={checkinStep === 'verifying-server' ? { background: '#000', color: '#fff', padding: '10px 14px', borderRadius: 10, fontWeight: 800 } : { background: '#ffffff', color: '#000', padding: '10px 14px', borderRadius: 10, fontWeight: 800 }}
                                    >
                                        {checkinStep === 'verifying-server' ? 'Processing' : 'Finalize'}
                                    </button>
                                </div>
                            </div>

                            {checkinStep === 'verifying-server' && (
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                                        <div style={{ color: '#c7d2fe' }}>Verifying with Server...</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

            {/* Step 1: QR Input (Simulation) */}
            {checkinStep === 'scan-qr' && (
                <div className="p-6 bg-white shadow rounded-lg flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">Scan Booking QR</h2>
                    <input
                        type="text"
                        placeholder="Simulate QR (Session ID)"
                        className="border p-2 rounded text-black font-mono"
                        value={sessionId}
                        onChange={e => setSessionId(e.target.value)}
                    />
                    <button
                        onClick={handleQrScan}
                        className="bg-black text-white py-2 rounded font-bold hover:bg-gray-800"
                    >
                        Next
                    </button>
                    <p className="text-xs text-gray-500">In real life, this would automatically scan.</p>
                </div>
            )}

            {/* Step 2: Fetching Nonce Loading State */}
            {checkinStep === 'fetch-nonce' && (
                <div className="flex flex-col items-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Securely contacting server...</p>
                </div>
            )}

            {/* Step 3: Face Scan */}
            {(checkinStep === 'scan-face' || checkinStep === 'verifying-server') && (
                <div className="w-full max-w-md flex flex-col items-center gap-4">
                    <FaceScanner onScan={handleFaceScan} />

                    <p className="text-center mt-2 font-bold text-lg h-8">
                        {verificationStatus === 'success' ? `Hello, ${matchedName}!` : 'Look at the camera...'}
                    </p>

                    {checkinStep === 'verifying-server' && (
                        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded flex items-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-700 rounded-full border-t-transparent"></div>
                            Verifying with Server...
                        </div>
                    )}
                </div>
            )}

            {/* Step 4: Success -> Redirecting */}
            {checkinStep === 'complete' && (
                <div className="text-center p-8 bg-green-100 rounded-lg flex flex-col items-center shadow-lg">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-3xl font-bold text-green-700 mb-2">Check-in Confirmed!</h2>
                    <p className="text-lg">Redirecting to your Room Key...</p>
                    <div className="animate-spin h-6 w-6 border-2 border-green-700 rounded-full border-t-transparent mt-4"></div>
                </div>
            )}

                </div>
            </div>
        </main>
    );
}

'use client';

import { useState, useEffect } from 'react';
import BackButton from '@/components/BackButton';
import FaceScanner from '@/components/FaceScanner';
import { loadEncryptedEmbeddings } from '@/lib/encryption';
import { verifyFaceMatch } from '@/lib/face-util';
import { getPrivateKey, getPublicKey } from '@/lib/auth-crypto';
import { fetchNonce, signNonce, sendVerification } from '@/lib/checkin-auth';

interface RegisteredFace {
    name: string;
    descriptor: Float32Array;
}

export default function CheckInPage() {
    // Standard State
    const [faces, setFaces] = useState<RegisteredFace[]>([]);

    // Secure Check-in flow state
    const [checkinStep, setCheckinStep] = useState<'scan-qr' | 'fetch-nonce' | 'scan-face' | 'verifying-server' | 'complete'>('scan-qr');
    const [sessionId, setSessionId] = useState('');
    const [nonce, setNonce] = useState('');
    const [matchedName, setMatchedName] = useState('');
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');

    useEffect(() => {
        loadEncryptedEmbeddings().then(setFaces);
    }, []);

    // 1. Simulate QR Scan (Enter Session ID)
    const handleQrScan = async () => {
        if (!sessionId) {
            alert('Enter a Session ID (QR Code)');
            return;
        }

        setCheckinStep('fetch-nonce');
        // Fetch Nonce from Backend
        const fetchedNonce = await fetchNonce(sessionId);
        if (fetchedNonce) {
            setNonce(fetchedNonce);
            setCheckinStep('scan-face');
        } else {
            alert('Failed to fetch challenge from server. Check network.');
            setCheckinStep('scan-qr');
        }
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
            const privateKey = await getPrivateKey();
            const publicKey = await getPublicKey();

            if (!privateKey || !publicKey) {
                alert('Device keys missing! Go to Dashboard -> Auth.');
                setCheckinStep('scan-face'); // Go back
                return;
            }

            const signature = await signNonce(privateKey, nonce);

            if (signature) {
                const success = await sendVerification(signature, nonce, sessionId, publicKey);
                if (success) {
                    // Success!
                    setCheckinStep('complete');
                } else {
                    alert('❌ Server rejected signature.');
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
        <div className="min-h-screen flex flex-col items-center p-8 relative">
            <BackButton />
            <h1 className="text-2xl font-bold mb-8">Secure Check-in</h1>

            {/* Stepper UI */}
            <div className="flex gap-4 mb-8 text-sm">
                <div className={`px-3 py-1 rounded ${checkinStep === 'scan-qr' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1. Scan QR</div>
                <div className={`px-3 py-1 rounded ${checkinStep === 'scan-face' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2. Verify Face</div>
                <div className={`px-3 py-1 rounded ${checkinStep === 'verifying-server' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3. Finalize</div>
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

            {/* Step 4: Success */}
            {checkinStep === 'complete' && (
                <div className="text-center p-8 bg-green-100 rounded-lg flex flex-col items-center shadow-lg">
                    <div className="text-5xl mb-4">✅</div>
                    <h2 className="text-3xl font-bold text-green-700 mb-2">Check-in Confirmed!</h2>
                    <p className="text-lg">Welcome, <strong>{matchedName}</strong>.</p>
                    <div className="mt-4 p-2 bg-white/50 rounded font-mono text-sm text-gray-600">
                        Session: {sessionId}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                    >
                        Next Guest
                    </button>
                </div>
            )}

        </div>
    );
}

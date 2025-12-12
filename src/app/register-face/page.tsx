'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FaceScanner from '@/components/FaceScanner';
import * as faceapi from 'face-api.js';
import { saveEncryptedEmbedding, loadEncryptedEmbeddings, clearSecureStorage } from '@/lib/encryption';
import { supabase } from '@/lib/supabase';
import '../upload-aadhaar/upload.css';

interface RegisteredFace {
    name: string;
    descriptor: Float32Array;
}

export default function RegisterFacePage() {
    const router = useRouter();

    // Core State
    const [name, setName] = useState('');
    const [registeredFaces, setRegisteredFaces] = useState<RegisteredFace[]>([]);

    // Scan Flow State
    const [scannedDescriptor, setScannedDescriptor] = useState<Float32Array | null>(null);
    const [reviewMode, setReviewMode] = useState(false);
    const [scannerKey, setScannerKey] = useState(0); // Used to reset the scanner component
    const [instruction, setInstruction] = useState('Initializing Camera...');
    const [matchResult, setMatchResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    // Load Data on Mount
    useEffect(() => {
        const init = async () => {
            try {
                // 1. Load User Name form Session
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    // Check aligned schema 'users' table
                    const { data: userData } = await supabase.from('users').select('name').eq('id', session.user.id).single();
                    const userName = userData?.name || session.user.user_metadata?.name || '';
                    if (userName) setName(userName);
                }

                // 2. Load Encrypted Faces
                const faces = await loadEncryptedEmbeddings();
                setRegisteredFaces(faces);
            } catch (error) {
                console.error('Failed to init:', error);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    const updateFaceStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Direct Supabase Update (Replica of previous fix)
                await supabase.from('users').update({
                    face_verified: true,
                    updated_at: new Date().toISOString()
                }).eq('id', user.id);

                router.push('/menu');
            }
        } catch (e) {
            console.error("Update Error", e);
        }
    };

    // Callback when FaceScanner detects a valid face (and pauses video)
    const handleScanComplete = (descriptor: Float32Array) => {
        setScannedDescriptor(descriptor);
        setReviewMode(true);
    };

    // User clicked "Confirm Face"
    const handleConfirm = async () => {
        if (!scannedDescriptor) return;

        if (registeredFaces.length === 0) {
            // --- Registration Flow ---
            if (!name) {
                alert("Please enter a name first.");
                return;
            }
            try {
                await saveEncryptedEmbedding(name, scannedDescriptor);
                setRegisteredFaces(prev => [...prev, { name, descriptor: scannedDescriptor }]);

                // Sync with Server & Redirect
                await updateFaceStatus();
            } catch (error) {
                console.error('Registration failed:', error);
                alert('Failed to securely register face');
            }
        } else {
            // --- Verification Flow ---
            const faceMatcher = new faceapi.FaceMatcher(
                registeredFaces.map(f => new faceapi.LabeledFaceDescriptors(f.name, [f.descriptor])),
                0.6
            );
            const match = faceMatcher.findBestMatch(scannedDescriptor);
            const resultStr = match.toString();
            setMatchResult(resultStr);

            if (!resultStr.includes('unknown')) {
                await updateFaceStatus();
            } else {
                // If failed, stay in review mode but show error? 
                // Alternatively, force retake.
            }
        }
    };

    // User clicked "Retake"
    const handleRetake = () => {
        setReviewMode(false);
        setScannedDescriptor(null);
        setMatchResult('');
        setScannerKey(prev => prev + 1); // This resets FaceScanner completely
    };

    return (
        <main className="upload-container">
            <div className="upload-card">

                {/* Header */}
                <div className="upload-header">
                    <button className="back-button" onClick={() => router.back()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <h1 className="upload-title">Face Verification</h1>
                </div>

                <p className="upload-subtitle">
                    {registeredFaces.length === 0
                        ? (name ? `Registering face for: ${name}` : 'Register your face')
                        : `Verifying identity for: ${name || 'User'}`
                    }
                </p>

                {/* Scanner Section */}
                <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    <FaceScanner
                        key={scannerKey}
                        onScan={handleScanComplete}
                    // onInstructionChange={setInstruction} // Removed if FaceScanner doesn't support it in this branch version, checking component...
                    // Actually, looking at FaceScanner.tsx I read earlier, it DOES NOT seem to have onInstructionChange prop!
                    // The 'temp' file had it. The 'FaceScanner.tsx' I read earlier might be different?
                    // Let's re-read FaceScanner.tsx to be safe. 
                    // Wait, I read FaceScanner.tsx in Step 2408. It has `interface FaceScannerProps { onScan: (descriptor: Float32Array) => void; }`
                    // So I should REMOVE onInstructionChange.
                    />
                </div>

                {/* Instructions (Hidden when reviewing) */}
                {!reviewMode && (
                    <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#1e293b', fontWeight: 500, marginTop: '10px' }}>
                        {instruction}
                    </p>
                )}

                {/* Confirm / Retake Buttons */}
                {reviewMode && (
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <button
                            className="continue-button"
                            style={{ backgroundColor: '#ef4444', marginTop: 0 }}
                            onClick={handleRetake}
                        >
                            Retake
                        </button>
                        <button
                            className="continue-button"
                            style={{ backgroundColor: '#22c55e', marginTop: 0 }}
                            onClick={handleConfirm}
                        >
                            Confirm Face
                        </button>
                    </div>
                )}

                {/* Manual Name Input (Fallback) */}
                {registeredFaces.length === 0 && !name && !reviewMode && (
                    <div className="input-group" style={{ marginTop: '10px', textAlign: 'left' }}>
                        <label className="input-label" style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '4px', display: 'block' }}>Your Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Aayush Makkar"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '1rem',
                                color: '#0f172a',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                        />
                    </div>
                )}

                {/* Error Result */}
                {matchResult && matchResult.includes('unknown') && (
                    <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg font-bold text-base text-center mt-2 border border-red-200">
                        Face Not Recognized.
                    </div>
                )}

                {/* Reset Option */}
                {registeredFaces.length > 0 && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                        <button
                            onClick={async () => {
                                if (confirm('Reset all identification data?')) {
                                    await clearSecureStorage();
                                    window.location.reload();
                                }
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Reset Device Data
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}

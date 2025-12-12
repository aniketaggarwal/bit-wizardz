'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FaceScanner from '@/components/FaceScanner';
import * as faceapi from 'face-api.js';
import { saveEncryptedEmbedding, loadEncryptedEmbeddings, clearSecureStorage } from '@/lib/encryption';
import './face-scan.css';

// ... inside component ...



interface RegisteredFace {
    name: string;
    descriptor: Float32Array;
}

export default function RegisterFacePage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [registeredFaces, setRegisteredFaces] = useState<RegisteredFace[]>([]);
    const [matchResult, setMatchResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    // Load encrypted faces on mount
    useEffect(() => {
        const loadFaces = async () => {
            try {
                const faces = await loadEncryptedEmbeddings();
                setRegisteredFaces(faces);
            } catch (error) {
                console.error('Failed to load faces:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadFaces();
    }, []);

    const handleRegister = async (descriptor: Float32Array) => {
        if (!name) {
            alert('Please enter a name first');
            return;
        }

        try {
            await saveEncryptedEmbedding(name, descriptor);
            setRegisteredFaces(prev => [...prev, { name, descriptor }]);
            alert(`Securely Registered ${name}`);
            setName('');
            setMatchResult('');
        } catch (error) {
            console.error('Registration failed:', error);
            alert('Failed to securely register face');
        }
    };

    const handleVerify = (descriptor: Float32Array) => {
        if (registeredFaces.length === 0) {
            alert('No faces registered yet');
            return;
        }

        const faceMatcher = new faceapi.FaceMatcher(
            registeredFaces.map(f => new faceapi.LabeledFaceDescriptors(f.name, [f.descriptor])),
            0.6
        );

        const match = faceMatcher.findBestMatch(descriptor);
        setMatchResult(match.toString()); // e.g. "Aniket (0.45)"
    };
    const [instruction, setInstruction] = useState('Initializing Camera...');

    return (
        <main className="min-h-screen w-full relative flex flex-col items-center justify-center overflow-hidden" style={{ backgroundColor: '#0a0e27' }}>

            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: "url('/background-webcam.jpg')",
                    filter: "brightness(0.3)"
                }}
            />

            {/* Centered Card Container */}
            <div className="relative z-10 w-full max-w-2xl mx-auto p-6">

                {/* White Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">

                    <div className="face-scan-header">
                        <button className="back-button" onClick={() => router.back()}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                        <h1 className="face-scan-title">Face Scan</h1>
                    </div>

                    <p className="face-scan-instruction">{instruction}</p>

                    <div className="scanner-wrapper">
                        <FaceScanner
                            onScan={(descriptor) => {
                                if (registeredFaces.length === 0 && name) {
                                    handleRegister(descriptor);
                                } else {
                                    handleVerify(descriptor);
                                }
                            }}
                            onInstructionChange={setInstruction}
                        />
                    </div>

                    {registeredFaces.length === 0 && (
                        <div className="registration-input">
                            <input
                                type="text"
                                placeholder="Enter Name to Register"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Results */}
                    {matchResult && (
                        <div className={`
                            px-6 py-4 rounded-xl font-bold text-xl text-center
                            ${matchResult.includes('unknown')
                                ? 'bg-red-100 text-red-700 border-2 border-red-300'
                                : 'bg-green-100 text-green-700 border-2 border-green-300'}
                        `}>
                            {matchResult}
                        </div>
                    )}

                    {registeredFaces.length > 0 && (
                        <div className="action-buttons">
                            <button
                                onClick={() => router.push('/menu')}
                                className="btn-primary"
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirm('Reset all identification data?')) {
                                        await clearSecureStorage();
                                        window.location.reload();
                                    }
                                }}
                                className="btn-secondary"
                            >
                                Reset
                            </button>
                        </div>
                    )}

                </div>

                {/* Back Button */}
                <button
                    onClick={() => window.history.back()}
                    className="absolute top-0 left-6 text-white/80 hover:text-white transition flex items-center gap-2 text-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                    Back
                </button>

            </div>
        </main>
    );
}

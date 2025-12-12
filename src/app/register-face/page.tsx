'use client';

import { useState, useEffect } from 'react';
import FaceScanner from '@/components/FaceScanner';
import BackButton from '@/components/BackButton';
import * as faceapi from 'face-api.js';
import { saveEncryptedEmbedding, loadEncryptedEmbeddings, clearSecureStorage } from '@/lib/encryption';

// ... (existing imports)

// ... inside component ...



interface RegisteredFace {
    name: string;
    descriptor: Float32Array;
}

export default function RegisterFacePage() {
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

    return (
        <div className="min-h-screen flex flex-col items-center p-8 gap-6 relative">
            <BackButton />
            <h1 className="text-2xl font-bold mt-8">Face Recognition Playground (Test Mode)</h1>

            <div className="w-full max-w-md flex flex-col gap-4">
                {/* Registration Section */}
                <div className="p-4 bg-gray-100 rounded-lg">
                    {registeredFaces.length === 0 ? (
                        <>
                            <h2 className="font-semibold mb-2">1. Register Owner</h2>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Enter Name"
                                    className="border p-2 rounded flex-1 text-black placeholder-gray-500"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>
                            <p className="text-sm text-gray-500">
                                This will become the <strong>Sole Owner</strong> of this device.
                            </p>
                        </>
                    ) : (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 text-yellow-700 mx-auto">
                            <p className="font-bold text-center">🔒 Device Locked</p>
                            <p className="text-sm mt-1 text-center">
                                This device is registered to: <br />
                                <span className="font-bold text-lg">{registeredFaces[0].name}</span>
                            </p>
                            <p className="text-xs mt-2 text-center text-yellow-600">
                                To register a new owner, you must wiping the device data below.
                            </p>
                        </div>
                    )}
                </div>

                {/* Scanner - Dynamic Instruction */}
                <FaceScanner onScan={(descriptor) => {
                    if (registeredFaces.length === 0 && name) {
                        handleRegister(descriptor);
                    } else {
                        handleVerify(descriptor);
                    }
                }} />

                <div className="text-center text-lg text-black font-bold">
                    {registeredFaces.length === 0 ? (
                        <span>Type a name and press Scan to <span className="text-blue-600">Lock Device</span>.</span>
                    ) : (
                        <span>Scan Face to <span className="text-purple-600">Verify Identity</span>.</span>
                    )}
                </div>

                {/* Result */}
                {matchResult && (
                    <div className={`p-4 rounded-lg text-center font-bold text-xl ${matchResult.includes('unknown') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                        Result: {matchResult}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t font-mono text-xs text-center">
                    {registeredFaces.length > 0 && (
                        <button
                            onClick={() => window.location.href = '/menu'}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-lg mb-4 hover:bg-blue-700 w-full"
                        >
                            Go to Main Menu
                        </button>
                    )}

                    <button
                        onClick={async () => {
                            if (confirm('⚠️ Are you sure you want to WIPE ALL DATA? This cannot be undone.')) {
                                await clearSecureStorage();
                                window.location.reload();
                            }
                        }}
                        className="text-red-500 hover:text-red-700 underline block mx-auto mt-4"
                    >
                        [Reset / Wipe All Data]
                    </button>
                    <p className="mt-2 text-gray-400">Use this if you see decryption errors.</p>
                </div>
            </div>
        </div>
    );
}

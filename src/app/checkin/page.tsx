'use client';

import { useState, useEffect } from 'react';
import BackButton from '@/components/BackButton';
import FaceScanner from '@/components/FaceScanner';
import { loadEncryptedEmbeddings } from '@/lib/encryption';
import { verifyFaceMatch } from '@/lib/face-util';

interface RegisteredFace {
    name: string;
    descriptor: Float32Array;
}

export default function CheckInPage() {
    const [mode, setMode] = useState<'qr' | 'face'>('qr');
    const [faces, setFaces] = useState<RegisteredFace[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
    const [matchedName, setMatchedName] = useState<string>('');

    // Load faces when entering face mode
    useEffect(() => {
        if (mode === 'face' && faces.length === 0) {
            setIsLoading(true);
            loadEncryptedEmbeddings()
                .then(loadedFaces => {
                    setFaces(loadedFaces);
                    setVerificationStatus('scanning');
                })
                .catch(err => console.error('Failed to load faces', err))
                .finally(() => setIsLoading(false));
        }
    }, [mode, faces.length]);

    const handleFaceScan = async (descriptor: Float32Array) => {
        // Find best match
        let bestMatch = { name: '', distance: 1.0 };

        for (const face of faces) {
            const isMatch = verifyFaceMatch(face.descriptor, descriptor, 0.45); // 0.45 threshold
            if (isMatch) {
                // If strictly matching, we could break early, but let's find closest if multiple
                // For now, simple boolean match is enough as per request
                setMatchedName(face.name);
                setVerificationStatus('success');
                return;
            }
        }

        setVerificationStatus('failed');
        setTimeout(() => setVerificationStatus('scanning'), 2000); // Retry after 2s
    };

    return (
        <div className="min-h-screen flex flex-col items-center p-8 relative">
            <BackButton />
            <h1 className="text-2xl font-bold mb-8">Check-in</h1>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setMode('qr')}
                    className={`px-4 py-2 rounded ${mode === 'qr' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                    QR Code
                </button>
                <button
                    onClick={() => setMode('face')}
                    className={`px-4 py-2 rounded ${mode === 'face' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                    Verify Face
                </button>
            </div>

            {mode === 'qr' ? (
                <>
                    <p className="mb-4 text-gray-600">Scan your booking QR code.</p>
                    <div className="bg-gray-200 w-64 h-64 rounded-lg mb-4 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-400">
                        QR Scanner Placeholder
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center w-full max-w-md">
                    {/* Status Feedback */}
                    {verificationStatus === 'success' ? (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-center w-full">
                            <h3 className="font-bold text-xl">Matches Found!</h3>
                            <p className="text-2xl mt-1">Check-in for: <strong>{matchedName}</strong></p>
                        </div>
                    ) : verificationStatus === 'failed' ? (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-center w-full">
                            No match found. Retrying...
                        </div>
                    ) : null}

                    {/* Scanner */}
                    {isLoading ? (
                        <div className="p-12 text-gray-500">Loading Secure Face Database...</div>
                    ) : (
                        verificationStatus !== 'success' && (
                            <FaceScanner onScan={handleFaceScan} />
                        )
                    )}

                    {!isLoading && verificationStatus === 'scanning' && (
                        <p className="text-gray-500 mt-4 text-sm">
                            Database loaded: {faces.length} faces ready.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

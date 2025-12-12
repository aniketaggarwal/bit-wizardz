'use client';

import { useState, useEffect } from 'react';
import { generateKeypair, getPublicKey, signChallenge, verifySignatureLocally } from '@/lib/auth-crypto';

export default function AuthKeyManager() {
    const [publicKey, setPublicKey] = useState<string>('');
    const [testSignature, setTestSignature] = useState<string>('');
    const [verificationResult, setVerificationResult] = useState<boolean | null>(null);

    useEffect(() => {
        // Initialize keys on load
        generateKeypair().then(() => {
            getPublicKey().then(key => setPublicKey(key || 'Error generating key'));
        });
    }, []);

    const handleTestSign = async () => {
        const challenge = `test-challenge-${Date.now()}`;
        const sig = await signChallenge(challenge);
        if (sig) {
            setTestSignature(sig);
            // Verify immediately
            const isValid = await verifySignatureLocally(challenge, sig);
            setVerificationResult(isValid);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Public Key (Base64)</label>
                <div className="mt-1 flex gap-2">
                    <code className="block w-full p-2 bg-gray-800 text-green-400 rounded text-xs break-all">
                        {publicKey || 'Loading...'}
                    </code>
                    <button
                        onClick={() => navigator.clipboard.writeText(publicKey)}
                        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                    >
                        Copy
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Provide this key to your backend/Supabase to verify signatures from this device.
                </p>
            </div>

            {/* Backend Sync Section */}
            <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-2">Backend Sync</h3>
                <button
                    onClick={async () => {
                        try {
                            const res = await fetch('/api/devices/register', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ publicKey, name: 'Local Kiosk' })
                            });
                            const data = await res.json();
                            if (data.success) {
                                alert(`✅ Synced! Device ID: ${data.device?.id || data.id}`);
                            } else {
                                alert('❌ Sync Failed: ' + data.error);
                            }
                        } catch (e) {
                            alert('❌ Network Error');
                        }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                    Sync with Supabase
                </button>
                <p className="text-xs text-gray-400 mt-2">
                    Ensures this device is whitelisted in the cloud.
                </p>
            </div>

            <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-2">Test Signing</h3>
                <button
                    onClick={handleTestSign}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                >
                    Sign & Verify Test Challenge
                </button>

                {testSignature && (
                    <div className="mt-2 text-sm">
                        <p><strong>Signature:</strong> <span className="font-mono text-xs">{testSignature.substring(0, 50)}...</span></p>
                        <p className={verificationResult ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            Verification: {verificationResult ? "VALID ✅" : "INVALID ❌"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

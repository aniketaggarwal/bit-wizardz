'use client';

import { useState } from 'react';
import FaceScanner from '@/components/FaceScanner';
import BackButton from '@/components/BackButton';
import * as faceapi from 'face-api.js';

interface RegisteredFace {
    name: string;
    descriptor: Float32Array;
}

export default function RegisterFacePage() {
    const [name, setName] = useState('');
    const [registeredFaces, setRegisteredFaces] = useState<RegisteredFace[]>([]);
    const [matchResult, setMatchResult] = useState<string>('');

    const handleRegister = (descriptor: Float32Array) => {
        if (!name) {
            alert('Please enter a name first');
            return;
        }
        setRegisteredFaces(prev => [...prev, { name, descriptor }]);
        alert(`Registered ${name}`);
        setName('');
        setMatchResult('');
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
                    <h2 className="font-semibold mb-2">1. Register</h2>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            placeholder="Enter Name"
                            className="border p-2 rounded flex-1 text-black placeholder-gray-500"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <p className="text-sm text-gray-500">Currently Registered: {registeredFaces.length}</p>
                    <ul className="text-sm list-disc pl-5 mt-2">
                        {registeredFaces.map((f, i) => <li key={i}>{f.name}</li>)}
                    </ul>
                </div>

                {/* Scanner */}
                <FaceScanner onScan={(descriptor) => {
                    if (name) {
                        handleRegister(descriptor);
                    } else {
                        handleVerify(descriptor);
                    }
                }} />

                <div className="text-center text-lg text-black font-bold">
                    Type a name and press Scan to <span className="text-blue-600">Register</span>. <br />
                    Leave name empty and press Scan to <span className="text-purple-600">Verify</span>.
                </div>

                {/* Result */}
                {matchResult && (
                    <div className={`p-4 rounded-lg text-center font-bold text-xl ${matchResult.includes('unknown') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                        Result: {matchResult}
                    </div>
                )}
            </div>
        </div>
    );
}

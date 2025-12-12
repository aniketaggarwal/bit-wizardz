'use client';

import { useState } from 'react';
import BackButton from '@/components/BackButton';
import { verifyAadhaarCard } from '@/lib/ocr-verification';

export default function UploadIDPage() {
    const [isScanning, setIsScanning] = useState(false);
    const [statusMatch, setStatusMatch] = useState<{ success: boolean; msg: string } | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        setStatusMatch(null);

        try {
            // 1. Run Local OCR
            const result = await verifyAadhaarCard(file);

            if (result.success) {
                setStatusMatch({ success: true, msg: `✅ Valid Aadhaar Detected! (Found: ${result.foundKeywords.join(', ')})` });
                // TODO: Proceed to actual upload
            } else {
                setStatusMatch({
                    success: false,
                    msg: `❌ Invalid Document. Could not find Aadhaar keywords. (Found: ${result.foundKeywords.length > 0 ? result.foundKeywords.join(', ') : 'None'})`
                });
            }
        } catch (error) {
            console.error(error);
            setStatusMatch({ success: false, msg: '❌ OCR Failed. Please try a clearer image.' });
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
            <BackButton />
            <h1 className="text-2xl font-bold mb-4">Upload ID Proof</h1>
            <p className="mb-4 text-gray-600">Please upload your Masked Aadhaar for verification.</p>

            <div className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${statusMatch?.success ? 'border-green-500 bg-green-50' :
                    statusMatch?.success === false ? 'border-red-500 bg-red-50' :
                        'border-gray-300'
                }`}>

                {isScanning ? (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mb-4"></div>
                        <p className="text-blue-600 font-bold animate-pulse">Scanning Document...</p>
                        <p className="text-xs text-gray-500 mt-2">Checking for "Government of India", "Aadhaar", etc.</p>
                    </div>
                ) : (
                    <>
                        <input
                            type="file"
                            className="hidden"
                            id="id-upload"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                        <label htmlFor="id-upload" className="cursor-pointer flex flex-col items-center">
                            <span className="text-4xl mb-4">📄</span>
                            <span className="text-blue-500 hover:text-blue-600 font-bold">
                                {statusMatch ? 'Upload Another' : 'Click to Upload Aadhaar'}
                            </span>
                            <span className="text-xs text-gray-400 mt-2">Supports JPG, PNG</span>
                        </label>
                    </>
                )}
            </div>

            {statusMatch && (
                <div className={`mt-6 p-4 rounded text-center max-w-md ${statusMatch.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    <p className="font-bold">{statusMatch.msg}</p>
                    {statusMatch.success && <p className="text-xs mt-1">You may now proceed.</p>}
                </div>
            )}
        </div>
    );
}

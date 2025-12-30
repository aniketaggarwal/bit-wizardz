"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface QrScannerProps {
    onScanSuccess: (decodedText: string, decodedResult: any) => void;
    onScanFailure?: (error: any) => void;
    width?: number; // Optional custom width
}

export default function QrCodeScanner({ onScanSuccess, onScanFailure }: QrScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(true);

    useEffect(() => {
        // Initialize Scanner on Mount
        const initScanner = async () => {
            try {
                // Determine format
                const formatsToSupport = [
                    Html5QrcodeSupportedFormats.QR_CODE,
                ];

                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1
                };

                // Start Camera
                await html5QrCode.start(
                    { facingMode: "environment" }, // Prefer Back Camera
                    config,
                    (decodedText, decodedResult) => {
                        // Success Callback
                        setScanning(false);
                        onScanSuccess(decodedText, decodedResult);
                        // Stop scanning after success to prevent multiple triggers
                        html5QrCode.stop().catch(console.error);
                    },
                    (errorMessage) => {
                        // Failure Callback (Optional log, usually noisy)
                        if (onScanFailure) onScanFailure(errorMessage);
                    }
                );
            } catch (err: any) {
                console.error("Camera Init Error:", err);
                setCameraError("Failed to access camera. Please allow permissions.");
                setScanning(false);
            }
        };

        if (scanning) {
            initScanner();
        }

        // Cleanup
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="w-full max-w-sm mx-auto overflow-hidden bg-black rounded-xl shadow-2xl border border-gray-800 relative">
            {cameraError ? (
                <div className="p-8 text-center text-red-500">
                    <p className="font-bold">Camera Error</p>
                    <p className="text-sm mt-2">{cameraError}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-gray-800 rounded text-white text-sm">Retry</button>
                </div>
            ) : (
                <div className="relative">
                    <div id="reader" className="w-full h-[350px] bg-black"></div>

                    {/* Overlay Frame */}
                    <div className="absolute inset-0 pointer-events-none border-[40px] border-black/50">
                        <div className="w-full h-full border-2 border-blue-500/50 relative">
                            {/* Scanning Line Animation */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-[scan_2s_ease-in-out_infinite]"></div>
                        </div>
                    </div>
                </div>
            )}
            <div className="p-4 bg-gray-900 text-center">
                <p className="text-gray-400 text-sm">Point camera at the QR Code</p>
            </div>

            <style jsx global>{`
                @keyframes scan {
                    0%, 100% { top: 0%; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}

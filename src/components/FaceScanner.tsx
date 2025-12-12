import React, { useEffect, useState, useRef } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useFaceApi } from '@/hooks/useFaceApi';
import { extractDescriptor, getEyeAspectRatio } from '@/lib/face-util';

interface FaceScannerProps {
    onScan: (descriptor: Float32Array) => void;
    onInstructionChange?: (instruction: string) => void;
}

export default function FaceScanner({ onScan, onInstructionChange }: FaceScannerProps) {
    const { videoRef, startCamera, isStreamActive, error: cameraError } = useCamera();
    const { isModelLoaded, isLoading: isModelsLoading } = useFaceApi();

    const [status, setStatus] = useState<'idle' | 'detecting' | 'blink-detected' | 'scanned'>('idle');
    const [instruction, setInstruction] = useState('Waiting for camera...');
    const [debugInfo, setDebugInfo] = useState('');

    // Liveness State
    const blinkingRef = useRef(false);
    const scanLoopRef = useRef<number>(0);

    useEffect(() => {
        if (isModelLoaded && !isStreamActive) {
            startCamera();
        }
    }, [isModelLoaded, isStreamActive, startCamera]);

    useEffect(() => {
        if (isStreamActive && isModelLoaded) {
            startScanningLoop();
        }
        return () => stopScanningLoop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStreamActive, isModelLoaded]);

    const startScanningLoop = () => {
        setStatus('detecting');
        setInstruction('Look at the camera and BLINK nicely');

        const loop = async () => {
            if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
                const result = await extractDescriptor(videoRef.current);

                if (result) {
                    const { landmarks, descriptor } = result;
                    const leftEye = landmarks.getLeftEye();
                    const rightEye = landmarks.getRightEye();

                    const leftEAR = getEyeAspectRatio(leftEye);
                    const rightEAR = getEyeAspectRatio(rightEye);
                    const avgEAR = (leftEAR + rightEAR) / 2;

                    setDebugInfo(`EAR: ${avgEAR.toFixed(3)}`);

                    // Blink Logic: EAR < 0.3 means closed, > 0.35 means open
                    // We want: Open -> Closed -> Open

                    if (avgEAR < 0.26) {
                        if (!blinkingRef.current) {
                            blinkingRef.current = true;
                            setInstruction('Blink detected! Open eyes.');
                            setStatus('blink-detected');

                            // Reset if stuck for 2 seconds (faster reset)
                            setTimeout(() => {
                                if (blinkingRef.current) {
                                    blinkingRef.current = false;
                                    setStatus('detecting');
                                    setInstruction('Resetting... Open eyes wide!');
                                }
                            }, 2000);
                        }
                    } else if (avgEAR > 0.28 && blinkingRef.current) { // Lowered open threshold for reliability
                        // Was blinking, now open -> Liveness Confirmed!
                        blinkingRef.current = false;
                        setStatus('scanned');
                        setInstruction('Verified! Scanning...');
                        onScan(descriptor);
                        stopScanningLoop();
                        return; // Stop loop
                    }
                } else {
                    setDebugInfo('No face');
                }

                scanLoopRef.current = requestAnimationFrame(loop);
            } else {
                scanLoopRef.current = requestAnimationFrame(loop);
            }
        };

        loop();
    };

    const stopScanningLoop = () => {
        if (scanLoopRef.current) {
            cancelAnimationFrame(scanLoopRef.current);
        }
    };

    const restart = () => {
        blinkingRef.current = false;
        setStatus('detecting');
        setInstruction('Look at the camera and BLINK nicely');
        startScanningLoop();
    };

    if (isModelsLoading) return <div className="text-gray-500">Loading models...</div>;
    if (cameraError) return <div className="text-red-500">{cameraError}</div>;

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Webcam Container */}
            <div className="luminous-border w-full max-w-xl aspect-[16/9] flex items-center justify-center shadow-2xl">
                <div className="relative w-full h-full overflow-hidden rounded-xl bg-black z-10">

                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        onLoadedMetadata={() => videoRef.current?.play()}
                        className="absolute w-full h-full object-cover transform scale-x-[-1]"
                    />

                    <div className="absolute bottom-4 left-4 text-xs text-green-400 font-mono z-50">
                        {debugInfo}
                    </div>
                </div>
            </div>

            {status === 'scanned' && (
                <button onClick={restart} className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold shadow-lg hover:bg-blue-700 transition z-10">
                    Scan Again
                </button>
            )}
        </div>
    );
}

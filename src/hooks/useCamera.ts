import { useState, useRef, useEffect, useCallback } from 'react';

export const useCamera = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isStreamActive, setIsStreamActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Using useCallback to ensure function stability
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsStreamActive(false);
    }, []);

    const startCamera = useCallback(async () => {
        // Ensure any existing stream is stopped before starting a new one
        stopCamera();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 } // Optimize for face detection
            });

            streamRef.current = stream; // Store in ref for reliable cleanup

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreamActive(true);
                setError(null);
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Could not access camera. Please check permissions.');
            setIsStreamActive(false);
        }
    }, [stopCamera]);

    useEffect(() => {
        return () => {
            stopCamera(); // Cleanup on unmount
        };
    }, [stopCamera]);

    return { videoRef, startCamera, stopCamera, isStreamActive, error };
};


import { useState, useRef, useEffect } from 'react';

export const useCamera = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isStreamActive, setIsStreamActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const stopCamera = () => {
        // Stop all tracks in the stored stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                videoRef.current && (videoRef.current.srcObject = null); // Unbind from video
            });
            streamRef.current = null;
        }
        setIsStreamActive(false);
    };

    const startCamera = async () => {
        try {
            // Ensure any existing stream is stopped
            stopCamera();

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Important: Play explicitly to avoid frozen frames
                // videoRef.current.play().catch(e => console.error(e));
                setIsStreamActive(true);
                setError(null);
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Could not access camera. Please check permissions.');
            setIsStreamActive(false);
        }
    };

    useEffect(() => {
        return () => {
            stopCamera(); // Cleanup on unmount
        };
    }, []);

    return { videoRef, startCamera, stopCamera, isStreamActive, error };
};

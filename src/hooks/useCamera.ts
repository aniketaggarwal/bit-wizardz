import { useState, useRef, useEffect } from 'react';

export const useCamera = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isStreamActive, setIsStreamActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 } // Optimize for face detection
            });

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
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
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

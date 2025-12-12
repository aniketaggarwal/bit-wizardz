import { useState, useEffect } from 'react';
import { loadModels } from '@/lib/face-util';

export const useFaceApi = () => {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            console.log('Loading FaceAPI models...');
            const success = await loadModels();
            if (mounted) {
                setIsModelLoaded(success);
                setIsLoading(false);
                console.log('FaceAPI models loaded:', success);
            }
        };

        init();

        return () => {
            mounted = false;
        };
    }, []);

    return { isModelLoaded, isLoading };
};

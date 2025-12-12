import * as faceapi from 'face-api.js';

// Configuration
const MODEL_URL = '/models';

export const loadModels = async () => {
    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        return true;
    } catch (error) {
        console.error('Error loading models:', error);
        return false;
    }
};

// Helper to separate point objects
const getMagnitude = (p1: faceapi.Point, p2: faceapi.Point) => {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
};

export const getEyeAspectRatio = (eye: faceapi.Point[]) => {
    const v1 = getMagnitude(eye[1], eye[5]);
    const v2 = getMagnitude(eye[2], eye[4]);
    const h = getMagnitude(eye[0], eye[3]);
    return (v1 + v2) / (2.0 * h);
};

// Modified to return details for liveness check
export const extractDescriptor = async (input: HTMLImageElement | HTMLVideoElement): Promise<{ descriptor: Float32Array; landmarks: faceapi.FaceLandmarks68 } | null> => {
    try {
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
        const detection = await faceapi.detectSingleFace(input, options).withFaceLandmarks().withFaceDescriptor();

        if (!detection) {
            return null;
        }

        return { descriptor: detection.descriptor, landmarks: detection.landmarks };
    } catch (error) {
        console.error('Error extracting descriptor:', error);
        return null;
    }
};

export const verifyFaceMatch = (face1: Float32Array, face2: Float32Array, threshold = 0.45): boolean => {
    return faceapi.euclideanDistance(face1, face2) < threshold;
};

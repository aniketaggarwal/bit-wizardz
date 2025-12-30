// import * as faceapi from 'face-api.js'; 
// We will import dynamically inside functions

// Configuration
const MODEL_URL = '/models';

export const loadModels = async () => {
    try {
        const faceapi = await import('face-api.js');
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
// Note: faceapi.Point type is not available statically if we remove import. 
// We might need to use 'any' or import purely types.
// For now, let's use 'any' for the arguments to avoid build errors with missing types 
// or simpler structure checking if possible.
// Actually, we can import type only.
import type { Point, FaceLandmarks68 } from 'face-api.js';

const getMagnitude = (p1: Point, p2: Point) => {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
};

export const getEyeAspectRatio = (eye: Point[]) => {
    const v1 = getMagnitude(eye[1], eye[5]);
    const v2 = getMagnitude(eye[2], eye[4]);
    const h = getMagnitude(eye[0], eye[3]);
    return (v1 + v2) / (2.0 * h);
};

// Modified to return details for liveness check
export const extractDescriptor = async (input: HTMLImageElement | HTMLVideoElement): Promise<{ descriptor: Float32Array; landmarks: FaceLandmarks68 } | null> => {
    try {
        const faceapi = await import('face-api.js');
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

export const verifyFaceMatch = async (face1: Float32Array, face2: Float32Array, threshold = 0.45): Promise<boolean> => {
    const faceapi = await import('face-api.js');
    return faceapi.euclideanDistance(face1, face2) < threshold;
};


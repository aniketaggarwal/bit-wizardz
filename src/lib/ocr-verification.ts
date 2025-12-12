import Tesseract from 'tesseract.js';

// Keywords to look for (Case Insensitive)
const REQUIRED_KEYWORDS = [
    "government of india",
    "aadhaar",
    "uidai",
    "year of birth",
    "dob",
    "unique identification",
    "भारत सरकार", // Bharat Sarkar
    "आधार"         // Aadhaar
];

/**
 * Verifies if the uploaded image contains Masked Aadhaar keywords.
 * @param file The image file to scan
 * @returns { success: boolean, text: string, foundKeywords: string[] }
 */
export const verifyAadhaarCard = async (file: File): Promise<{ success: boolean; foundKeywords: string[] }> => {
    try {
        console.log('[OCR] Starting scan for:', file.name);

        const { data: { text } } = await Tesseract.recognize(
            file,
            'eng+hin', // English + Hindi
            {
                logger: m => console.log('[OCR Progress]', m.status, m.progress?.toFixed(2))
            }
        );

        const lowerText = text.toLowerCase();
        console.log('[OCR] Extracted Text Length:', lowerText.length);

        // Check for keywords
        const foundKeywords = REQUIRED_KEYWORDS.filter(keyword =>
            lowerText.includes(keyword.toLowerCase())
        );

        console.log('[OCR] Found Keywords:', foundKeywords);

        // Threshold: We need at least 2 keywords to be confident it's an Aadhaar
        // (Aadhaar cards usually have multiple of these terms)
        const isValid = foundKeywords.length >= 2;

        return { success: isValid, foundKeywords };
    } catch (error) {
        console.error('[OCR] Failed:', error);
        throw new Error('OCR Scanning Failed');
    }
};

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
 * Verifies if the uploaded image matches the provided user details.
 * @param file The image file to scan
 * @param details The user details to match against (Name, DOB, Aadhaar Last 4)
 * @returns { success: boolean, extracted: any, error?: string }
 */
export const verifyAadhaarCard = async (
    file: File,
    details?: { name: string; dob: string; aadhaarLast4: string }
): Promise<{ success: boolean; extracted?: any; error?: string }> => {
    try {
        console.log('[OCR] Starting scan for:', file.name);

        const { data: { text } } = await Tesseract.recognize(
            file,
            'eng', // English is usually sufficient for numbers and names
            {
                logger: m => console.log('[OCR Progress]', m.status, m.progress?.toFixed(2))
            }
        );

        const cleanText = text.replace(/\n/g, ' ').toLowerCase();
        console.log('[OCR] Extracted Text:', cleanText);

        // 1. Extract Details using Regex

        // DOB Pattern: Matches DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD
        // Regex: 
        // 1. (\d{2}[/-]\d{2}[/-]\d{4}) -> DD/MM/YYYY or DD-MM-YYYY
        // 2. (\d{4}[/-]\d{2}[/-]\d{2}) -> YYYY-MM-DD or YYYY/MM/DD
        const dateRegex = /(\d{2}[/-]\d{2}[/-]\d{4})|(\d{4}[/-]\d{2}[/-]\d{2})/;
        const dobMatch = text.match(dateRegex);
        const extractedDob = dobMatch ? dobMatch[0] : null;

        // Aadhaar Pattern: 
        // 1. Unmasked: 12 digits (e.g. 1234 5678 9012)
        // 2. Masked: XXXXXXXX1234 or XXXX XXXX 1234 (case insensitive)
        const aadhaarRegex = /([xX\d]{4}\s[xX\d]{4}\s\d{4})|([xX\d]{8}\d{4})/;
        const aadhaarMatch = text.match(aadhaarRegex);
        const extractedAadhaar = aadhaarMatch ? aadhaarMatch[0] : null;

        // Name Extraction is tricky. Heuristic: Look for the name provided by user in the text.
        // Fuzzy match: Check if "Part" of the name exists.
        const nameParts = details?.name ? details.name.toLowerCase().split(' ') : [];
        const isNameFound = nameParts.some(part => part.length > 2 && cleanText.includes(part));

        const extractedData = {
            dob: extractedDob,
            aadhaar: extractedAadhaar,
            nameFound: isNameFound
        };

        console.log('[OCR] Extracted Data:', extractedData);

        if (!details) {
            // Just return what we found if no details to verify against
            return { success: true, extracted: extractedData };
        }

        // 2. Verification Logic
        let errorMsg = '';

        // Match DOB
        // Normalize: We want to compare everything in YYYY-MM-DD format if possible or whatever format matches
        const toStandard = (dStr: string) => {
            const norm = dStr.replace(/\//g, '-');
            if (/^\d{4}-\d{2}-\d{2}$/.test(norm)) return norm; // Already YYYY-MM-DD
            if (/^\d{2}-\d{2}-\d{4}$/.test(norm)) {
                const [d, m, y] = norm.split('-');
                return `${y}-${m}-${d}`;
            }
            return norm; // Return as is if unknown
        };

        const stdExtracted = toStandard(extractedDob || '');
        const stdExpected = toStandard(details.dob);

        if (!extractedDob || stdExtracted !== stdExpected) {
            console.log(`[OCR] DOB Mismatch: Extracted(${stdExtracted}) != Expected(${stdExpected})`);
            errorMsg += `DOB Mismatch. Found: ${extractedDob || 'None'}. `;
        }

        // Match Aadhaar Last 4
        if (extractedAadhaar) {
            const cleanAadhaar = extractedAadhaar.replace(/\s/g, '');
            const last4 = cleanAadhaar.slice(-4);
            if (last4 !== details.aadhaarLast4) {
                errorMsg += `Aadhaar Number Mismatch. Found ending in ${last4} (Expected: ${details.aadhaarLast4}). `;
            }
        } else {
            errorMsg += "Could not read Aadhaar Number. ";
        }

        // Match Name
        if (!isNameFound) {
            errorMsg += "Name verification failed. ";
        }

        if (errorMsg) {
            return { success: false, extracted: extractedData, error: errorMsg };
        }

        return { success: true, extracted: extractedData };

    } catch (error) {
        console.error('[OCR] Failed:', error);
        throw new Error('OCR Scanning Failed');
    }
};

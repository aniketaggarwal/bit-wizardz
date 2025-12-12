import BackButton from '@/components/BackButton';

export default function UploadIDPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
            <BackButton />
            <h1 className="text-2xl font-bold mb-4">Upload ID Proof</h1>
            <p className="mb-4 text-gray-600">Please upload your ID for OCR verification.</p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <input type="file" className="hidden" id="id-upload" />
                <label htmlFor="id-upload" className="cursor-pointer text-blue-500 hover:text-blue-600">
                    Click to upload or drag and drop
                </label>
            </div>
        </div>
    );
}

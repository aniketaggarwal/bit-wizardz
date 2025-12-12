import BackButton from '@/components/BackButton';

export default function CheckInPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
            <BackButton />
            <h1 className="text-2xl font-bold mb-4">Check-in</h1>
            <p className="mb-4 text-gray-600">Scan the QR code to check in.</p>
            <div className="bg-gray-200 w-64 h-64 rounded-lg mb-4 flex items-center justify-center text-gray-500">
                QR Code Scanner Placeholder
            </div>
        </div>
    );
}

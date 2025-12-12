import Link from 'next/link';

export default function BackButton() {
    return (
        <Link
            href="/"
            className="absolute top-4 left-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors z-10"
        >
            ← Back
        </Link>
    );
}

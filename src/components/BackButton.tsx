'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className="absolute top-6 left-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-2xl transition-all z-20 backdrop-blur-sm border border-white/10"
            aria-label="Go Back"
        >
            &lt;
        </button>
    );
}

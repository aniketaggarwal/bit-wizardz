'use client';

import BackButton from '@/components/BackButton';
import AuthKeyManager from '@/components/AuthKeyManager';

export default function DashboardPage() {
    return (
        <div className="min-h-screen p-8 relative">
            <BackButton />
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white shadow rounded-lg border">
                    <h2 className="text-xl font-semibold mb-2">Total Check-ins</h2>
                    <p className="text-3xl text-blue-600">0</p>
                </div>
                <div className="p-6 bg-white shadow rounded-lg border">
                    <h2 className="text-xl font-semibold mb-2">Active Guests</h2>
                    <p className="text-3xl text-green-600">0</p>
                </div>
                <div className="p-6 bg-white shadow rounded-lg border">
                    <h2 className="text-xl font-semibold mb-2">Pending ID Reviews</h2>
                    <p className="text-3xl text-orange-600">0</p>
                </div>
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
                <h2 className="text-xl font-bold mb-4">Device Authentication</h2>
                <AuthKeyManager />

            </div>

        </div>
    );
}

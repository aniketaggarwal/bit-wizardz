import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-4">
      <h1 className="text-4xl font-bold mb-8">Hotel Check-in System</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
        <Link href="/upload-id" className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center font-semibold transition-colors">
          1. Upload ID
        </Link>
        <Link href="/register-face" className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg text-center font-semibold transition-colors">
          2. Register Face
        </Link>
        <Link href="/checkin" className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-center font-semibold transition-colors">
          3. Check-in
        </Link>
        <Link href="/dashboard" className="px-6 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-center font-semibold transition-colors">
          Dashboard
        </Link>
      </div>
    </main>
  );
}

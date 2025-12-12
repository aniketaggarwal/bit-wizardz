export default function RegisterFacePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            <h1 className="text-2xl font-bold mb-4">Register Face</h1>
            <p className="mb-4 text-gray-600">Please look at the camera to register your face.</p>
            <div className="bg-black w-full max-w-md h-64 rounded-lg mb-4 flex items-center justify-center text-white">
                Camera Feed Placeholder
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Capture & Register
            </button>
        </div>
    );
}

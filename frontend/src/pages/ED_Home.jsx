import { Link } from 'react-router-dom';

export default function ED_Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Emotion Detection System
        </h1>
        <p className="text-gray-600 mb-8">
          Real-time emotional state monitoring for elderly well-being.
        </p>

        <div className="space-y-4">
          <Link
            to="/ed/monitor"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition"
          >
            👁️ Start Emotion Monitoring
          </Link>

          <Link
            to="/ed/dashboard"
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-medium"
          >
            👩‍⚕️ Caregiver Dashboard
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          🔒 Video processed locally — no data leaves this device.
        </p>
      </div>
    </div>
  );
}
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const MOCK_EMOTIONS = [
  { label: 'Happy', confidence: 0.92, color: '#4CAF50' },
  { label: 'Neutral', confidence: 0.85, color: '#9E9E9E' },
  { label: 'Sad', confidence: 0.78, color: '#FF9800' },
  { label: 'Pain', confidence: 0.88, color: '#F44336' },
  { label: 'Calm', confidence: 0.91, color: '#2196F3' },
];

export default function ED_Monitor() {
  const videoRef = useRef(null);
  const [currentEmotion, setCurrentEmotion] = useState(MOCK_EMOTIONS[0]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    let interval;
    if (isMonitoring) {
      interval = setInterval(() => {
        const random = MOCK_EMOTIONS[Math.floor(Math.random() * MOCK_EMOTIONS.length)];
        setCurrentEmotion(random);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsMonitoring(true);
    } catch (err) {
      alert('Camera access required. Please allow and retry.');
      console.error('Camera error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Real-Time Emotion Detection</h1>
          <Link to="/ed" className="text-blue-600 hover:underline">← Back</Link>
        </div>

        <div className="bg-gray-100 rounded-2xl p-4 md:p-6 shadow-sm">
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-6 flex items-center justify-center">
            {isMonitoring ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-white">
                <div className="text-5xl mb-2">📹</div>
                <p className="text-lg">Click below to start camera</p>
              </div>
            )}
          </div>

          <div className="text-center mb-6">
            <div
              className="inline-block px-6 py-3 rounded-full font-bold text-white text-xl"
              style={{ backgroundColor: currentEmotion.color }}
            >
              {currentEmotion.label} • {Math.round(currentEmotion.confidence * 100)}%
            </div>
            <p className="text-gray-500 mt-2">
              {isMonitoring ? 'Detecting emotions in real time…' : 'Start monitoring to begin'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isMonitoring ? (
              <button
                onClick={startCamera}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-xl font-semibold"
              >
                ▶️ Start Detection
              </button>
            ) : (
              <button
                onClick={() => setIsMonitoring(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-8 rounded-xl font-semibold"
              >
                ⏹️ Pause
              </button>
            )}

            <Link
              to="/ed/dashboard"
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 py-3 px-8 rounded-xl font-semibold text-center"
            >
              👩‍⚕️ View Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            ℹ️ Emotion Detection Module (ED) — Mock data for demo. Real inference will use trained model.
          </p>
        </div>
      </div>
    </div>
  );
}
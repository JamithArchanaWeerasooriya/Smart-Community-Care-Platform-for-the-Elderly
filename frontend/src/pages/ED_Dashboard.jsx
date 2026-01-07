import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const generateMockHistory = () => {
  const emotions = ['Happy', 'Neutral', 'Sad', 'Pain', 'Calm'];
  const colors = {
    Happy: '#4CAF50',
    Neutral: '#9E9E9E',
    Sad: '#FF9800',
    Pain: '#F44336',
    Calm: '#2196F3',
  };
  return Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    timestamp: new Date(Date.now() - i * 7200000).toLocaleString(),
    emotion: emotions[Math.floor(Math.random() * emotions.length)],
    confidence: (0.7 + Math.random() * 0.3).toFixed(2),
    color: colors[emotions[Math.floor(Math.random() * emotions.length)]],
  }));
};

export default function ED_Dashboard() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(generateMockHistory());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Caregiver — Emotion Dashboard</h1>
          <Link to="/ed" className="text-blue-600 hover:underline">← Back</Link>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Detection Summary (Last 24h)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Positive States</p>
              <p className="text-xl font-bold text-green-700">4</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Needs Attention</p>
              <p className="text-xl font-bold text-orange-700">2</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Detections</p>
              <p className="text-xl font-bold text-blue-700">{history.length}</p>
            </div>
          </div>
        </div>

        {/* Log Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b font-semibold bg-gray-50">Recent Emotion Detections</div>
          <div className="divide-y">
            {history.map((item) => (
              <div key={item.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-800">{item.timestamp}</div>
                </div>
                <div
                  className="px-4 py-1 rounded-full text-white font-medium text-sm"
                  style={{ backgroundColor: item.color }}
                >
                  {item.emotion} ({Math.round(item.confidence * 100)}%)
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 text-center">
            <Link
              to="/ed/monitor"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium"
            >
              ▶️ Live Detection
            </Link>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          🟦 ED Module — Emotion Detection | Data simulated for demo
        </div>
      </div>
    </div>
  );
}
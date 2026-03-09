/**
 * emotionApi.js
 * Helpers to persist emotion readings & sessions to the caregiver backend (MongoDB).
 * Import these in EmotionDashboard.jsx to enable persistence.
 */

const CAREGIVER_API = import.meta.env.VITE_CAREGIVER_API || 'http://localhost:3001/api';

/** Save a single emotion reading */
export async function saveReading({ emotion, confidence, sessionId, patientId, patientName }) {
  try {
    const res = await fetch(`${CAREGIVER_API}/emotions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emotion, confidence, sessionId, patientId, patientName }),
    });
    return await res.json();
  } catch (err) {
    console.warn('[emotionApi] saveReading failed:', err.message);
    return null;
  }
}

/** Start a session */
export async function startSession({ sessionId, patientId, patientName }) {
  try {
    const res = await fetch(`${CAREGIVER_API}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, patientId, patientName }),
    });
    return await res.json();
  } catch (err) {
    console.warn('[emotionApi] startSession failed:', err.message);
    return null;
  }
}

/** End a session */
export async function endSession({ sessionId, caregiverNotes = '' }) {
  try {
    const res = await fetch(`${CAREGIVER_API}/sessions/${sessionId}/end`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caregiverNotes }),
    });
    return await res.json();
  } catch (err) {
    console.warn('[emotionApi] endSession failed:', err.message);
    return null;
  }
}

/** Generate a unique session ID */
export function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

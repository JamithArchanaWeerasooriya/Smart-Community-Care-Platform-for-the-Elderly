const express = require("express");
const router  = express.Router();
const C = require("../controllers/CaregiverController");

// ── Emotion Readings ─────────────────────────────────────────
router.post  ("/emotions",           C.saveReading);
router.post  ("/emotions/batch",     C.saveReadingsBatch);
router.get   ("/emotions",           C.getReadings);
router.patch ("/emotions/:id/flag",  C.flagReading);
router.patch ("/emotions/:id/resolve", C.resolveReading);

// ── Sessions ─────────────────────────────────────────────────
router.post  ("/sessions",                    C.startSession);
router.patch ("/sessions/:sessionId/end",     C.endSession);
router.get   ("/sessions",                    C.getSessions);
router.get   ("/sessions/:sessionId",         C.getSession);

// ── Patients ─────────────────────────────────────────────────
router.post  ("/patients",               C.upsertPatient);
router.get   ("/patients",               C.getPatients);
router.get   ("/patients/:patientId",    C.getPatient);
router.patch ("/patients/:patientId",    C.updatePatient);

// ── Alerts ───────────────────────────────────────────────────
router.get   ("/alerts",           C.getAlerts);
router.post  ("/alerts",           C.createAlert);
router.patch ("/alerts/:id/resolve", C.resolveAlert);

// ── Caregiver Notes ──────────────────────────────────────────
router.post  ("/notes",      C.createNote);
router.get   ("/notes",      C.getNotes);
router.patch ("/notes/:id",  C.updateNote);
router.delete("/notes/:id",  C.deleteNote);

// ── Analytics ────────────────────────────────────────────────
router.get("/analytics/overview",              C.getOverview);
router.get("/analytics/patient/:patientId",    C.getPatientAnalytics);

module.exports = router;

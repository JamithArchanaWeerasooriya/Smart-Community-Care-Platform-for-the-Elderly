const mongoose = require("mongoose");

// ── Emotion Reading ──────────────────────────────────────────
const EmotionReadingSchema = new mongoose.Schema({
  patientId:   { type: String, required: true, index: true },
  patientName: { type: String, default: 'Unknown Patient' },
  emotion:     { type: String, required: true, enum: ['happy','neutral','sad','angry','fear','disgust','surprise'] },
  confidence:  { type: Number, min: 0, max: 100, default: null },
  sessionId:   { type: String, required: true, index: true },
  capturedAt:  { type: Date, default: Date.now, index: true },
  notes:       { type: String, default: '' },
  flagged:     { type: Boolean, default: false },
  resolved:    { type: Boolean, default: false },
}, { timestamps: true });

EmotionReadingSchema.index({ patientId: 1, capturedAt: -1 });

// ── Session ──────────────────────────────────────────────────
const SessionSchema = new mongoose.Schema({
  sessionId:         { type: String, required: true, unique: true },
  patientId:         { type: String, required: true, index: true },
  patientName:       { type: String, default: 'Unknown Patient' },
  startedAt:         { type: Date, default: Date.now },
  endedAt:           { type: Date, default: null },
  totalReadings:     { type: Number, default: 0 },
  dominantEmotion:   { type: String, default: null },
  positiveCount:     { type: Number, default: 0 },
  negativeCount:     { type: Number, default: 0 },
  averageConfidence: { type: Number, default: null },
  status:            { type: String, enum: ['active','ended'], default: 'active' },
  caregiverNotes:    { type: String, default: '' },
}, { timestamps: true });

// ── Patient ──────────────────────────────────────────────────
const PatientSchema = new mongoose.Schema({
  patientId:      { type: String, required: true, unique: true },
  name:           { type: String, required: true },
  age:            { type: Number, default: null },
  room:           { type: String, default: '' },
  condition:      { type: String, default: '' },
  photo:          { type: String, default: null },
  isActive:       { type: Boolean, default: true },
  caregivers:     [{ type: String }],
  notes:          { type: String, default: '' },
  alertThreshold: { type: Number, default: 3 },
}, { timestamps: true });

// ── Alert ────────────────────────────────────────────────────
const AlertSchema = new mongoose.Schema({
  patientId:    { type: String, required: true, index: true },
  patientName:  { type: String, default: '' },
  sessionId:    { type: String, default: null },
  type:         { type: String, enum: ['distress','prolonged_negative','dominant_fear','dominant_angry','manual'], default: 'distress' },
  severity:     { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  message:      { type: String, required: true },
  emotion:      { type: String, default: null },
  count:        { type: Number, default: 1 },
  resolved:     { type: Boolean, default: false },
  resolvedAt:   { type: Date, default: null },
  resolvedBy:   { type: String, default: null },
  resolvedNote: { type: String, default: '' },
  triggeredAt:  { type: Date, default: Date.now },
}, { timestamps: true });

// ── Caregiver Note ───────────────────────────────────────────
const CaregiverNoteSchema = new mongoose.Schema({
  patientId:   { type: String, required: true, index: true },
  sessionId:   { type: String, default: null },
  readingId:   { type: String, default: null },
  caregiverId: { type: String, default: 'default-caregiver' },
  note:        { type: String, required: true },
  priority:    { type: String, enum: ['normal','important','urgent'], default: 'normal' },
  pinned:      { type: Boolean, default: false },
}, { timestamps: true });

module.exports = {
  EmotionReading: mongoose.model('EmotionReading', EmotionReadingSchema),
  Session:        mongoose.model('Session',        SessionSchema),
  Patient:        mongoose.model('Patient',        PatientSchema),
  Alert:          mongoose.model('Alert',          AlertSchema),
  CaregiverNote:  mongoose.model('CaregiverNote',  CaregiverNoteSchema),
};

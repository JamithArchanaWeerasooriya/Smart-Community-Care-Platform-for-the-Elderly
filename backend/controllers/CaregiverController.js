const { EmotionReading, Session, Patient, Alert, CaregiverNote } = require("../models/EmotionModels");

// ────────────────────────────────────────────────────────────────
// EMOTION READINGS
// ────────────────────────────────────────────────────────────────

const saveReading = async (req, res) => {
    try {
        const { patientId, patientName, emotion, confidence, sessionId, notes } = req.body;

        const reading = await EmotionReading.create({
            patientId:   patientId || 'default-patient',
            patientName: patientName || 'Patient',
            emotion,
            confidence:  confidence ?? null,
            sessionId:   sessionId || 'default-session',
            notes:       notes || '',
            flagged:     ['sad','angry','fear','disgust'].includes(emotion) && (confidence || 0) > 70,
        });

        // Auto-create alert if 3+ distress readings in last 10 minutes
        if (['angry','fear'].includes(emotion) && (confidence || 0) > 75) {
            const recentDistress = await EmotionReading.countDocuments({
                patientId: reading.patientId,
                emotion: { $in: ['angry','fear','sad','disgust'] },
                capturedAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
            });
            if (recentDistress >= 3) {
                const existingAlert = await Alert.findOne({
                    patientId: reading.patientId,
                    sessionId,
                    resolved: false,
                    type: 'distress',
                });
                if (!existingAlert) {
                    await Alert.create({
                        patientId:   reading.patientId,
                        patientName: reading.patientName,
                        sessionId,
                        type:        'distress',
                        severity:    recentDistress >= 6 ? 'critical' : recentDistress >= 4 ? 'high' : 'medium',
                        message:     `${reading.patientName} has shown ${recentDistress} distress signals in the last 10 minutes.`,
                        emotion,
                        count:       recentDistress,
                    });
                }
            }
        }

        return res.json({ success: true, reading });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const saveReadingsBatch = async (req, res) => {
    try {
        const { readings } = req.body;
        if (!Array.isArray(readings) || readings.length === 0)
            return res.status(400).json({ error: 'readings array required' });

        const docs = await EmotionReading.insertMany(readings.map(r => ({
            patientId:   r.patientId || 'default-patient',
            patientName: r.patientName || 'Patient',
            emotion:     r.emotion,
            confidence:  r.confidence ?? null,
            sessionId:   r.sessionId || 'default-session',
            notes:       r.notes || '',
        })));

        return res.json({ success: true, saved: docs.length });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const getReadings = async (req, res) => {
    try {
        const { patientId, sessionId, emotion, from, to, page = 1, limit = 50, flagged } = req.query;
        const filter = {};
        if (patientId)      filter.patientId = patientId;
        if (sessionId)      filter.sessionId = sessionId;
        if (emotion)        filter.emotion = emotion;
        if (flagged === 'true') filter.flagged = true;
        if (from || to) {
            filter.capturedAt = {};
            if (from) filter.capturedAt.$gte = new Date(from);
            if (to)   filter.capturedAt.$lte = new Date(to);
        }

        const total    = await EmotionReading.countDocuments(filter);
        const readings = await EmotionReading.find(filter)
            .sort({ capturedAt: -1 })
            .skip((+page - 1) * +limit)
            .limit(+limit);

        return res.json({ success: true, total, page: +page, readings });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const flagReading = async (req, res) => {
    try {
        const r = await EmotionReading.findByIdAndUpdate(
            req.params.id,
            { flagged: req.body.flagged, notes: req.body.notes || '' },
            { new: true }
        );
        return res.json({ success: true, reading: r });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const resolveReading = async (req, res) => {
    try {
        const r = await EmotionReading.findByIdAndUpdate(
            req.params.id,
            { resolved: true },
            { new: true }
        );
        return res.json({ success: true, reading: r });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ────────────────────────────────────────────────────────────────
// SESSIONS
// ────────────────────────────────────────────────────────────────

const startSession = async (req, res) => {
    try {
        const { sessionId, patientId, patientName } = req.body;
        const session = await Session.findOneAndUpdate(
            { sessionId },
            { sessionId, patientId: patientId || 'default-patient', patientName: patientName || 'Patient', status: 'active' },
            { upsert: true, new: true }
        );
        return res.json({ success: true, session });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const endSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const readings = await EmotionReading.find({ sessionId });

        const counts = {};
        let totalConf = 0, confCount = 0;
        readings.forEach(r => {
            counts[r.emotion] = (counts[r.emotion] || 0) + 1;
            if (r.confidence != null) { totalConf += r.confidence; confCount++; }
        });

        const dominant = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;
        const positive = readings.filter(r => ['happy','surprise','neutral'].includes(r.emotion)).length;
        const negative = readings.filter(r => ['sad','angry','fear','disgust'].includes(r.emotion)).length;
        const avgConf  = confCount ? +(totalConf / confCount).toFixed(1) : null;

        const session = await Session.findOneAndUpdate(
            { sessionId },
            {
                endedAt:           new Date(),
                status:            'ended',
                totalReadings:     readings.length,
                dominantEmotion:   dominant,
                positiveCount:     positive,
                negativeCount:     negative,
                averageConfidence: avgConf,
                caregiverNotes:    req.body.caregiverNotes || '',
            },
            { new: true }
        );
        return res.json({ success: true, session });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const getSessions = async (req, res) => {
    try {
        const { patientId, status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (patientId) filter.patientId = patientId;
        if (status)    filter.status = status;

        const total    = await Session.countDocuments(filter);
        const sessions = await Session.find(filter)
            .sort({ startedAt: -1 })
            .skip((+page - 1) * +limit)
            .limit(+limit);

        return res.json({ success: true, total, sessions });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const getSession = async (req, res) => {
    try {
        const session = await Session.findOne({ sessionId: req.params.sessionId });
        if (!session) return res.status(404).json({ error: 'Not found' });
        return res.json({ success: true, session });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ────────────────────────────────────────────────────────────────
// PATIENTS
// ────────────────────────────────────────────────────────────────

const upsertPatient = async (req, res) => {
    try {
        const patient = await Patient.findOneAndUpdate(
            { patientId: req.body.patientId },
            req.body,
            { upsert: true, new: true }
        );
        return res.json({ success: true, patient });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const getPatients = async (req, res) => {
    try {
        const patients = await Patient.find({ isActive: true }).sort({ name: 1 });
        return res.json({ success: true, patients });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const getPatient = async (req, res) => {
    try {
        const patient = await Patient.findOne({ patientId: req.params.patientId });
        if (!patient) return res.status(404).json({ error: 'Not found' });
        return res.json({ success: true, patient });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const updatePatient = async (req, res) => {
    try {
        const patient = await Patient.findOneAndUpdate(
            { patientId: req.params.patientId },
            req.body,
            { new: true }
        );
        return res.json({ success: true, patient });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ────────────────────────────────────────────────────────────────
// ALERTS
// ────────────────────────────────────────────────────────────────

const getAlerts = async (req, res) => {
    try {
        const { patientId, resolved, severity, page = 1, limit = 30 } = req.query;
        const filter = {};
        if (patientId)            filter.patientId = patientId;
        if (resolved === 'true')  filter.resolved = true;
        if (resolved === 'false') filter.resolved = false;
        if (severity)             filter.severity = severity;

        const total  = await Alert.countDocuments(filter);
        const alerts = await Alert.find(filter)
            .sort({ triggeredAt: -1 })
            .skip((+page - 1) * +limit)
            .limit(+limit);

        return res.json({ success: true, total, alerts });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const createAlert = async (req, res) => {
    try {
        const alert = await Alert.create({ ...req.body, type: req.body.type || 'manual' });
        return res.json({ success: true, alert });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const resolveAlert = async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            {
                resolved:     true,
                resolvedAt:   new Date(),
                resolvedBy:   req.body.resolvedBy || 'caregiver',
                resolvedNote: req.body.note || '',
            },
            { new: true }
        );
        return res.json({ success: true, alert });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ────────────────────────────────────────────────────────────────
// CAREGIVER NOTES
// ────────────────────────────────────────────────────────────────

const createNote = async (req, res) => {
    try {
        const note = await CaregiverNote.create(req.body);
        return res.json({ success: true, note });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const getNotes = async (req, res) => {
    try {
        const { patientId, sessionId, pinned, page = 1, limit = 30 } = req.query;
        const filter = {};
        if (patientId)         filter.patientId = patientId;
        if (sessionId)         filter.sessionId = sessionId;
        if (pinned === 'true') filter.pinned = true;

        const total = await CaregiverNote.countDocuments(filter);
        const notes = await CaregiverNote.find(filter)
            .sort({ pinned: -1, createdAt: -1 })
            .skip((+page - 1) * +limit)
            .limit(+limit);

        return res.json({ success: true, total, notes });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const updateNote = async (req, res) => {
    try {
        const note = await CaregiverNote.findByIdAndUpdate(req.params.id, req.body, { new: true });
        return res.json({ success: true, note });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const deleteNote = async (req, res) => {
    try {
        await CaregiverNote.findByIdAndDelete(req.params.id);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ────────────────────────────────────────────────────────────────
// ANALYTICS
// ────────────────────────────────────────────────────────────────

const getPatientAnalytics = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { days = 7 } = req.query;
        const since = new Date(Date.now() - +days * 24 * 60 * 60 * 1000);

        const readings = await EmotionReading.find({ patientId, capturedAt: { $gte: since } });
        const sessions = await Session.find({ patientId, startedAt: { $gte: since } });
        const alerts   = await Alert.find({ patientId, triggeredAt: { $gte: since } });

        const emotionCounts = {};
        let totalConf = 0, confCount = 0;
        const dailyMap = {};

        readings.forEach(r => {
            emotionCounts[r.emotion] = (emotionCounts[r.emotion] || 0) + 1;
            if (r.confidence != null) { totalConf += r.confidence; confCount++; }
            const day = r.capturedAt.toISOString().slice(0, 10);
            if (!dailyMap[day]) dailyMap[day] = { date: day, positive: 0, negative: 0, total: 0 };
            dailyMap[day].total++;
            if (['happy','surprise','neutral'].includes(r.emotion)) dailyMap[day].positive++;
            else dailyMap[day].negative++;
        });

        const positive      = readings.filter(r => ['happy','surprise','neutral'].includes(r.emotion)).length;
        const negative      = readings.filter(r => ['sad','angry','fear','disgust'].includes(r.emotion)).length;
        const dominant      = Object.entries(emotionCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;
        const wellnessScore = readings.length ? Math.round((positive / readings.length) * 100) : null;
        const avgConf       = confCount ? +(totalConf / confCount).toFixed(1) : null;

        const last24h  = readings.filter(r => r.capturedAt >= new Date(Date.now() - 24*60*60*1000));
        const prev24h  = readings.filter(r => {
            const t = r.capturedAt.getTime();
            return t >= Date.now() - 48*60*60*1000 && t < Date.now() - 24*60*60*1000;
        });
        const lastScore = last24h.length  ? last24h.filter(r=>['happy','surprise','neutral'].includes(r.emotion)).length / last24h.length : null;
        const prevScore = prev24h.length  ? prev24h.filter(r=>['happy','surprise','neutral'].includes(r.emotion)).length / prev24h.length : null;
        const trend = lastScore == null || prevScore == null ? 'neutral'
                    : lastScore > prevScore + 0.05 ? 'improving'
                    : lastScore < prevScore - 0.05 ? 'declining' : 'stable';

        return res.json({
            success: true,
            summary: {
                totalReadings: readings.length,
                totalSessions: sessions.length,
                totalAlerts:   alerts.length,
                unresolvedAlerts: alerts.filter(a=>!a.resolved).length,
                positive, negative, dominant, wellnessScore, avgConf, trend,
            },
            emotionCounts,
            dailyTrend:   Object.values(dailyMap).sort((a,b)=>a.date.localeCompare(b.date)),
            recentAlerts: alerts.slice(0, 5),
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const getOverview = async (req, res) => {
    try {
        const { days = 1 } = req.query;
        const since = new Date(Date.now() - +days * 24 * 60 * 60 * 1000);

        const [totalReadings, totalSessions, unresolvedAlerts, totalPatients, distressReadings] = await Promise.all([
            EmotionReading.countDocuments({ capturedAt: { $gte: since } }),
            Session.countDocuments({ startedAt: { $gte: since } }),
            Alert.countDocuments({ resolved: false }),
            Patient.countDocuments({ isActive: true }),
            EmotionReading.countDocuments({ capturedAt: { $gte: since }, emotion: { $in: ['angry','fear','sad','disgust'] } }),
        ]);

        return res.json({ success: true, totalReadings, totalSessions, unresolvedAlerts, totalPatients, distressReadings });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    // readings
    saveReading, saveReadingsBatch, getReadings, flagReading, resolveReading,
    // sessions
    startSession, endSession, getSessions, getSession,
    // patients
    upsertPatient, getPatients, getPatient, updatePatient,
    // alerts
    getAlerts, createAlert, resolveAlert,
    // notes
    createNote, getNotes, updateNote, deleteNote,
    // analytics
    getPatientAnalytics, getOverview,
};

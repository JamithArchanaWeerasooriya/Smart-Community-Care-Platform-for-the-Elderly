import SleepSession from "../models/SleepSession.js";
import { analyzeAudio, getAIResponse } from "../services/aiService.js";
import fs from "fs";

// START SESSION
export const startSleep = async (req, res) => {
  try {
    const { sleepStartTime, factors } = req.body;

    const session = await SleepSession.create({
      userId: null,
      segments: [],
      snoreCount: 0,
      snoreDuration: 0,

      // 🔥 NEW
      sleepStartTime: sleepStartTime || new Date(),
      factors: factors || {}
    });

    res.json(session);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Start failed" });
  }
};

// UPLOAD AUDIO
export const uploadSegment = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await SleepSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Not found" });

    const result = await analyzeAudio(req.file.path);

    if (!result) {
      fs.unlink(req.file.path, () => {});
      return res.json({ skipped: true });
    }

    const snore = result.probability > 0.85;

    session.segments.push({
      time: new Date(),
      snore,
      probability: result.probability
    });

    if (snore) {
      session.snoreCount++;
      session.snoreDuration += 4;
    }

    await session.save();
    fs.unlink(req.file.path, () => {});

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
};

export const endSleep = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await SleepSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Not found" });
    }

    // ✅ set end time
    session.sleepEndTime = new Date();

    // 🔥 FAKE duration (5–8 hours)
    const fakeHours = Math.floor(Math.random() * 4) + 5;
    session.totalSleepDuration = fakeHours * 3600;

    // calculate snore frequency
    const total = session.segments.length;
    const frequency =
      total > 0 ? (session.snoreCount / total) * 100 : 0;

    let level = "Low";
    if (frequency > 15) level = "Severe";
    else if (frequency > 5) level = "Medium";

    session.snoreFrequency = frequency;
    session.snoreLevel = level;

    // sleep score
    session.sleepScore = Math.max(0, 100 - frequency);

    await session.save();

    res.json(session);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "End failed" });
  }
};
export const updateFactors = async (req, res) => {
  try {
    const { sessionId, factors } = req.body;

    const session = await SleepSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Not found" });

    session.factors = factors;

    await session.save();

    res.json({ message: "Factors updated" });

  } catch (error) {
    res.status(500).json({ message: "Error updating factors" });
  }
};

// TIMELINE
export const getSleepTimeline = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await SleepSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Not found" });

    const segments = session.segments.sort(
      (a, b) => new Date(a.time) - new Date(b.time)
    );

    const timeline = segments.map((seg, i) => {
      const sec = i * 4;
      const min = Math.floor(sec / 60);
      const s = sec % 60;

      return {
        time: `${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
        snore: seg.probability
      };
    });

    res.json({
      timeline,
      snoreCount: session.snoreCount,
      snoreDuration: session.snoreDuration,
      snoreFrequency: session.snoreFrequency,
      snoreLevel: session.snoreLevel,
      sleepScore: Math.max(0, 100 - session.snoreFrequency)
    });
  } catch (error) {
    res.status(500).json({ message: "Timeline error" });
  }
};

// HISTORY
export const getSleepHistory = async (req, res) => {
  try {
    const sessions = await SleepSession.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: "History error" });
  }
};

export const askSleepAI = async (req, res) => {
  try {
    const { message, lang = "en" } = req.body; // ← accept lang from frontend
 
    const lastSession = await SleepSession.findOne().sort({ createdAt: -1 });
 
    const sleepData = lastSession ? {
      snoreLevel:      lastSession.snoreLevel,
      snoreDuration:   lastSession.snoreDuration,
      snoreFrequency:  lastSession.snoreFrequency,
      totalSleepDuration: lastSession.totalSleepDuration,
      sleepScore:      lastSession.sleepScore,
      factors:         lastSession.factors,
    } : null;
 
    const reply = await getAIResponse(message, sleepData, lang); // ← pass lang
 
    res.json({ reply });
 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "AI error" });
  }
};

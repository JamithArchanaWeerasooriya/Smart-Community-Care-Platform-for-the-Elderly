const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  startSleep,
  uploadSegment,
  endSleep,
  getSleepTimeline,
  getSleepHistory,
  askSleepAI
} = require("../controllers/sleepController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname || ".wav"))
});

const upload = multer({ storage });

router.post("/start", startSleep);
router.post("/segment", upload.single("audio"), uploadSegment);
router.post("/end", endSleep);
router.get("/timeline/:sessionId", getSleepTimeline);
router.get("/history", getSleepHistory);
router.post("/chat", askSleepAI);

module.exports = router;
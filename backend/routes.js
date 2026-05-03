const express = require("express");
const router = express.Router();
const reminderRoutes = require("./routes/ReminderRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
const caregiverRoutes = require("./routes/caregiverRoutes");
const sleepRoutes = require("./routes/sleepRoutes");
const reportRoutes = require("./routes/reportRoutes");

//Register your all routes here
router.use("/reminder",reminderRoutes);
router.use("/voice",voiceRoutes);
router.use("/caregiver", caregiverRoutes);
router.use("/sleep", sleepRoutes);
router.use("/uploads", express.static("uploads"));
router.use("/ai-sleep", sleepRoutes);
router.use("/report", reportRoutes);

module.exports = router;
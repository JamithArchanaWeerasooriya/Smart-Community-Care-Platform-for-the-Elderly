const express = require("express");
const router = express.Router();
const reminderRoutes = require("./routes/ReminderRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
const caregiverRoutes = require("./routes/caregiverRoutes");

//Register your all routes here
router.use("/reminder",reminderRoutes);
router.use("/voice",voiceRoutes);
router.use("/caregiver", caregiverRoutes);

module.exports = router;
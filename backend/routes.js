const express = require("express");
const router = express.Router();
const reminderRoutes = require("./routes/ReminderRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
const sleepRoutes = require("./routes/sleepRoutes");

//Register your all routes here
router.use("/reminder",reminderRoutes);
router.use("/voice",voiceRoutes);
router.use("/sleep", sleepRoutes);
router.use("/uploads", express.static("uploads"));
router.use("/ai-sleep", sleepRoutes);

module.exports = router;
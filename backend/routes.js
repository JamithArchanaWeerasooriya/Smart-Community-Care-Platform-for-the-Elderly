const express = require("express");
const router = express.Router();
const reminderRoutes = require("./routes/ReminderRoutes");
const voiceRoutes = require("./routes/voiceRoutes");

//Register your all routes here
router.use("/reminder",reminderRoutes);
router.use("/voice",voiceRoutes);

module.exports = router;
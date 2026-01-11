const express = require("express");
const router = express.Router();
const { executeVoiceCommand } = require("../controllers/VoiceController");

router.post("/execute", executeVoiceCommand);

module.exports = router;
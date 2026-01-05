const express = require("express");
const router = express.Router();
const ReminderController = require("../controllers/ReminderController");

// Use only POST for all operations
router.post("/create", ReminderController.create);
router.post("/list", ReminderController.list);
router.post("/get", ReminderController.get);
router.post("/update", ReminderController.update);
router.post("/delete", ReminderController.remove);

// Actions
router.post("/complete", ReminderController.complete);
router.post("/snooze", ReminderController.snooze);
router.post("/due", ReminderController.due);

module.exports = router;
const express = require("express");
const { getWeeklyReport,getMonthlyReport } = require("../controllers/reportController");

const router = express.Router();

router.get("/weekly", getWeeklyReport);
router.get("/monthly", getMonthlyReport);

module.exports = router;
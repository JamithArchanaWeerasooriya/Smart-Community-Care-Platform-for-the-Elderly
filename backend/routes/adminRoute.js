const express = require("express");
const router = express.Router();
const {
  registerDevice,
  createCaretaker,
  getDevices,
  getCaretakers,
  updateCaretaker,
  deleteCaretaker,
  getAllCaretakers,
  addElderToCaretaker,
  removeElderFromCaretaker,
  getCaretakerElders
} = require("../controllers/adminController");

router.post("/device", registerDevice);
router.post("/caretaker", createCaretaker);
router.get("/devices", getDevices);
router.get("/caretakers", getCaretakers);
router.put("/caretaker/:id", updateCaretaker);
router.delete("/caretaker/:id", deleteCaretaker);
router.get("/caretakers/all", getAllCaretakers);
router.post("/caretaker/:id/elder", addElderToCaretaker);
router.delete("/caretaker/:caretakerId/elder/:elderId", removeElderFromCaretaker);
router.get("/caretaker/:id/elders", getCaretakerElders);

module.exports = router;
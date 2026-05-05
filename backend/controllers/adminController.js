const DeviceMaster = require("../models/DeviceMaster");
const CareTable = require("../models/CareTable");

// ================= REGISTER DEVICE =================
exports.registerDevice = async (req, res) => {
  try {
    const { deviceId } = req.body;
    const existing = await DeviceMaster.findOne({ deviceId });
    if (existing) {
      return res.status(400).json({ message: "Device already exists" });
    }
    const device = new DeviceMaster({ deviceId });
    await device.save();
    res.json({ message: "Device Registered Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= CREATE CARETAKER =================
exports.createCaretaker = async (req, res) => {
  try {
    const { name, username, elders } = req.body;
    const userExists = await CareTable.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const caretaker = new CareTable({
      name,
      username,
      elders: elders || []
    });
    await caretaker.save();
    res.json({ message: "Caretaker Created Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET DEVICES =================
exports.getDevices = async (req, res) => {
  try {
    const devices = await DeviceMaster.find();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET CARETAKERS =================
exports.getCaretakers = async (req, res) => {
  try {
    const caretakers = await CareTable.find().select("-password");
    res.json(caretakers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE CARETAKER =================
exports.updateCaretaker = async (req, res) => {
  try {
    const { name, elders } = req.body;
    await CareTable.findByIdAndUpdate(req.params.id, { name, elders }, { new: true });
    res.json({ message: "Caretaker Updated Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= DELETE CARETAKER =================
exports.deleteCaretaker = async (req, res) => {
  try {
    await CareTable.findByIdAndDelete(req.params.id);
    res.json({ message: "Caretaker Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET ALL CARETAKERS =================
exports.getAllCaretakers = async (req, res) => {
  try {
    const caretakers = await CareTable.find().select("-password");
    res.json(caretakers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= ADD ELDER TO CARETAKER =================
exports.addElderToCaretaker = async (req, res) => {
  try {
    const { elderName, deviceId } = req.body;
    const { id } = req.params;
    const caretaker = await CareTable.findById(id);
    if (!caretaker) {
      return res.status(404).json({ message: "Caretaker not found" });
    }
    const elderExists = caretaker.elders.some(e => e.deviceId === deviceId);
    if (elderExists) {
      return res.status(400).json({ message: "Elder already assigned to this caretaker" });
    }
    caretaker.elders.push({ elderName, deviceId });
    await caretaker.save();
    res.json({ message: "Elder added successfully", elders: caretaker.elders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= REMOVE ELDER FROM CARETAKER =================
exports.removeElderFromCaretaker = async (req, res) => {
  try {
    const { caretakerId, elderId } = req.params;
    const caretaker = await CareTable.findById(caretakerId);
    if (!caretaker) {
      return res.status(404).json({ message: "Caretaker not found" });
    }
    caretaker.elders = caretaker.elders.filter(e => e._id.toString() !== elderId);
    await caretaker.save();
    res.json({ message: "Elder removed successfully", elders: caretaker.elders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET CARETAKER ELDERS =================
exports.getCaretakerElders = async (req, res) => {
  try {
    const { id } = req.params;
    const caretaker = await CareTable.findById(id).select("elders");
    if (!caretaker) {
      return res.status(404).json({ message: "Caretaker not found" });
    }
    res.json(caretaker.elders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

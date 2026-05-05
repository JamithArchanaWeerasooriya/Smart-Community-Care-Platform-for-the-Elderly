const mongoose = require("mongoose");

const careSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  elders: [{
    elderName: { type: String, required: true },
    deviceId: { type: String, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model("CareTable", careSchema);

const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model("DeviceMaster", deviceSchema);
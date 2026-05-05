const mongoose = require("mongoose");

const sensordatas = new mongoose.Schema(
  {
    deviceId: String,
    ax: Number,
    ay: Number,
    az: Number,
    gx: Number,
    gy: Number,
    gz: Number,
    A: Number,
    fall: Boolean
  },
  { timestamps: true }
);

module.exports = mongoose.model("sensordatas", sensordatas);
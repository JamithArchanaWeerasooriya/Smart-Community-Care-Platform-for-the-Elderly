const mongoose = require("mongoose");

const sleepSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  segments: [
    {
      time: Date,
      snore: Boolean,
      probability: Number
    }
  ],

  snoreCount: {
    type: Number,
    default: 0
  },

  snoreDuration: {
    type: Number,
    default: 0
  },

  snoreFrequency: {
    type: Number,
    default: 0
  },

  snoreLevel: {
    type: String,
    default: "Low"
  },

  // 🔥 NEW FIELDS
  sleepStartTime: Date,
  sleepEndTime: Date,

  totalSleepDuration: {
    type: Number,
    default: 0
  },

  factors: {
    alcohol: { type: Boolean, default: false },
    coffee: { type: Boolean, default: false },
    tea: { type: Boolean, default: false },
    ateLate: { type: Boolean, default: false },
    workout: { type: Boolean, default: false },
    stress: { type: Boolean, default: false },
    custom: { type: [String], default: [] }
  },

  sleepScore: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model("SleepSession", sleepSessionSchema);
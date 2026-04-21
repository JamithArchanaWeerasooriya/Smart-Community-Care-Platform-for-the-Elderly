import mongoose from "mongoose";

const sleepSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  date: {
    type: Date,
    default: Date.now
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
  }

}, { timestamps: true });

export default mongoose.model("SleepSession", sleepSessionSchema);
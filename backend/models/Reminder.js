const mongoose = require("mongoose");

const ReminderSchema = new mongoose.Schema(
	{
		title: { type: String, required: true, trim: true },
		description: { type: String, default: "" },
		userId: { type: String, required: false },
		remindAt: { type: Date, required: true },
		channel: { type: String, enum: ["none", "email", "push"], default: "none" },
		completed: { type: Boolean, default: false },
		notified: { type: Boolean, default: false },
		lastNotifiedAt: { type: Date },
		next_trigger_at: { type: Date },
		repeat_time_period: {type: Number, default: 0},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Reminder", ReminderSchema);
const Reminder = require("../models/Reminder");
const { createResponse, createError } = require("../utils/responseUtil");

// Map legacy string repeat value to a period in ms
function mapRepeatToPeriod(repeat) {
    switch (repeat) {
        case "daily":
            return 24 * 60 * 60 * 1000; // 1 day
        case "weekly":
            return 7 * 24 * 60 * 60 * 1000; // 1 week
        case "monthly":
            return 30 * 24 * 60 * 60 * 1000; // approx. 1 month
        default:
            return 0;
    }
}

module.exports = {
    async create(req, res) {
        try {
            const { title, description, remindAt, userId, channel, repeat } = req.body;
            if (!title || !remindAt) {
                return res.status(200).json(createError("VALIDATION_ERROR", "title and remindAt are required"));
            }

            // Support both new repeat_time_period (ms) and legacy repeat string
            let repeat_time_period = 0;
            if (req.body.repeat_time_period && Number(req.body.repeat_time_period) > 0) {
                repeat_time_period = Number(req.body.repeat_time_period);
            } else if (repeat && repeat !== "none") {
                repeat_time_period = mapRepeatToPeriod(repeat);
            }

            let next_trigger_at = null;
            if (repeat_time_period > 0) {
                const base = new Date(remindAt);
                if (!Number.isNaN(base.getTime())) {
                    next_trigger_at = new Date(base.getTime() + repeat_time_period);
                }
            }

            const reminder = await Reminder.create({
                title,
                description,
                remindAt,
                userId,
                channel,
                next_trigger_at,
                repeat_time_period,
            });
            return res.status(200).json(createResponse(reminder));
        } catch (err) {
            return res.status(200).json(createError("CREATE_FAILED", err.message));
        }
    },

    async list(req, res) {
        try {
            const { userId } = req.query;
            const query = {};
            if (userId) query.userId = userId;

            // Normalize legacy data into next_trigger_at + repeat_time_period
            const reminders = await Reminder.find(query).sort({ remindAt: 1 });

            await Promise.all(
                reminders.map(async (reminder) => {
                    let changed = false;

                    // Backfill next_trigger_at so it always represents the *next* trigger time
                    if (reminder.repeat_time_period > 0) {
                        const base = new Date(reminder.remindAt);
                        if (!Number.isNaN(base.getTime())) {
                            reminder.next_trigger_at = new Date(base.getTime() + reminder.repeat_time_period);
                            changed = true;
                        }
                    }

                    if (changed) {
                        await reminder.save();
                    }
                })
            );

            return res.status(200).json(createResponse(reminders));
        } catch (err) {
            return res.status(200).json(createError("LIST_FAILED", err.message));
        }
    },

    async get(req, res) {
        try {
            const reminder = await Reminder.findById(req.params.id);
            if (!reminder) return res.status(200).json(createError("NOT_FOUND", "Not found"));
            return res.status(200).json(createResponse(reminder));
        } catch (err) {
            return res.status(200).json(createError("GET_FAILED", err.message));
        }
    },

    async update(req, res) {
        try {
            const { title, description, remindAt, channel, repeat, completed } = req.body;

            // Recompute repeat_time_period and next_trigger_at
            let repeat_time_period = 0;
            if (req.body.repeat_time_period && Number(req.body.repeat_time_period) > 0) {
                repeat_time_period = Number(req.body.repeat_time_period);
            } else if (repeat && repeat !== "none") {
                repeat_time_period = mapRepeatToPeriod(repeat);
            }

            let next_trigger_at = null;
            if (repeat_time_period > 0 && remindAt) {
                const base = new Date(remindAt);
                if (!Number.isNaN(base.getTime())) {
                    next_trigger_at = new Date(base.getTime() + repeat_time_period);
                }
            }

            const reminder = await Reminder.findByIdAndUpdate(
                req.params.id,
                { title, description, remindAt, channel, completed, repeat_time_period, next_trigger_at },
                { new: true, runValidators: true }
            );
            if (!reminder) return res.status(200).json(createError("NOT_FOUND", "Not found"));
            return res.status(200).json(createResponse(reminder));
        } catch (err) {
            return res.status(200).json(createError("UPDATE_FAILED", err.message));
        }
    },

    async remove(req, res) {
        try {
            const result = await Reminder.findByIdAndDelete(req.params.id);
            if (!result) return res.status(200).json(createError("NOT_FOUND", "Not found"));
            return res.status(200).json(createResponse({ ok: true }));
        } catch (err) {
            return res.status(200).json(createError("DELETE_FAILED", err.message));
        }
    },

    async complete(req, res) {
        try {
            const reminder = await Reminder.findByIdAndUpdate(
                req.params.id,
                { completed: true },
                { new: true }
            );
            if (!reminder) return res.status(200).json(createError("NOT_FOUND", "Not found"));
            return res.status(200).json(createResponse(reminder));
        } catch (err) {
            return res.status(200).json(createError("COMPLETE_FAILED", err.message));
        }
    },

    async snooze(req, res) {
        try {
            const { minutes = 10 } = req.body;
            const reminder = await Reminder.findById(req.params.id);
            if (!reminder) return res.status(200).json(createError("NOT_FOUND", "Not found"));
            const newTime = new Date(reminder.remindAt.getTime() + minutes * 60000);
            reminder.remindAt = newTime;
            // Keep the same repeat gap, so recompute next_trigger_at if repeating
            if (reminder.repeat_time_period && reminder.repeat_time_period > 0) {
                reminder.next_trigger_at = new Date(newTime.getTime() + reminder.repeat_time_period);
            }
            reminder.notified = false;
            await reminder.save();
            return res.status(200).json(createResponse(reminder));
        } catch (err) {
            return res.status(200).json(createError("SNOOZE_FAILED", err.message));
        }
    },

    async due(req, res) {
        try {
            const now = new Date();
            const TEN_MINUTES_MS = 1 * 60 * 1000; // 1 minute window
            const windowStart = new Date(now.getTime() - TEN_MINUTES_MS);

            // 0) Automatically delete expired one-time reminders:
            //    - already notified
            //    - non-repeating (repeat_time_period <= 0)
            //    - remindAt is older than the 1 minute window
            const expireCutoff = new Date(now.getTime() - TEN_MINUTES_MS);
            await Reminder.deleteMany({
                completed: false,
                notified: true,
                repeat_time_period: { $lte: 0 },
                remindAt: { $lt: expireCutoff },
            });

            // 1) Auto-handle reminders that are more than 1 minute past their remindAt
            const staleReminders = await Reminder.find({
                completed: false,
                notified: false,
                remindAt: { $lt: windowStart },
            });

            // Use the same safe repeat logic as markNotified
            await Promise.all(
                staleReminders.map((r) => module.exports.markNotified(r._id))
            );

            // 2) Return only reminders whose remindAt is within the last 1 minute window
            const due = await Reminder.find({
                completed: false,
                notified: false,
                remindAt: { $gte: windowStart, $lte: now },
            }).sort({ remindAt: 1 });

            return res.status(200).json(createResponse(due));
        } catch (err) {
            return res.status(200).json(createError("DUE_FAILED", err.message));
        }
    },

    async markNotified(id) {
        try {
            const reminder = await Reminder.findById(id);
            if (!reminder) return;

            const now = new Date();

            // Safe repeat logic:
            // - Prefer using current next_trigger_at as the new remindAt
            // - Fallback to remindAt if next_trigger_at is missing/invalid
            // - Compute a new next_trigger_at using repeat_time_period
            if (reminder.repeat_time_period && reminder.repeat_time_period > 0) {
                let baseTrigger = null;

                // Try to use existing next_trigger_at first
                if (reminder.next_trigger_at) {
                    const candidate = new Date(reminder.next_trigger_at);
                    if (!Number.isNaN(candidate.getTime())) {
                        baseTrigger = candidate;
                    }
                }

                // Fallback to current remindAt
                if (!baseTrigger && reminder.remindAt) {
                    const candidate = new Date(reminder.remindAt);
                    if (!Number.isNaN(candidate.getTime())) {
                        baseTrigger = candidate;
                    }
                }

                if (baseTrigger) {
                    const nextTrigger = new Date(baseTrigger.getTime() + reminder.repeat_time_period);

                    // Move the current "next" trigger into remindAt,
                    // and schedule the following one in next_trigger_at
                    reminder.remindAt = baseTrigger;
                    reminder.next_trigger_at = nextTrigger;
                    reminder.lastNotifiedAt = now;
                    // Keep notified = false so repeating reminders stay active
                    reminder.notified = false;
                    await reminder.save();
                    return;
                }
            }

            // No valid repeat info or bad dates: behave as one-time reminder
            await Reminder.findByIdAndUpdate(id, {
                notified: true,
                lastNotifiedAt: now,
            });
        } catch (err) {
            // swallow for scheduler; logging can be added later
        }
    },
};

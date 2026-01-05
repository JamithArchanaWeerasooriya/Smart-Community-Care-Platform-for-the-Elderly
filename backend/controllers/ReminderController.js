const Reminder = require("../models/Reminder");
const { createResponse, createError } = require("../utils/responseUtil");

module.exports = {
    async create(req, res) {
        try {
            const { title, description, remindAt, userId, channel, repeat } = req.body;
            if (!title || !remindAt) {
                return res.status(200).json(createError("VALIDATION_ERROR", "title and remindAt are required"));
            }
            const reminder = await Reminder.create({
                title,
                description,
                remindAt,
                userId,
                channel,
                repeat,
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
            const reminders = await Reminder.find(query).sort({ remindAt: 1 });
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
            const reminder = await Reminder.findByIdAndUpdate(
                req.params.id,
                { title, description, remindAt, channel, repeat, completed },
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
            const due = await Reminder.find({
                completed: false,
                notified: false,
                remindAt: { $lte: now },
            }).sort({ remindAt: 1 });
            return res.status(200).json(createResponse(due));
        } catch (err) {
            return res.status(200).json(createError("DUE_FAILED", err.message));
        }
    },

    async markNotified(id) {
        try {
            await Reminder.findByIdAndUpdate(id, {
                notified: true,
                lastNotifiedAt: new Date(),
            });
        } catch (err) {
            // swallow for scheduler; logging can be added later
        }
    },
};

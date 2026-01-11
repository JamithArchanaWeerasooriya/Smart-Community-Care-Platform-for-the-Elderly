const { createResponse, createError } = require("../utils/responseUtil");
const { exportDate } = require("./utils/DateUtils");
const { exportTime } = require("./utils/TimeUtils");
const Reminder = require("../models/Reminder");

const addReminder = async (req, res) => {

    const task = req.body.task;
    const date = req.body.date;
    const time = req.body.time;
    const timePeriod = req.body.time_period;

    if (!task || !time) {
        return res.status(200).json(createError("VALIDATION_ERROR", "Missing required fields: 'task', 'time', and 'time_period'."));
    }

    var exportDateValue = exportDate(date);
    var exportTimeValue = exportTime(exportDateValue, time, timePeriod);

    var reminderDate = null;
    var readableDate = null;
    if (exportTimeValue && exportDateValue) {
        console.log(exportTimeValue);
        console.log(exportDateValue);
        const local = new Date(`${exportDateValue}T${exportTimeValue}:00+05:30`);
        reminderDate = local.toISOString();
        readableDate = local.toString();
    } else {
        return res.status(200).json(createError("NOT_DATE_AND_TIME", "Could not parse a valid date and time from the voice input."));
    }

    try {
        const reminder = await Reminder.create({
            title: task,
            description: 'Reminder created by Voice Controller.',
            remindAt: reminderDate,
            userId: null,
            channel: null,
            repeat: null,
        });

        return res.status(200).json(createResponse({
            message: "Reminder created successfully",
            reminder: {
                id: reminder._id,
                title: reminder.title,
                remindAt: reminder.remindAt,
                readableDate,
            }
        }));
    } catch (err) {
        console.error("Error creating reminder", err);
        return res.status(200).json(createError("CREATE_ERROR", "Failed to create reminder."));
    }
}

const deleteReminder = async (req, res) => {

    const task = req.body.task;
    const date = req.body.date;
    const time = req.body.time;
    const timePeriod = req.body.time_period;
    const event = req.body.event;

    if (!event && !task && !time && !timePeriod) {
        return res.status(200).json(createError("VALIDATION_ERROR", "At least one of 'task' or ('date' + 'time' + 'time_period') or ('date' + 'event=all') must be provided."));
    }

    //handle event
    if (event) {

        const exportDateValue = exportDate(date);
        if (!exportDateValue) {
            return res.status(200).json(createError("NOT_DATE", "Could not parse a valid date from the voice input."));
        }

        // Delete all reminders for the given date (event === 'all')
        if (event === 'all') {
            try {
                const startLocal = new Date(`${exportDateValue}T00:00:00+05:30`);
                const endLocal = new Date(`${exportDateValue}T23:59:59+05:30`);
                const startISO = startLocal.toISOString();
                const endISO = endLocal.toISOString();

                const delResult = await Reminder.deleteMany({
                    remindAt: { $gte: startISO, $lte: endISO },
                });

                if (delResult.deletedCount === 0) {
                    return res.status(200).json(createError("NOT_FOUND", "No reminders found for the specified date."));
                }

                return res.status(200).json(createResponse({
                    message: "All reminders deleted successfully for date",
                    date: exportDateValue,
                    deletedCount: delResult.deletedCount,
                }));
            } catch (err) {
                console.error("Error deleting reminders for date", err);
                return res.status(200).json(createError("DELETE_ERROR", "Failed to delete reminders for the date."));
            }
        } else {
            return res.status(200).json(createError("VALIDATION_ERROR", "Unsupported or missing 'event'. Use event='all' to delete all reminders for the date."));
        }

    } else if (time) {

        var exportDateValue = exportDate(date);
        var exportTimeValue = exportTime(exportDateValue, time, timePeriod);

        var reminderDate = null;
        var readableDate = null;
        if (exportTimeValue && exportDateValue) {
            console.log(exportTimeValue);
            console.log(exportDateValue);
            const local = new Date(`${exportDateValue}T${exportTimeValue}:00+05:30`);
            reminderDate = local.toISOString();
            readableDate = local.toString();
        } else {
            return res.status(200).json(createError("NOT_DATE_AND_TIME", "Could not parse a valid date and time from the voice input."));
        }

        try {
            var result;
            if (task == null) {
                result = await Reminder.findOneAndDelete({
                    remindAt: reminderDate,
                });
            } else {
                result = await Reminder.findOneAndDelete({
                    title: task,
                    remindAt: reminderDate,
                });
            }

            if (!result) {
                return res.status(200).json(createError("NOT_FOUND", "No reminder matched the given criteria."));
            }

            return res.status(200).json(createResponse({
                message: "Reminder deleted successfully",
                deleted: {
                    id: result._id,
                    title: result.title,
                    remindAt: result.remindAt,
                },
            }));
        } catch (err) {
            console.error("Error deleting reminder", err);
            return res.status(200).json(createError("DELETE_ERROR", "Failed to delete reminder."));
        }

    } else {
        return res.status(200).json(createError("VALIDATION_ERROR", "Invalid parameters. Provide either ('date' + 'event=all') or ('date' + 'time' + 'time_period' [+ optional 'task'])."));
    }

}

module.exports = {
    addReminder,
    deleteReminder
};
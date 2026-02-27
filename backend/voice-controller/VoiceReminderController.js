const { createResponse, createError } = require("../utils/responseUtil");
const { exportDate } = require("./utils/DateUtils");
const { exportTime, jumpNextTime, exportIntervalTime } = require("./utils/TimeUtils");
const { getRepeatTimePeriod } = require("./utils/ReminderSupport");
const Reminder = require("../models/Reminder");

const addReminder = async (req, res) => {

    const event = req.body.event;
    const eventPeriod = req.body.event_period;
    const task = req.body.task;
    const date = req.body.date;
    const time = req.body.time;
    const timePeriod = req.body.time_period;
    const timeInterval = req.body.time_interval;

    if (!task) {
        return res.status(200).json(createResponse({
            missing: ['task']
        }));
    }

    var reminderDate = null;      // first trigger time (remindAt)
    var readableDate = null;
    var repeatTimePeriod = 0;     // interval in ms; >0 means repeating

    var exportTimeValue = exportTime(time, timePeriod);
    var exportDateValue = exportDate(date);
    
    //check event and set repeat if needed
    if (event) {
        if (event === "all") {
            // Daily repeating reminder at the given time
            repeatTimePeriod = getRepeatTimePeriod(event, eventPeriod);
        }else if(event === "hour" && timeInterval){
            // Repeating reminder every hour
            const intervalValue = exportIntervalTime(timeInterval);
            repeatTimePeriod = 3600000 * intervalValue; // Convert hours to milliseconds
        }
    }

    //check current date and time > reminder date and time
    const currentDateTime = new Date();
    const reminderDateTime = new Date(`${exportDateValue}T${exportTimeValue}:00+05:30`);
    if (!timeInterval && reminderDateTime <= currentDateTime) {
        exportTimeValue = jumpNextTime(exportTimeValue);
    }

    if (exportTimeValue && exportDateValue) {
        const local = new Date(`${exportDateValue}T${exportTimeValue}:00+05:30`);
        reminderDate = local.toISOString();
        readableDate = local.toString();
    } else {
        return res.status(200).json(createResponse({
            missing: ['date', 'time']
        }));
    }

    // Map to core reminder model semantics:
    // remindAt        - current trigger time
    // next_trigger_at - next trigger time (only if repeating)
    // repeat_time_period > 0 means this reminder repeats

    // Ensure we have a valid first trigger time
    if (!reminderDate) {
        return res.status(200).json(createResponse({
            missing: ['date', 'time']
        }));
    }

    let remindAt = reminderDate;
    let next_trigger_at = null;

    if (repeatTimePeriod > 0) {
        const base = new Date(reminderDate);
        if (!Number.isNaN(base.getTime())) {
            next_trigger_at = new Date(base.getTime() + repeatTimePeriod).toISOString();
        }
    }

    try {
        const reminder = await Reminder.create({
            title: task,
            description: 'Reminder created by Voice Controller.',
            userId: null,
            channel: null,
            remindAt,
            next_trigger_at,
            repeat_time_period: repeatTimePeriod,
        });

        return res.status(200).json(createResponse({
            task: "reminder_created",
            reminder: reminder
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
                    task: "reminder_deleted",
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
        var exportTimeValue = exportTime(time, timePeriod);

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
                task: "reminder_deleted",
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
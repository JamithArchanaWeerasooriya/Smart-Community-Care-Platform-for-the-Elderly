

function getRepeatTimePeriod(event, eventPeriod) {
    var repeat = 0;
    repeat = 86400000;

    if(eventPeriod) {
        if(eventPeriod.startsWith("සතිය")) {
            repeat = 604800000;
        }
    }

    return repeat;
}


module.exports = {
    getRepeatTimePeriod
}
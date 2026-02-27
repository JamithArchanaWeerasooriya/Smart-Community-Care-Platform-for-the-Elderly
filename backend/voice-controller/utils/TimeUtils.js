
function exportTime(time, timePeriod) {

    if (!time) {
        //if time null return current time same format
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    var timeSplit = time.split(" ");
    console.log(timeSplit);
    var hour = 0;
    var min = 0;

    const item1 = timeSplit[0];
    if (item1.startsWith("එකොලහ") || item1.startsWith("එකොළහ")) {
        hour = 11;
        if (item1.startsWith("එකොලහහමාර") || item1.startsWith("එකොළහහහමාර")) {
            min = 30;
        }
    } else if (item1.startsWith("දොලහ") || item1.startsWith("දොළහ")) {
        hour = 12;
        if (item1.startsWith("දොලහහමාර") || item1.startsWith("දොළහහමාර")) {
            min = 30;
        }
    } else if (item1.startsWith("එක")) {
        hour = 1;
        if (item1.startsWith("එකහමාර")) {
            min = 30;
        }
    } else if (item1.startsWith("දෙක")) {
        hour = 2;
        if (item1.startsWith("දෙකහමාර")) {
            min = 30;
        }
    } else if (item1.startsWith("තුන")) {
        hour = 3;
        if (item1.startsWith("තුනහමාර")) {
            min = 30;
        }
    } else if (item1.startsWith("හතර")) {
        hour = 4;
        if (item1.startsWith("හතරහමාර")) {
            min = 30;
        }
    } else if (item1.startsWith("පහ")) {
        hour = 5;
        if (item1.startsWith("පහහමාර")) {
            min = 30;
        }
    } else if (item1.startsWith("හය")) {
        hour = 6;
        if (item1.startsWith("හයහමාර")) {
            min = 30;
        }
    } else if (item1.startsWith("හත")) {
        hour = 7;
        if (item1.startsWith("හතහමාර")) {
            min = 30;
        }
    } else if (item1.startsWith("අට")) {
        hour = 8;
        if (item1.startsWith("අටහමාර")) {
            min = 30;
        }
    } else if (item1.startsWith("නවය") || item1.startsWith("නමය")) {
        hour = 9;
        if (item1.startsWith("නවයහමාර") || item1.startsWith("නමයහමාර")) {
            min = 30;
        }
    } else if (item1.startsWith("දහය")) {
        hour = 10;
        if (item1.startsWith("දහයහමාර")) {
            min = 30;
        }
    }

    if (timeSplit.length >= 2) {

        var item2 = timeSplit[1];
        if (timeSplit.length == 3) {
            if (timeSplit[1].startsWith("විනාඩි") || timeSplit[1].startsWith("මිනිත්තු")) {
                item2 = timeSplit[2];
            } else {
                item2 = item2 + timeSplit[2];
            }
        }

        if (item2.startsWith("දහය")) {
            min = 10;
        } else if (item2.startsWith("එකොලහ") || item2.startsWith("එකොළහ")) {
            min = 11;
        } else if (item2.startsWith("දොලහ") || item2.startsWith("දොළහ")) {
            min = 12;
        } else if (item2.startsWith("දහතුන")) {
            min = 13;
        } else if (item2.startsWith("දාහතර")) {
            min = 14;
        } else if (item2.startsWith("පහලව") || item2.startsWith("පහලොව") || item2.startsWith("පහළව") || item2.startsWith("පහළොව") || item2.startsWith("කාල")) {
            min = 15;
        } else if (item2.startsWith("දාසය")) {
            min = 16;
        } else if (item2.startsWith("දාහත")) {
            min = 17;
        } else if (item2.startsWith("දහඅට")) {
            min = 18;
        } else if (item2.startsWith("දහනවය")) {
            min = 19;
        } else if (item2.startsWith("විස්ස")) {
            min = 20;
        } else if (item2.startsWith("විසිඑක")) {
            min = 21;
        } else if (item2.startsWith("විසිදෙක")) {
            min = 22;
        } else if (item2.startsWith("විසිතුන")) {
            min = 23;
        } else if (item2.startsWith("විසිහතර")) {
            min = 24;
        } else if (item2.startsWith("විසිපහ")) {
            min = 25;
        } else if (item2.startsWith("විසිහය")) {
            min = 26;
        } else if (item2.startsWith("විසිහත")) {
            min = 27;
        } else if (item2.startsWith("විසිඅට")) {
            min = 28;
        } else if (item2.startsWith("විසිනවය") || item2.startsWith("විසිනමය")) {
            min = 29;
        } else if (item2.startsWith("තිහ") || item2.startsWith("හමාර")) {
            min = 30;
        } else if (item2.startsWith("තිස්එක")) {
            min = 31;
        } else if (item2.startsWith("තිස්දෙක")) {
            min = 32;
        } else if (item2.startsWith("තිස්තුන")) {
            min = 33;
        } else if (item2.startsWith("තිස්හතර")) {
            min = 34;
        } else if (item2.startsWith("තිස්පහ")) {
            min = 35;
        } else if (item2.startsWith("තිස්හය")) {
            min = 36;
        } else if (item2.startsWith("තිස්හත")) {
            min = 37;
        } else if (item2.startsWith("තිස්අට")) {
            min = 38;
        } else if (item2.startsWith("තිස්නවය") || item2.startsWith("තිස්නමය")) {
            min = 39;
        } else if (item2.startsWith("හතලිහ") || item2.startsWith("හතළිහ")) {
            min = 40;
        } else if (item2.startsWith("හතලිස්එක") || item2.startsWith("හතළිස්එක")) {
            min = 41;
        } else if (item2.startsWith("හතලිස්දෙක") || item2.startsWith("හතළිස්දෙක")) {
            min = 42;
        } else if (item2.startsWith("හතලිස්තුන") || item2.startsWith("හතළිස්තුන")) {
            min = 43;
        } else if (item2.startsWith("හතලිස්හතර") || item2.startsWith("හතළිස්හතර")) {
            min = 44;
        } else if (item2.startsWith("හතලිස්පහ") || item2.startsWith("හතළිස්පහ")) {
            min = 45;
        } else if (item2.startsWith("හතලිස්හය") || item2.startsWith("හතළිස්හය")) {
            min = 46;
        } else if (item2.startsWith("හතලිස්හත") || item2.startsWith("හතළිස්හත")) {
            min = 47;
        } else if (item2.startsWith("හතලිස්අට") || item2.startsWith("හතළිස්අට")) {
            min = 48;
        } else if (item2.startsWith("හතලිස්නමය") || item2.startsWith("හතලිස්නවය") || item2.startsWith("හතළිස්නමය") || item2.startsWith("හතළිස්නවය")) {
            min = 49;
        } else if (item2.startsWith("පනහ")) {
            min = 50;
        } else if (item2.startsWith("පනස්එක")) {
            min = 51;
        } else if (item2.startsWith("පනස්දෙක")) {
            min = 52;
        } else if (item2.startsWith("පනස්තුන")) {
            min = 53;
        } else if (item2.startsWith("පනස්හතර")) {
            min = 54;
        } else if (item2.startsWith("පනස්පහ")) {
            min = 55;
        } else if (item2.startsWith("පනස්හය")) {
            min = 56;
        } else if (item2.startsWith("පනස්හත")) {
            min = 57;
        } else if (item2.startsWith("පනස්අට")) {
            min = 58;
        } else if (item2.startsWith("පනස්නවය") || item2.startsWith("පනස්නමය")) {
            min = 59;
        } else if (item2.startsWith("එක")) {
            min = 1;
        } else if (item2.startsWith("දෙක")) {
            min = 2;
        } else if (item2.startsWith("තුන")) {
            min = 3;
        } else if (item2.startsWith("හතර")) {
            min = 4;
        } else if (item2.startsWith("පහ")) {
            min = 5;
        } else if (item2.startsWith("හය")) {
            min = 6;
        } else if (item2.startsWith("හත")) {
            min = 7;
        } else if (item2.startsWith("අට")) {
            min = 8;
        } else if (item2.startsWith("නවය") || item2.startsWith("නමය")) {
            min = 9;
        }
    }

    if (timePeriod) {
        if (timePeriod.startsWith("දවල්") || timePeriod.startsWith("දහවල්") ||
            timePeriod.startsWith("හවස") || timePeriod.startsWith("සවස") || timePeriod.startsWith("සන්ද්‍යා") ||
            timePeriod.startsWith("රෑ") || timePeriod.startsWith("රාත්‍රී")) {
            if (hour == 1) {
                hour = 13;
            } else if (hour == 2) {
                hour = 14;
            } else if (hour == 3) {
                hour = 15;
            } else if (hour == 4) {
                hour = 16;
            } else if (hour == 5) {
                hour = 17;
            } else if (hour == 6) {
                hour = 18;
            } else if (hour == 7) {
                hour = 19;
            } else if (hour == 8) {
                hour = 20;
            } else if (hour == 9) {
                hour = 21;
            } else if (hour == 10) {
                hour = 22;
            } else if (hour == 11) {
                hour = 23;
            } else if (hour == 12) {
                hour = 24;
            }
        }
    }

    if (hour == 0 && min == 0) {
        return null;
    }

    const to24hTimeString = (h24, m) => {
        const hh = String(h24 === 24 ? 0 : h24).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        return `${hh}:${mm}`;
    };
    const formatted = to24hTimeString(hour, min);
    console.log("Exported time:", formatted);
    return formatted;
}

function jumpNextTime(time) {
    //convert am time to pm time
    //time is always in HH:mm format
    //I want to jump to next possible time (if 16:30 then 04:30)
    var timeSplit = time.split(":");
    var hour = parseInt(timeSplit[0]);
    var min = parseInt(timeSplit[1]);
    hour = (hour + 12) % 24;

    const to24hTimeString = (h24, m) => {
        const hh = String(h24 === 24 ? 0 : h24).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        return `${hh}:${mm}`;
    };
    return to24hTimeString(hour, min);
}

function parseSinhalaNumberWord(word) {
    if (!word) {
        return null;
    }

    const normalized = word
        .toString()
        .trim()
        .replace(/\s+/g, "")
        .replace(/[^\u0D80-\u0DFF]/g, "");

    const map = [
        { value: 30, words: ["තිහ"] },
        { value: 29, words: ["විසිනවය", "විසිනමය"] },
        { value: 28, words: ["විසිඅට"] },
        { value: 27, words: ["විසිහත"] },
        { value: 26, words: ["විසිහය"] },
        { value: 25, words: ["විසිපහ"] },
        { value: 24, words: ["විසිහතර"] },
        { value: 23, words: ["විසිතුන"] },
        { value: 22, words: ["විසිදෙක"] },
        { value: 21, words: ["විසිඑක"] },
        { value: 20, words: ["විස්ස"] },
        { value: 19, words: ["දහනවය", "දහනමය"] },
        { value: 18, words: ["දහඅට"] },
        { value: 17, words: ["දාහත"] },
        { value: 16, words: ["දාසය"] },
        { value: 15, words: ["පහලව", "පහලොව", "පහළව", "පහළොව"] },
        { value: 14, words: ["දාහතර"] },
        { value: 13, words: ["දහතුන"] },
        { value: 12, words: ["දොලහ", "දොළහ"] },
        { value: 11, words: ["එකොලහ", "එකොළහ"] },
        { value: 10, words: ["දහය"] },
        { value: 9, words: ["නවය", "නමය"] },
        { value: 8, words: ["අට"] },
        { value: 7, words: ["හත"] },
        { value: 6, words: ["හය"] },
        { value: 5, words: ["පහ"] },
        { value: 4, words: ["හතර"] },
        { value: 3, words: ["තුන"] },
        { value: 2, words: ["දෙක"] },
        { value: 1, words: ["එක"] }
    ];

    for (const item of map) {
        if (item.words.some((w) => normalized === w || normalized.startsWith(w))) {
            return item.value;
        }
    }

    return null;
}

function exportIntervalTime(interval) {
    if (!interval || typeof interval !== "string") {
        return null;
    }

    const normalized = interval.trim().replace(/\s+/g, "");
    const fromPart = normalized.includes("ෙන්") ? normalized.split("ෙන්")[0] : normalized;

    const parsedFromPart = parseSinhalaNumberWord(fromPart);
    if (parsedFromPart !== null) {
        return parsedFromPart;
    }

    const firstToken = interval.trim().split(/\s+/)[0];
    return parseSinhalaNumberWord(firstToken);
}

module.exports = {
    exportTime,
    jumpNextTime,
    exportIntervalTime
};
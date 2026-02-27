function exportDate(date) {

    const dateResult = new Date();

    if (date) {
        const dateSplit = date.split(" ");
        console.log("______________________________")
        console.log("Date split count - " + dateSplit.length);
        for (let i = 0; i < dateSplit.length; i++) {
            console.log("Date split item " + i + " - " + dateSplit[i]);
        }
        console.log("______________________________")

        if (dateSplit.length == 1) {
            const item1 = dateSplit[0];
            if (item1.startsWith("හෙට")) {
                dateResult.setDate(dateResult.getDate() + 1);
            } else if (item1.startsWith("අනිද්ද")) {
                dateResult.setDate(dateResult.getDate() + 2);
            } else {
                //get date by using day name(e.g. සඳුදා, අඟහරුවාදා)
                const targetDate = getDateByDayName(item1);
                if (targetDate) {
                    dateResult.setFullYear(targetDate.getFullYear());
                    dateResult.setMonth(targetDate.getMonth());
                    dateResult.setDate(targetDate.getDate());
                } else {
                    //get date by using date words(e.g. පළ, දෙවෙ, තුන්)
                    const dateNumber = getDate(item1);
                    if (dateNumber != -1) {
                        dateResult.setDate(dateNumber);
                    }
                }
            }
        } else if (dateSplit.length == 2) {

            const item1 = dateSplit[0];
            const item2 = dateSplit[1];

            //check is item1 is number or not
            if (Number.isInteger(Number(item1))) {
                dateResult.setDate(Number(item1));
            } else {

                const monthIndex = getMonthByName(item1);
                if (monthIndex != -1) {
                    dateResult.setMonth(monthIndex);
                    if (Number.isInteger(Number(item2))) {
                        dateResult.setDate(parseInt(item2));
                    } else {
                        const dateNumber = getDate(item2);
                        dateResult.setDate(dateNumber);
                    }
                } else {
                    if (item2.startsWith("වෙනි") || item2.startsWith("වැනි")) {
                        const dateNumber = getDate(item1);
                        dateResult.setDate(dateNumber);
                    }else{
                        const dateNumber = getDate(item1+item2);
                        dateResult.setDate(dateNumber);
                    }
                }

            }

        } else if (dateSplit.length >= 3) {

            const item1 = dateSplit[0];
            const item2 = dateSplit[1];
            var item3 = dateSplit[2];
            if (dateSplit.length == 3) {
                if (item3.length > 2) {
                    const value = item3.substring(0, 1);
                    if (Number.isInteger(Number(value))) {
                        item3 = value;
                    }
                }
            } else if (dateSplit.length >= 4) {
                if (!Number.isInteger(Number(item3))) {
                    item3 = item3 + dateSplit[3];
                }
                if (dateSplit.length == 5) {
                    item3 = item3 + dateSplit[4];
                }
            }

            const monthIndex = getMonthByName(item1);
            if (monthIndex != -1) {
                dateResult.setMonth(monthIndex);
                if (!Number.isInteger(Number(item2))) {
                    const dateNumber = getDate(item2+item3);
                    dateResult.setDate(dateNumber);
                } else {
                    dateResult.setDate(parseInt(item2));
                }
            } else if (item1.startsWith("මේ") || item1.startsWith("ේ") || item1.startsWith("ලබන") || item1.startsWith("ඊළඟ") || item1.startsWith("ඊලඟ")) {
                if (item2.startsWith("සති") || item2.startsWith("සතිය") || item2.startsWith("සතියේ")) {
                    //handle week
                    const targetDate = getDateCurrentWeekByDayName(item3);
                    dateResult.setFullYear(targetDate.getFullYear());
                    dateResult.setMonth(targetDate.getMonth());

                    if (item1.startsWith("මේ") || item1.startsWith("ේ")) {
                        if (targetDate) {
                            dateResult.setDate(targetDate.getDate());
                        }
                    } else if (item1.startsWith("ලබන") || item1.startsWith("ඊළඟ") || item1.startsWith("ඊලඟ")) {
                        if (targetDate) {
                            dateResult.setDate(targetDate.getDate() + 7);
                        }
                    }
                } else {
                    //handle month
                    if (!item1.startsWith("මේ") && !item1.startsWith("ේ")) {
                        dateResult.setMonth(dateResult.getMonth() + 1);
                    }
                    //handle date
                    if (!Number.isInteger(Number(item3))) {
                        const dateNumber = getDate(item3);
                        dateResult.setDate(dateNumber);
                    } else {
                        dateResult.setDate(parseInt(item3));
                    }
                }
            } else if (item3.startsWith("වෙනි") || item3.startsWith("වැනි")) {
                const monthIndex = getMonthByName(item1);
                if (monthIndex != -1) {
                    dateResult.setMonth(monthIndex);
                    if (!Number.isInteger(Number(item2))) {
                        const dateNumber = getDate(item2);
                        dateResult.setDate(dateNumber);
                    } else {
                        dateResult.setDate(parseInt(item2));
                    }
                } else {
                    const dateNumber = getDate(item1 + item2);
                    dateResult.setDate(dateNumber);
                }
            }

        }
    }


    const year = dateResult.getFullYear();
    const month = String(dateResult.getMonth() + 1).padStart(2, "0");
    const d = String(dateResult.getDate()).padStart(2, "0");
    const result = `${year}-${month}-${d}`

    console.log("Exported date - " + result);
    return result;
}

function getMonthByName(monthName) {
    if (monthName.startsWith("ජනවාරි")) {
        return 0;
    } else if (monthName.startsWith("පෙබරවාරි")) {
        return 1;
    } else if (monthName.startsWith("මාර්තු")) {
        return 2;
    } else if (monthName.startsWith("අප්‍රේල්")) {
        return 3;
    } else if (monthName.startsWith("මැයි")) {
        return 4;
    } else if (monthName.startsWith("ජූනි") || monthName.startsWith("ජුනි")) {
        return 5;
    } else if (monthName.startsWith("ජූලි") || monthName.startsWith("ජුලි")) {
        return 6;
    } else if (monthName.startsWith("අගෝස්තු")) {
        return 7;
    } else if (monthName.startsWith("සැප්තැම්බර්")) {
        return 8;
    } else if (monthName.startsWith("ඔක්තෝබර්")) {
        return 9;
    } else if (monthName.startsWith("නොවැම්බර්")) {
        return 10;
    } else if (monthName.startsWith("දෙසැම්බර්")) {
        return 11;
    }

    return -1;
}

function getDateByDayName(dayName) {
    const daysOfWeek = ["ඉරිදා", "සඳුදා", "අඟහරුවාදා", "බදාදා", "බ්‍රහස්පතින්දා", "සිකුරාදා", "සෙනසුරාදා"];
    const today = new Date();
    const todayDayIndex = today.getDay(); // 0 (Sunday) to 6 (Saturday)

    let targetDayIndex = -1;
    for (let i = 0; i < daysOfWeek.length; i++) {
        if (dayName.startsWith(daysOfWeek[i])) {
            targetDayIndex = i;
            break;
        }
    }

    if (targetDayIndex === -1) {
        return null; // Invalid day name
    }
    let daysUntilTarget = targetDayIndex - todayDayIndex;
    if (daysUntilTarget <= 0) {
        daysUntilTarget += 7; // Move to the next week
    }
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + daysUntilTarget);
    return targetDate;
}

function getDateCurrentWeekByDayName(dayName) {
    const daysOfWeek = ["ඉරිදා", "සඳුදා", "අඟහරුවාදා", "බදාදා", "බ්‍රහස්පතින්දා", "සිකුරාදා", "සෙනසුරාදා"];
    const today = new Date();
    const todayDayIndex = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const targetDayIndex = daysOfWeek.indexOf(dayName);
    if (targetDayIndex === -1) {
        return null; // Invalid day name
    }
    let daysUntilTarget = targetDayIndex - todayDayIndex;
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + daysUntilTarget);
    return targetDate;
}

function getDate(value) {
    if (value.startsWith("එකොලොස්") || value.startsWith("එකොළොස්")) {
        return 11;
    } else if (value.startsWith("දොලොස්") || value.startsWith("දොළොස්") || value.startsWith("දොළහ") || value.startsWith("දොලහ")) {
        return 12;
    } else if (value.startsWith("දහතුන්") || value.startsWith("දහතුන")) {
        return 13;
    } else if (value.startsWith("දාහතර")) {
        return 14;
    } else if (value.startsWith("පහලොස්") || value.startsWith("පහලව") || value.startsWith("පහළොස්") || value.startsWith("පහළව")) {
        return 15;
    } else if (value.startsWith("දාසය")) {
        return 16;
    } else if (value.startsWith("දාහත්") || value.startsWith("දාහත")) {
        return 17;
    } else if (value.startsWith("දහඅට")) {
        return 18;
    } else if (value.startsWith("දහනව") || value.startsWith("දහනම")) {
        return 19;
    } else if (value.startsWith("විසිඑක")) {
        return 21;
    } else if (value.startsWith("විසිදෙවෙනි") || value.startsWith("විසිදෙක")) {
        return 22;
    } else if (value.startsWith("විසිතුන්") || value.startsWith("විසිතුන")) {
        return 23;
    } else if (value.startsWith("විසිහතර")) {
        return 24;
    } else if (value.startsWith("විසිපස්") || value.startsWith("විසිපහ")) {
        return 25;
    } else if (value.startsWith("විසිහය")) {
        return 26;
    } else if (value.startsWith("විසිහත්") || value.startsWith("විසිහත")) {
        return 27;
    } else if (value.startsWith("විසිඅට")) {
        return 28;
    } else if (value.startsWith("විසිනව") || value.startsWith("විසිනම")) {
        return 29;
    } else if (value.startsWith("තිස්එක")) {
        return 31;
    } else if (value.startsWith("විසි") || value.startsWith("විස්")) {
        return 20;
    } else if (value.startsWith("තිස්") || value.startsWith("තිහ")) {
        return 30;
    } else if (value.startsWith("පල") || value.startsWith("පළ") || value.startsWith("එක")) {
        return 1;
    } else if (value.startsWith("දෙවෙ") || value.startsWith("දෙවැ") || value.startsWith("දෙක")) {
        return 2;
    } else if (value.startsWith("තුන්") || value.startsWith("තුන")) {
        return 3;
    } else if (value.startsWith("හතර")) {
        return 4;
    } else if (value.startsWith("පස්") || value.startsWith("පහ")) {
        return 5;
    } else if (value.startsWith("හය")) {
        return 6;
    } else if (value.startsWith("හත්") || value.startsWith("හත")) {
        return 7;
    } else if (value.startsWith("අට")) {
        return 8;
    } else if (value.startsWith("නව") || value.startsWith("නම")) {
        return 9;
    } else if (value.startsWith("දහ")) {
        return 10;
    }

    return -1;
}

module.exports = {
    exportDate
};
var mNavigate = null;
var mStatusText = null;

const getSuccessMessage = (data) => {
    if (typeof data?.message === "string" && data.message.trim() !== "") {
        return data.message.trim();
    }

    if (data?.status === "success" && data?.data?.task === "reminder_created") {
        const reminder = data?.data?.reminder ?? {};
        const remindAtRaw = reminder?.remindAt;

        let remindDateText = "";
        let remindTimeText = "";
        if (typeof remindAtRaw === "string" && remindAtRaw.trim() !== "") {
            const remindDate = new Date(remindAtRaw);
            if (!Number.isNaN(remindDate.getTime())) {
                remindDateText = remindDate.toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                });
                remindTimeText = remindDate.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                });
            }
        }

        if (remindDateText !== "" && remindTimeText !== "") {
            return `රිමයින්ඩරය සාර්ථකව සාදන ලදී. ${remindDateText} දින ${remindTimeText} ට මතක් කිරීම සකසා ඇත.`;
        }

        return "රිමයින්ඩරය සාර්ථකව සාදන ලදී.";
    }

    if (data?.status === "success" && data?.data?.task === "reminder_deleted") {
        const deletedReminder = data?.data?.deleted;
        if (deletedReminder && typeof deletedReminder === "object") {
            const deletedTitle = typeof deletedReminder?.title === "string" ? deletedReminder.title.trim() : "";
            const deletedRemindAtRaw = deletedReminder?.remindAt;

            let deletedDateText = "";
            let deletedTimeText = "";
            if (typeof deletedRemindAtRaw === "string" && deletedRemindAtRaw.trim() !== "") {
                const deletedDate = new Date(deletedRemindAtRaw);
                if (!Number.isNaN(deletedDate.getTime())) {
                    deletedDateText = deletedDate.toLocaleDateString("en-GB", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                    });
                    deletedTimeText = deletedDate.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    });
                }
            }

            if (deletedTitle !== "" && deletedDateText !== "" && deletedTimeText !== "") {
                return `රිමයින්ඩරය සාර්ථකව මකා දමන ලදී. ${deletedDateText} දින ${deletedTimeText} ට තිබූ "${deletedTitle}" මතක් කිරීම ඉවත් කරන ලදී.`;
            }

            if (deletedTitle !== "") {
                return `"${deletedTitle}" රිමයින්ඩරය සාර්ථකව මකා දමන ලදී.`;
            }

            return "රිමයින්ඩරය සාර්ථකව මකා දමන ලදී.";
        }

        const deletedCount = Number(data?.data?.deletedCount ?? 0);
        const date = data?.data?.date;

        if (deletedCount > 0 && typeof date === "string" && date.trim() !== "") {
            return `${date} දින සඳහා රිමයින්ඩර් ${deletedCount}ක් සාර්ථකව මකා දමන ලදී.`;
        }

        if (deletedCount > 0) {
            return `රිමයින්ඩර් ${deletedCount}ක් සාර්ථකව මකා දමන ලදී.`;
        }

        return "රිමයින්ඩරය සාර්ථකව මකා දමන ලදී.";
    }

    return "Done.";
};

const init = (setStatusText) => {
    mStatusText = setStatusText;
}

const handleIntent = async (intent, entities) => {

    mStatusText("Working...");

    if (intent === "navigation") {
        let page = entities[0].value;
        if (page === "home") {
            page = "";
        }
        mStatusText("Navigating to " + page + "...");
        mNavigate("/" + page);
        return;
    }

    const body = {
        intent: intent,
    };
    for (const entity of entities) {
        body[entity.entity] = entity.value;
    }

    try {
        const response = await fetch('http://localhost:3001/api/voice/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const successMessage = getSuccessMessage(data);
        mStatusText(successMessage);
        console.log(data);

    } catch (error) {
        console.error('Error sending voice text:', error);
    }

}

const setNavigate = (navigate) => {
    mNavigate = navigate;
}

export { init, handleIntent, setNavigate };
var mNavigate = null;
var mStatusText = null;
var mScrollAnimationFrameId = null;
var mScrollDirection = 0;
var mLastScrollTimestamp = 0;

const SCROLL_PIXELS_PER_SECOND = 60;
const STEP_SCROLL_PIXELS = 300;

const stopAutoScroll = () => {
    if (mScrollAnimationFrameId !== null) {
        window.cancelAnimationFrame(mScrollAnimationFrameId);
        mScrollAnimationFrameId = null;
    }
    mScrollDirection = 0;
    mLastScrollTimestamp = 0;
};

const runAutoScroll = (timestamp) => {
    if (mScrollDirection === 0) {
        mScrollAnimationFrameId = null;
        mLastScrollTimestamp = 0;
        return;
    }

    const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const currentScrollTop = window.scrollY || window.pageYOffset || 0;

    if ((mScrollDirection < 0 && currentScrollTop <= 0) || (mScrollDirection > 0 && currentScrollTop >= maxScrollTop)) {
        const reachedBottom = mScrollDirection > 0;
        stopAutoScroll();
        if (typeof mStatusText === "function") {
            mStatusText(reachedBottom ? "Reached bottom. Auto-scroll stopped." : "Reached top. Auto-scroll stopped.");
        }
        return;
    }

    if (mLastScrollTimestamp === 0) {
        mLastScrollTimestamp = timestamp;
    }

    const deltaMs = timestamp - mLastScrollTimestamp;
    mLastScrollTimestamp = timestamp;

    const distance = (SCROLL_PIXELS_PER_SECOND * deltaMs * mScrollDirection) / 1000;
    window.scrollBy({
        top: distance,
        left: 0,
        behavior: "auto",
    });

    const nextScrollTop = window.scrollY || window.pageYOffset || 0;
    if ((mScrollDirection < 0 && nextScrollTop <= 0) || (mScrollDirection > 0 && nextScrollTop >= maxScrollTop)) {
        const reachedBottom = mScrollDirection > 0;
        stopAutoScroll();
        if (typeof mStatusText === "function") {
            mStatusText(reachedBottom ? "Reached bottom. Auto-scroll stopped." : "Reached top. Auto-scroll stopped.");
        }
        return;
    }

    mScrollAnimationFrameId = window.requestAnimationFrame(runAutoScroll);
};

const startAutoScroll = (direction) => {
    mScrollDirection = direction;
    if (mScrollAnimationFrameId === null) {
        mLastScrollTimestamp = 0;
        mScrollAnimationFrameId = window.requestAnimationFrame(runAutoScroll);
    }
};

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

    if (intent === "stop_all") {
        stopAutoScroll();
        mStatusText("Stopped.");
        return;
    }

    if (intent === "navigation") {
        const pageEntity = entities.find((entity) => entity.entity === "page");
        let page = pageEntity?.value;

        if (typeof page !== "string" || page.trim() === "") {
            mStatusText("Page not recognized.");
            return;
        }

        page = page.trim().toLowerCase();
        if (page === "home") {
            page = "";
        }
        mStatusText("Navigating to " + page + "...");
        mNavigate("/" + page);
        return;
    }

    if (intent === "scroll") {
        const directionEntity = entities.find((entity) => entity.entity === "direction");
        const direction = (typeof directionEntity?.value === "string" ? directionEntity.value : "").trim().toLowerCase();

        if (direction !== "up" && direction !== "down") {
            mStatusText("Scroll direction not recognized.");
            return;
        }

        startAutoScroll(direction === "down" ? 1 : -1);

        mStatusText(direction === "down" ? "Auto-scrolling down..." : "Auto-scrolling up...");
        return;
    }

    if (intent === "step_scroll") {
        const directionEntity = entities.find((entity) => entity.entity === "direction");
        const direction = (typeof directionEntity?.value === "string" ? directionEntity.value : "").trim().toLowerCase();

        if (direction !== "up" && direction !== "down") {
            mStatusText("Scroll direction not recognized.");
            return;
        }

        stopAutoScroll();
        window.scrollBy({
            top: direction === "down" ? STEP_SCROLL_PIXELS : -STEP_SCROLL_PIXELS,
            left: 0,
            behavior: "smooth",
        });

        mStatusText(direction === "down" ? "Scrolled down." : "Scrolled up.");
        return;
    }

    if (intent === "reminder_navigation") {
        const eventEntity = entities.find((entity) => entity.entity === "event");
        var event = (typeof eventEntity?.value === "string" ? eventEntity.value : "").trim().toLowerCase();
   
        if (typeof mNavigate !== "function") {
            mStatusText("Navigation is not ready yet.");
            return;
        }

        if (event === "all") {
            mStatusText("Going to all reminders...");
            mNavigate("/my-reminders?tab=all");
            return;
        }

        if (event === "today") {
            mStatusText("Going to today's reminders...");
            mNavigate("/my-reminders");
            return;
        }
       
        if (event === "upcoming" || event === "හෙට" || event === "past") {
            
            if(event === "හෙට"){
                event = "upcoming";
            }

            mStatusText(`Going to ${event} reminders...`);
            mNavigate(`/my-reminders?tab=${event}`);
            return;
        }

        mStatusText("Reminder section not recognized.");
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

        const taskName = typeof data?.data?.task === "string" ? data.data.task : "";
        const isReminderIntent = typeof intent === "string" && intent.toLowerCase().includes("reminder");
        const isReminderTask = taskName.startsWith("reminder_");
        if (data?.status === "success" && (isReminderIntent || isReminderTask)) {
            window.dispatchEvent(new CustomEvent("reminders:updated", {
                detail: {
                    source: "voice",
                    task: taskName || intent,
                },
            }));
        }

        console.log(data);

    } catch (error) {
        console.error('Error sending voice text:', error);
    }

}

const setNavigate = (navigate) => {
    mNavigate = navigate;
}

export { init, handleIntent, setNavigate };
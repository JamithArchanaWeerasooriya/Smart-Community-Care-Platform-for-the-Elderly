var mNavigate = null;
var mStatusText = null;

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
        mStatusText(data.message ?? "Done.");
        console.log(data);

    } catch (error) {
        console.error('Error sending voice text:', error);
    }

}

const setNavigate = (navigate) => {
    mNavigate = navigate;
}

export { init, handleIntent, setNavigate };
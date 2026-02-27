function Home() {
    const wellnessTips = [
        "Drink water regularly throughout the day.",
        "Take a short walk in the morning sunlight.",
        "Do gentle stretching after waking up.",
        "Call a family member or a friend today.",
        "Keep your medicine box organized weekly.",
        "Spend 15 minutes reading or listening to music.",
        "Practice deep breathing before bed.",
        "Eat fruits and vegetables with each meal.",
        "Check blood pressure at the same time daily.",
        "Maintain a regular sleep routine.",
        "Write down one happy moment from today.",
        "Keep emergency contacts easy to reach."
    ];

    return (
        <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 16px 64px" }}>
            <section style={{ marginBottom: "36px" }}>
                <h1>Welcome to Smart Community Care</h1>
                <p>
                    This home page is designed to support elderly users with reminders, wellness activities,
                    and daily community care updates.
                </p>
            </section>

            <section style={{ marginBottom: "36px" }}>
                <h2>Today&apos;s Focus</h2>
                <p>Stay active, stay connected, and stay safe. Follow your routine with confidence.</p>
            </section>

            <section style={{ marginBottom: "36px" }}>
                <h2>Daily Wellness Tips</h2>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "12px"
                    }}
                >
                    {wellnessTips.map((tip, index) => (
                        <article
                            key={index}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: "10px",
                                padding: "14px",
                                backgroundColor: "#fff"
                            }}
                        >
                            <h3 style={{ marginTop: 0 }}>Tip {index + 1}</h3>
                            <p style={{ marginBottom: 0 }}>{tip}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section style={{ marginBottom: "36px" }}>
                <h2>Community Support Updates</h2>
                {[...Array(14)].map((_, index) => (
                    <article
                        key={index}
                        style={{
                            borderBottom: "1px solid #e5e5e5",
                            padding: "14px 0"
                        }}
                    >
                        <h3 style={{ margin: "0 0 6px" }}>Update #{index + 1}</h3>
                        <p style={{ margin: 0 }}>
                            Volunteers are available this week to assist with transportation, medicine pickup,
                            and regular home check-ins for registered members.
                        </p>
                    </article>
                ))}
            </section>

            <section>
                <h2>End of Page</h2>
                <p>You have reached the bottom of the home page after scrolling.</p>
            </section>
        </main>
    );
}

export default Home;
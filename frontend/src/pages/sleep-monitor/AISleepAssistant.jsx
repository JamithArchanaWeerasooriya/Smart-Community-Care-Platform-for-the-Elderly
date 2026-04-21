import "./AISleepAssistant.css";
import "material-icons/iconfont/material-icons.css";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import API from "../../services/api";

function AISleepAssistant() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    {
      sender: "bot",
      text: "Hello! I'm your AI sleep assistant 🌙\nAsk me anything about sleep.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat, loading]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();

    setChat((prev) => [...prev, { sender: "user", text: userMessage }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await API.post("/ai-sleep/chat", {
        message: userMessage,
      });

      setChat((prev) => [
        ...prev,
        { sender: "bot", text: res.data.reply },
      ]);
    } catch {
      setChat((prev) => [
        ...prev,
        { sender: "bot", text: "Error 😢 Try again" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="ai-container">
      <div className="ai-content">

        {/* HEADER */}
        <header className="ai-header">
          <div className="ai-header-copy">
            <h1 className="ai-title">AI Sleep Assistant 😴</h1>

            <div className="ai-header-actions">
              <Link to="/monitor">
                <button className="ai-btn-primary">
                  <span className="material-icons">play_arrow</span>
                  Start Monitoring
                </button>
              </Link>

              <Link to="/sleep-monitor">
                <button className="ai-btn-secondary">
                  <span className="material-icons">dashboard</span>
                  Back to Dashboard
                </button>
              </Link>
            </div>
          </div>
        </header>

        {/* CHAT */}
        <main className="ai-main">
          <section className="ai-board">

            {/* CHAT BOX */}
            <div className="ai-chat-box" ref={chatBoxRef}>
              {chat.map((msg, idx) => {
                const isFirstBot = idx === 0 && msg.sender === "bot";

                return (
                  <div key={idx} className={`ai-chat-row ${msg.sender}`}>
                    <div
                      className={`ai-chat-bubble ${msg.sender}`}
                      style={{
                        padding: isFirstBot ? "8px 12px" : "10px 14px",
                        fontSize: isFirstBot ? "0.85rem" : "0.95rem",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="ai-chat-row bot">
                  <div className="ai-chat-bubble bot ai-typing">
                    AI is typing...
                  </div>
                </div>
              )}
            </div>

            {/* INPUT */}
            <div className="ai-input-row">
              <textarea
                className="ai-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your sleep..."
              />

              <button
                className="ai-send-btn"
                onClick={sendMessage}
                disabled={!message.trim()}
              >
                Send
              </button>
            </div>

          </section>
        </main>

      </div>
    </div>
  );
}

export default AISleepAssistant;
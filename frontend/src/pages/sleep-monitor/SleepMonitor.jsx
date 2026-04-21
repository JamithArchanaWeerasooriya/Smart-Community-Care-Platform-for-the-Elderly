import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "material-icons/iconfont/material-icons.css";
import "./SleepMonitor.css";
import SleepReport from "./components/SleepReport";

function SleepMonitor() {

  const navigate = useNavigate();

  const [recording, setRecording] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showReport,setShowReport] = useState(false);

  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);

  let buffer = [];

  const startSleep = async () => {

    const res = await API.post("/sleep/start");
    const session = res.data._id;

    setSessionId(session);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    streamRef.current = stream;

    const audioContext = new AudioContext({ sampleRate: 16000 });

    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);

    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processorRef.current = processor;

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = async (event) => {

      const input = event.inputBuffer.getChannelData(0);

      buffer.push(...input);

      if (buffer.length > 16000 * 4) {

        const wavBlob = encodeWAV(buffer);

        const formData = new FormData();

        formData.append("audio", wavBlob, "segment.wav");
        formData.append("sessionId", session);

        await API.post("/sleep/segment", formData);

        buffer = [];
      }
    };

    setRecording(true);
  };

const stopSleep = async () => {

  if (processorRef.current) {

    processorRef.current.onaudioprocess = null;
    processorRef.current.disconnect();

  }

  if (audioContextRef.current) {

    await audioContextRef.current.close();

  }

  if (streamRef.current) {

    streamRef.current.getTracks().forEach(track => track.stop());

  }

  await API.post("/sleep/end", { sessionId });

  setRecording(false);

  setShowReport(true);

};

  const encodeWAV = (samples) => {

    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");

    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 16000, true);
    view.setUint32(28, 16000 * 2, true);

    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    writeString(36, "data");
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;

    for (let i = 0; i < samples.length; i++, offset += 2) {

      let s = Math.max(-1, Math.min(1, samples[i]));

      view.setInt16(offset, s * 0x7fff, true);
    }

    return new Blob([view], { type: "audio/wav" });
  };
  

  

  return (

    <div className="my-reminders-app">

      <div className="app-content">

        {/* HEADER */}

        <header className="app-header">

          <div className="header-hero">

            <div className="header-copy">

              <div className="header-text">

                <p className="greeting-date">
                  Sleep Monitoring
                </p>

                <h1 className="greeting-title">
                  SLEEP RECORDER
                </h1>

                <p className="greeting-subtitle">
                  Start monitoring your sleep to detect snoring.
                </p>

              </div>

            </div>

            {/* STATUS CARD */}

            <aside className="header-highlight">

              <p className="header-highlight-label">
                Recording Status
              </p>

              <h2 className="header-highlight-title">
                {recording ? "Monitoring Active" : "Ready to Start"}
              </h2>

              <p className="header-highlight-desc">
                {recording
                  ? "Audio is currently being analyzed for snoring patterns."
                  : "Press the button to begin sleep monitoring."}
              </p>

            </aside>

          </div>

        </header>


        {/* MAIN CONTROL */}

        <main className="main-board">

          <section className="board-shell">

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "60px 0"
              }}
            >

              {!recording && (

                <button
                  className="monitor-button"
                  onClick={startSleep}
                >
                  <span className="material-icons">
                    mic
                  </span>
                  Start Monitoring
                </button>

              )}

              {recording && (

                <button
                  className="monitor-button active"
                  onClick={stopSleep}
                >
                  <span className="material-icons">
                    stop
                  </span>
                  Stop Monitoring
                </button>

              )}

            </div>
            

          </section>
          {showReport && (

<SleepReport sessionId={sessionId} />

)}

        </main>

      </div>

    </div>

  );

}

export default SleepMonitor;
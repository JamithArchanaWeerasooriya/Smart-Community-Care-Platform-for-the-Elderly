import React, { useEffect, useRef, useState } from 'react';
import './VoiceButton.css';

export default function VoiceButton({ init, onIntent = null }) {

  const [listening, setListening] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const [mStatusText, setStatusText] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof init === 'function') {
      init(setStatusText);
    }
  }, [init]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('SpeechRecognition is not supported in this browser.');
      setStatusText('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'si-LK';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + ' ';
        } else {
          interimText += transcript;
        }
      }

      setPreviewText(interimText);

      if (finalText.trim() !== '') {
        setPreviewText(finalText.trim());
        handleVoiceText(finalText.trim());
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  function actionButtonClick() {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (listening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  }

  const handleVoiceText = async (text) => {

    setStatusText("Processing...");

    try {
      const response = await fetch('http://localhost:5000/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) {
        setStatusText("Error processing voice command.");
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const intent = data?.intent ?? null;
      const entities = Array.isArray(data?.entities) ? data.entities : [];

      if (intent != null && onIntent) {
        console.log(text);
        console.log(intent);
        console.log(entities);
        onIntent(intent, entities);
      }

    } catch (error) {
      setStatusText("Error processing voice command.");
      console.error('Error processing voice command:', error);
    }
    
  };

  return (
    <>
      <button
        className='voice-btn'
        data-listening={listening}
        onClick={actionButtonClick}
        aria-label={listening ? 'Stop listening' : 'Start listening'}
      >
        <span className='voice-btn-ring' />
        <span className='voice-btn-inner'>
          <span className='voice-btn-icon' />
        </span>
      </button>

      <div
        className='voice-controller-container'
        style={{ display: listening ? 'flex' : 'none' }}
      >
        <div className='voice-controller'>
          <div className='voice-controller-header'>
            <span className='vc-indicator-dot' />
            <span className='vc-indicator-text'>Listening</span>
          </div>

          <div className='voice-controller-body'>
            <p className='preview-text'>{previewText}</p>
            <p className='status-text'>{mStatusText}</p>
          </div>
        </div>
      </div>
    </>
  );
}
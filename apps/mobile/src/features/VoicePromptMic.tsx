import React, { useState, useEffect } from 'react';

interface VoicePromptMicProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoicePromptMic({ onTranscript, disabled }: VoicePromptMicProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSupported(false);
    }
  }, []);

  function toggleListen() {
    if (!supported || disabled) return;

    if (listening) {
      setListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      if (text) {
        onTranscript(text);
      }
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      className={`voice-mic-button ${listening ? 'listening-pulse' : ''}`}
      onClick={toggleListen}
      disabled={disabled}
      title={listening ? "Listening... Speak your prompt" : "Click to speak prompt"}
    >
      {listening ? '🔴 Listening…' : '🎙️ Voice Prompt'}
    </button>
  );
}

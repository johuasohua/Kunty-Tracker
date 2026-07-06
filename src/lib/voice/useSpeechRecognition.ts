"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SpeechRecognitionState {
  supported: boolean;
  listening: boolean;
  /** Finalised transcript accumulated across the session. */
  transcript: string;
  /** In-flight words not yet finalised — updates in real time. */
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
  /** Replace the finalised transcript (e.g. manual edits). */
  setTranscript: (text: string) => void;
}

/**
 * Thin wrapper over the Web Speech API. Runs in continuous +
 * interim-results mode so a single session can capture several sentences
 * (batch entry) with a live, word-by-word transcript. Purely a transport —
 * turning the transcript into transactions is the parser's job.
 */
export function useSpeechRecognition(): SpeechRecognitionState {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Track whether the user still wants to listen, so Chrome's habit of
  // auto-ending recognition after a pause can be transparently restarted.
  const wantListeningRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) finalChunk += text;
        else interimChunk += text;
      }
      if (finalChunk) {
        setTranscript((prev) => (prev ? `${prev} ${finalChunk.trim()}` : finalChunk.trim()));
      }
      setInterim(interimChunk);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech"/"aborted" are benign; surface the rest.
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(
        event.error === "not-allowed"
          ? "Microphone access was denied."
          : event.message || event.error
      );
      wantListeningRef.current = false;
      setListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if the user hasn't stopped (Chrome ends on silence).
      if (wantListeningRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // fall through to "stopped"
        }
      }
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    return () => {
      wantListeningRef.current = false;
      recognition.onend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.abort();
    };
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setError(null);
    wantListeningRef.current = true;
    try {
      recognition.start();
      setListening(true);
    } catch {
      // start() throws if already running — safe to ignore.
    }
  }, []);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  return {
    supported,
    listening,
    transcript,
    interim,
    error,
    start,
    stop,
    reset,
    setTranscript,
  };
}

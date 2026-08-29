"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  mergeDictationIntoComposerText,
  normalizeDictationText,
} from "@/lib/moonie/user-message-attachment";

export type MoonieVoiceDictationState =
  | "idle"
  | "listening"
  | "transcribing"
  | "unsupported"
  | "permission_denied";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | undefined {
  if (typeof window === "undefined") return undefined;
  const win = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition;
}

function formatElapsed(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const WAVEFORM_BAR_COUNT = 48;
const WAVEFORM_SAMPLE_INTERVAL_MS = 128;

export { WAVEFORM_BAR_COUNT as MOONIE_WAVEFORM_BAR_COUNT };

function createIdleWaveform(): number[] {
  return Array.from({ length: WAVEFORM_BAR_COUNT }, () => 0);
}

function amplitudeFromAnalyser(
  analyser: AnalyserNode,
  floatData: Float32Array<ArrayBuffer>,
  freqData: Uint8Array<ArrayBuffer>
): number {
  analyser.getFloatTimeDomainData(floatData);
  analyser.getByteFrequencyData(freqData);

  let peak = 0;
  let sumSquares = 0;

  for (let index = 0; index < floatData.length; index += 1) {
    const magnitude = Math.abs(floatData[index] ?? 0);
    peak = Math.max(peak, magnitude);
    sumSquares += magnitude * magnitude;
  }

  const rms = Math.sqrt(sumSquares / floatData.length);

  const voiceStart = 3;
  const voiceEnd = Math.min(80, freqData.length);
  let voiceSum = 0;
  let weightedSum = 0;
  for (let index = voiceStart; index < voiceEnd; index += 1) {
    const band = freqData[index] ?? 0;
    voiceSum += band;
    weightedSum += index * band;
  }
  const voiceLevel = voiceSum / (voiceEnd - voiceStart) / 255;
  const pitchWeight =
    voiceSum > 0 ? weightedSum / voiceSum / voiceEnd : 0.5;

  const raw =
    peak * 0.62 +
    rms * 0.18 +
    voiceLevel * 0.2 +
    pitchWeight * 0.08;

  if (raw < 0.009) {
    return 0;
  }

  const decibels = 20 * Math.log10(raw);
  const volumeLevel = Math.max(0, Math.min(1, (decibels + 54) / 36));
  const pitchAccent = 0.82 + pitchWeight * 0.28;

  return Math.max(0, Math.min(1, volumeLevel * pitchAccent));
}

function pushWaveformSample(buffer: number[], level: number) {
  buffer.shift();
  buffer.push(level);
}

export function useMoonieVoiceDictation({
  disabled,
  onDictation,
}: {
  disabled?: boolean;
  onDictation: (text: string) => void;
}) {
  const [state, setState] = useState<MoonieVoiceDictationState>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [waveformLevels, setWaveformLevels] = useState<number[]>(createIdleWaveform);
  const [waveformVisibleCount, setWaveformVisibleCount] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTextRef = useRef("");
  const sessionActiveRef = useRef(false);
  const cancelledRef = useRef(false);
  const onDictationRef = useRef(onDictation);
  const listeningStartedAtRef = useRef<number | null>(null);
  const stateRef = useRef<MoonieVoiceDictationState>("idle");
  const audioFrameRef = useRef<number | null>(null);
  const audioCleanupRef = useRef<(() => void) | null>(null);
  const waveformBufferRef = useRef<number[]>(createIdleWaveform());
  const lastWaveformSampleAtRef = useRef(0);

  useEffect(() => {
    onDictationRef.current = onDictation;
    stateRef.current = state;
  });

  const stopAudioMonitor = useCallback(() => {
    if (audioFrameRef.current != null) {
      cancelAnimationFrame(audioFrameRef.current);
      audioFrameRef.current = null;
    }
    audioCleanupRef.current?.();
    audioCleanupRef.current = null;
    waveformBufferRef.current = createIdleWaveform();
    lastWaveformSampleAtRef.current = 0;
    setWaveformVisibleCount(0);
    setWaveformLevels(createIdleWaveform());
  }, []);

  const startAudioMonitor = useCallback(async (): Promise<boolean> => {
    stopAudioMonitor();

    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const audioContext = new AudioContext();
      await audioContext.resume();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.08;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -5;
      source.connect(analyser);

      const floatData = new Float32Array(analyser.fftSize);
      const freqData = new Uint8Array(analyser.frequencyBinCount);

      const sampleWaveform = (timestamp: number) => {
        if (!sessionActiveRef.current) return;

        if (
          timestamp - lastWaveformSampleAtRef.current >=
          WAVEFORM_SAMPLE_INTERVAL_MS
        ) {
          lastWaveformSampleAtRef.current = timestamp;
          const level = amplitudeFromAnalyser(analyser, floatData, freqData);
          pushWaveformSample(waveformBufferRef.current, level);
          setWaveformVisibleCount((count) =>
            Math.min(WAVEFORM_BAR_COUNT, count + 1)
          );
          setWaveformLevels([...waveformBufferRef.current]);
        }

        audioFrameRef.current = requestAnimationFrame(sampleWaveform);
      };

      audioCleanupRef.current = () => {
        stream.getTracks().forEach((track) => track.stop());
        void audioContext.close();
      };

      lastWaveformSampleAtRef.current = 0;
      waveformBufferRef.current = createIdleWaveform();
      setWaveformVisibleCount(0);
      setWaveformLevels([...waveformBufferRef.current]);
      audioFrameRef.current = requestAnimationFrame(sampleWaveform);
      return true;
    } catch {
      setWaveformLevels(createIdleWaveform());
      return false;
    }
  }, [stopAudioMonitor]);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    sessionActiveRef.current = false;
    listeningStartedAtRef.current = null;
    stateRef.current = "idle";
    stopAudioMonitor();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    finalTextRef.current = "";
    setElapsedSeconds(0);
    setStatusMessage(null);
    setState("idle");
  }, [stopAudioMonitor]);

  const stopListening = useCallback(() => {
    stateRef.current = "transcribing";
    setState("transcribing");
    setStatusMessage("Transcribing…");
    listeningStartedAtRef.current = null;
    stopAudioMonitor();
    recognitionRef.current?.stop();
  }, [stopAudioMonitor]);

  useEffect(() => {
    if (state !== "listening") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        reset();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [reset, state]);

  useEffect(() => {
    if (state !== "listening") return;

    const tick = () => {
      if (listeningStartedAtRef.current == null) return;
      setElapsedSeconds(
        Math.floor((Date.now() - listeningStartedAtRef.current) / 1000)
      );
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [state]);

  useEffect(() => () => {
    stopAudioMonitor();
    recognitionRef.current?.stop();
  }, [stopAudioMonitor]);

  const startListening = useCallback(() => {
    if (disabled) return;

    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      setStatusMessage("Voice dictation isn't supported in this browser.");
      setState("unsupported");
      return;
    }

    void (async () => {
      try {
        cancelledRef.current = false;
        setElapsedSeconds(0);
        waveformBufferRef.current = createIdleWaveform();
        setWaveformVisibleCount(0);
        setWaveformLevels([...waveformBufferRef.current]);

        const audioReady = await startAudioMonitor();
        if (!audioReady) {
          setStatusMessage(
            "Microphone access is required for voice dictation."
          );
          setState("permission_denied");
          return;
        }

        const recognition = new SpeechRecognitionCtor();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = true;
        finalTextRef.current = "";

        recognition.onstart = () => {
          sessionActiveRef.current = true;
          listeningStartedAtRef.current = Date.now();
          stateRef.current = "listening";
          setStatusMessage("Listening…");
          setState("listening");
        };

        recognition.onresult = (event) => {
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const chunk = event.results[i]?.[0]?.transcript ?? "";
            if (event.results[i]?.isFinal) {
              finalTextRef.current = mergeDictationIntoComposerText(
                finalTextRef.current,
                chunk
              );
            }
          }
          if (finalTextRef.current) {
            setStatusMessage("Listening…");
          }
        };

        recognition.onerror = (event) => {
          if (
            event.error === "not-allowed" ||
            event.error === "service-not-allowed"
          ) {
            setStatusMessage(
              "Microphone access is required for voice dictation."
            );
            setState("permission_denied");
            return;
          }
          if (event.error === "aborted") {
            reset();
            return;
          }
          setStatusMessage("Voice dictation isn't supported in this browser.");
          setState("unsupported");
        };

        recognition.onend = () => {
          stopAudioMonitor();
          const wasCancelled = cancelledRef.current;
          cancelledRef.current = false;
          const wasActive = sessionActiveRef.current;
          sessionActiveRef.current = false;
          listeningStartedAtRef.current = null;
          const text = normalizeDictationText(finalTextRef.current);
          finalTextRef.current = "";

          setStatusMessage(null);
          setState("idle");
          setElapsedSeconds(0);

          if (wasActive && !wasCancelled && text) {
            queueMicrotask(() => {
              onDictationRef.current(text);
            });
          }
        };

        sessionActiveRef.current = true;
        listeningStartedAtRef.current = Date.now();
        stateRef.current = "listening";
        setStatusMessage("Listening…");
        setState("listening");

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        stopAudioMonitor();
        setStatusMessage("Voice dictation isn't supported in this browser.");
        setState("unsupported");
      }
    })();
  }, [disabled, reset, startAudioMonitor, stopAudioMonitor]);

  const isRecording = state === "listening" || state === "transcribing";

  return {
    state,
    statusMessage,
    elapsedSeconds,
    elapsedLabel: formatElapsed(elapsedSeconds),
    waveformLevels,
    waveformVisibleCount,
    isRecording,
    startListening,
    stopListening,
    cancel: reset,
    dismissError: reset,
  };
}

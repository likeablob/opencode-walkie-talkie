import { useCallback, useEffect, useRef, useState } from "react";

export type RecordingState = "idle" | "starting" | "recording" | "paused";

export function useAudioRecorder(selectedDeviceId?: string | null) {
  const [state, setState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const shouldAbortRef = useRef<boolean>(false);
  const selectedDeviceIdRef = useRef<string | null | undefined>(selectedDeviceId);

  useEffect(() => {
    selectedDeviceIdRef.current = selectedDeviceId;
  }, [selectedDeviceId]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      chunksRef.current = [];
      shouldAbortRef.current = false;
      setState("starting");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDeviceIdRef.current
            ? { exact: selectedDeviceIdRef.current }
            : undefined,
          echoCancellation: false,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      if (shouldAbortRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        setState("idle");
        return;
      }

      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setAudioBlob(blob);
        } else {
          setAudioBlob(null);
        }
        setState("idle");

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      recorder.onerror = (e) => {
        setError(`Recording error: ${e}`);
        setState("idle");
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setState("recording");
    } catch (err) {
      setError(`Failed to start recording: ${err}`);
      setState("idle");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (state === "starting") {
      shouldAbortRef.current = true;
      setState("idle");
    } else if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [state]);

  const cancelRecording = useCallback(() => {
    if (state === "starting") {
      shouldAbortRef.current = true;
      setAudioBlob(null);
      setState("idle");
    } else if (mediaRecorderRef.current && state === "recording") {
      chunksRef.current = [];
      mediaRecorderRef.current.stop();
      setAudioBlob(null);
    }
  }, [state]);

  const clearAudio = useCallback(() => {
    setAudioBlob(null);
  }, []);

  return {
    state,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    clearAudio,
    isRecording: state === "recording" || state === "starting",
  };
}

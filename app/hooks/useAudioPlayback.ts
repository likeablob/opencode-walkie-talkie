import { useCallback, useEffect, useRef, useState } from "react";

import { useAppStore } from "~/stores/appStore";

export type PlaybackState = "idle" | "playing" | "loading";

type PlaybackRequest = {
  id: string;
  source: AudioBuffer | ArrayBuffer | string;
  priority: "interrupt";
};

export function useAudioPlayback() {
  const [state, setState] = useState<PlaybackState>("idle");
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const queueRef = useRef<PlaybackRequest[]>([]);
  const currentRequestIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const onEndedCallbackRef = useRef<(() => void) | null>(null);
  const isProcessingQueueRef = useRef(false);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const generateId = () => `playback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const playAudioBuffer = useCallback(
    async (audioBuffer: AudioBuffer, signal?: AbortSignal) => {
      const ctx = getAudioContext();

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      sourceNodeRef.current = source;
      setState("playing");
      useAppStore.getState().setAudioState("playing");

      source.onended = () => {
        if (!signal?.aborted) {
          console.log("[Playback] AudioBuffer playback ended");
          setState("idle");
          useAppStore.getState().setAudioState("idle");
          sourceNodeRef.current = null;
          onEndedCallbackRef.current?.();
        }
      };

      source.start(0);
    },
    [getAudioContext],
  );

  const playArrayBuffer = useCallback(
    async (arrayBuffer: ArrayBuffer, signal?: AbortSignal) => {
      try {
        setError(null);
        setState("loading");
        useAppStore.getState().setAudioState("loading");

        const ctx = getAudioContext();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        if (!signal?.aborted) {
          await playAudioBuffer(audioBuffer, signal);
        }
      } catch (err) {
        if (!signal?.aborted) {
          setError(`Failed to play audio: ${err}`);
          setState("idle");
          useAppStore.getState().setAudioState("idle");
        }
      }
    },
    [getAudioContext, playAudioBuffer],
  );

  const playUrl = useCallback(
    async (url: string, signal?: AbortSignal) => {
      try {
        setError(null);
        setState("loading");
        useAppStore.getState().setAudioState("loading");

        const response = await fetch(url, { signal });
        const arrayBuffer = await response.arrayBuffer();

        if (!signal?.aborted) {
          await playArrayBuffer(arrayBuffer, signal);
        }
      } catch (err) {
        if (!signal?.aborted) {
          setError(`Failed to fetch audio: ${err}`);
          setState("idle");
          useAppStore.getState().setAudioState("idle");
        }
      }
    },
    [playArrayBuffer],
  );

  const stopCurrent = useCallback(() => {
    console.log("[Playback] stopCurrent called");

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop();
      } catch {
        // Already stopped
      }
      sourceNodeRef.current = null;
    }

    currentRequestIdRef.current = null;
    setState("idle");
    useAppStore.getState().setAudioState("idle");
  }, []);

  const playSource = useCallback(
    async (request: PlaybackRequest) => {
      console.log("[Playback] playSource:", { id: request.id, priority: request.priority });

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      currentRequestIdRef.current = request.id;

      if (request.source instanceof AudioBuffer) {
        console.log("[Playback] Playing AudioBuffer:", { duration: request.source.duration });
        await playAudioBuffer(request.source, signal);
      } else if (typeof request.source === "string") {
        await playUrl(request.source, signal);
      } else {
        await playArrayBuffer(request.source, signal);
      }
    },
    [playAudioBuffer, playArrayBuffer, playUrl],
  );

  // TODO: Race condition on interrupt during await playSource
  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;
    console.log("[Playback] Processing queue:", { length: queueRef.current.length });

    const request = queueRef.current.shift()!;

    try {
      await playSource(request);

      console.log("[Playback] Request completed:", { id: request.id });

      if (queueRef.current.length > 0) {
        console.log("[Playback] Playing next in queue");
        isProcessingQueueRef.current = false;
        // eslint-disable-next-line react-hooks/immutability
        processQueue();
      } else {
        isProcessingQueueRef.current = false;
        console.log("[Playback] Queue empty, idle");
      }
    } catch (err) {
      console.error("[Playback] Error:", err);
      isProcessingQueueRef.current = false;
      setError(`Playback error: ${err}`);
      setState("idle");
    }
  }, [playSource]);

  const enqueue = useCallback(
    (source: AudioBuffer | ArrayBuffer | string, priority: "interrupt") => {
      const id = generateId();
      console.log("[Playback] enqueue:", {
        id,
        priority,
        currentQueueLength: queueRef.current.length,
      });

      if (priority === "interrupt") {
        console.log("[Playback] Interrupt priority - stopping current and clearing queue");
        stopCurrent();
        queueRef.current = [];
        queueRef.current.push({ id, source, priority });
        isProcessingQueueRef.current = false;

        processQueue();
      } else {
        queueRef.current.push({ id, source, priority });
        console.log("[Playback] Added to queue:", { queueLength: queueRef.current.length });

        if (!isProcessingQueueRef.current && state === "idle") {
          processQueue();
        }
      }

      return id;
    },
    [stopCurrent, processQueue, state],
  );

  const stop = useCallback(() => {
    console.log("[Playback] stop called - clearing queue");
    stopCurrent();
    queueRef.current = [];
    isProcessingQueueRef.current = false;
  }, [stopCurrent]);

  const setOnEnded = useCallback((callback: (() => void) | null) => {
    onEndedCallbackRef.current = callback;
  }, []);

  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stop]);

  return {
    state,
    error,
    enqueue,
    stop,
    setOnEnded,
    isPlaying: state === "playing",
    isLoading: state === "loading",
  };
}

import { useCallback, useRef } from "react";

import { client } from "~/lib/client";

export function useSTT() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const transcribe = useCallback(async (audioBlob: Blob): Promise<string> => {
    abortControllerRef.current = new AbortController();

    const result = await client.stt.transcribe(
      { audio: audioBlob },
      { signal: abortControllerRef.current.signal },
    );

    return result.text || "";
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    transcribe,
    abort,
  };
}

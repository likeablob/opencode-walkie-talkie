import { useCallback, useRef } from "react";

import { client } from "~/lib/client";

export type TTSOptions = {
  voice?: string;
  format?: "wav" | "mp3";
  cache?: boolean;
};

export function useTTS() {
  const abortControllerRef = useRef<AbortController | null>(null);
  // TODO: Add LRU cache or size limit to prevent memory growth over long sessions
  const cacheRef = useRef<Map<string, ArrayBuffer>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const synthesize = useCallback(
    async (text: string, options?: TTSOptions): Promise<ArrayBuffer> => {
      const shouldCache = options?.cache ?? false;

      console.log("[TTS] synthesize called:", {
        text,
        cache: shouldCache,
      });

      if (shouldCache) {
        const cacheKey = `${text}:${options?.voice || "auto"}:${options?.format || "wav"}`;

        if (cacheRef.current.has(cacheKey)) {
          console.log("[TTS] Using cached audio:", cacheKey);
          return cacheRef.current.get(cacheKey)!;
        }

        abortControllerRef.current = new AbortController();

        const result = await client.tts.synthesize(
          {
            text,
            voice: options?.voice,
            format: options?.format,
          },
          { signal: abortControllerRef.current.signal },
        );

        const audioBuffer = await result.audio.arrayBuffer();
        console.log("[TTS] New audio synthesized (cached):", {
          cacheKey,
          byteLength: audioBuffer.byteLength,
        });
        cacheRef.current.set(cacheKey, audioBuffer);

        return audioBuffer;
      }

      abortControllerRef.current = new AbortController();

      const result = await client.tts.synthesize(
        {
          text,
          voice: options?.voice,
          format: options?.format,
        },
        { signal: abortControllerRef.current.signal },
      );

      const audioBuffer = await result.audio.arrayBuffer();
      console.log("[TTS] New audio synthesized (non-cached):", {
        byteLength: audioBuffer.byteLength,
      });

      return audioBuffer;
    },
    [],
  );

  const synthesizeDecoded = useCallback(
    async (text: string, options?: TTSOptions): Promise<AudioBuffer> => {
      const shouldCache = options?.cache ?? false;

      console.log("[TTS] synthesizeDecoded called:", {
        text,
        cache: shouldCache,
      });

      if (shouldCache) {
        const cacheKey = `${text}:${options?.voice || "auto"}:${options?.format || "wav"}`;

        if (cacheRef.current.has(cacheKey)) {
          console.log("[TTS] Using cached ArrayBuffer:", cacheKey);
          const cachedBuffer = cacheRef.current.get(cacheKey)!;
          const ctx = getAudioContext();

          if (ctx.state === "suspended") {
            await ctx.resume();
          }

          const audioBuffer = await ctx.decodeAudioData(cachedBuffer.slice(0));
          console.log("[TTS] Audio decoded from cache:", {
            cacheKey,
            duration: audioBuffer.duration,
          });
          return audioBuffer;
        }

        const arrayBuffer = await synthesize(text, options);
        const ctx = getAudioContext();

        if (ctx.state === "suspended") {
          await ctx.resume();
        }

        const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
        console.log("[TTS] Audio decoded (cached):", {
          cacheKey,
          duration: audioBuffer.duration,
        });

        return audioBuffer;
      }

      const arrayBuffer = await synthesize(text, options);
      const ctx = getAudioContext();

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      console.log("[TTS] Audio decoded (non-cached):", {
        duration: audioBuffer.duration,
      });

      return audioBuffer;
    },
    [synthesize, getAudioContext],
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    synthesize,
    synthesizeDecoded,
    abort,
    clearCache,
  };
}

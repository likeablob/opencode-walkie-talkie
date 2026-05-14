import { useCallback, useEffect, useRef, useState } from "react";

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const request = useCallback(async () => {
    try {
      setError(null);

      if ("wakeLock" in navigator) {
        const wakeLock = await navigator.wakeLock.request("screen");
        wakeLockRef.current = wakeLock;
        setIsLocked(true);

        wakeLock.addEventListener("release", () => {
          setIsLocked(false);
          wakeLockRef.current = null;
        });
      } else {
        setError("Wake Lock API not supported");
      }
    } catch (err) {
      setError(`Failed to request wake lock: ${err}`);
      setIsLocked(false);
    }
  }, []);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsLocked(false);
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current) {
        await request();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      release();
    };
  }, [request, release]);

  return {
    isLocked,
    error,
    request,
    release,
  };
}

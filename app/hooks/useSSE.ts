import type {
  Event,
  EventMessagePartDelta,
  EventMessagePartUpdated,
  EventMessageUpdated,
  EventSessionIdle,
  EventSessionStatus,
  EventSessionUpdated,
} from "@opencode-ai/sdk/v2";

import { useCallback, useEffect, useRef, useState } from "react";

import { client } from "~/lib/client";

export type SSEConnectionState = "connected" | "reconnecting" | "disconnected";

type TypedEventHandlerMap = {
  "message.updated": (data: EventMessageUpdated) => void;
  "message.part.delta": (data: EventMessagePartDelta) => void;
  "message.part.updated": (data: EventMessagePartUpdated) => void;
  "session.status": (data: EventSessionStatus) => void;
  "session.idle": (data: EventSessionIdle) => void;
  "session.updated": (data: EventSessionUpdated) => void;
  connected: () => void;
  error: (error: unknown) => void;
  "*": (data: Event) => void;
};

type EventType = keyof TypedEventHandlerMap;

export function useSSE() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const listenersRef = useRef<Map<EventType, (...args: unknown[]) => void>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const connectRef = useRef<(() => void) | undefined>(undefined);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;
  const [connectionState, setConnectionState] = useState<SSEConnectionState>("disconnected");

  const connect = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const eventIterator = await client.sse.events({
        signal: abortControllerRef.current.signal,
      });

      listenersRef.current.get("connected")?.();
      setConnectionState("connected");
      reconnectAttemptsRef.current = 0;

      for await (const event of eventIterator) {
        const type = event.type || "unknown";
        listenersRef.current.get(type as EventType)?.(event);
        listenersRef.current.get("*")?.(event);
      }

      setConnectionState("reconnecting");

      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        const delay = reconnectDelay * reconnectAttemptsRef.current;
        console.log(
          `SSE disconnected, reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        connectRef.current?.();
      } else {
        setConnectionState("disconnected");
        listenersRef.current.get("error")?.({ message: "Max reconnect attempts reached" });
      }
    } catch (error) {
      setConnectionState("reconnecting");

      if (!(error instanceof Error) || error.name !== "AbortError") {
        listenersRef.current.get("error")?.(error);

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = reconnectDelay * reconnectAttemptsRef.current;
          console.log(
            `SSE error, reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          connectRef.current?.();
        } else {
          setConnectionState("disconnected");
        }
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setConnectionState("disconnected");
    reconnectAttemptsRef.current = 0;
  }, []);

  const on = useCallback(<T extends EventType>(eventType: T, handler: TypedEventHandlerMap[T]) => {
    listenersRef.current.set(eventType, handler as (...args: unknown[]) => void);
  }, []);

  const off = useCallback((eventType: EventType) => {
    listenersRef.current.delete(eventType);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  useEffect(() => {
    connectRef.current = connect;
  });

  return {
    connect,
    disconnect,
    on,
    off,
    connectionState,
  };
}

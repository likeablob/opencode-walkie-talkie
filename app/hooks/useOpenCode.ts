import { useCallback, useRef } from "react";

import { client } from "~/lib/client";

export function useOpenCode() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const createSession = useCallback(async (title?: string) => {
    return client.opencode.session.create({ title });
  }, []);

  const listSessions = useCallback(async (directory?: string) => {
    return client.opencode.session.list({ directory });
  }, []);

  const getSession = useCallback(async (sessionId: string) => {
    return client.opencode.session.get({ sessionId });
  }, []);

  const updateSession = useCallback(async (sessionId: string, title: string) => {
    return client.opencode.session.update({ sessionId, title });
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    return client.opencode.session.delete({ sessionId });
  }, []);

  const sendMessage = useCallback(
    async (
      sessionId: string,
      parts: { type: "text"; text: string }[],
      agent?: string,
      model?: { modelID: string; providerID: string },
    ) => {
      abortControllerRef.current = new AbortController();

      return client.opencode.message.send(
        { sessionId, parts, agent, model },
        { signal: abortControllerRef.current.signal },
      );
    },
    [],
  );

  const getMessages = useCallback(async (sessionId: string) => {
    return client.opencode.message.list({ sessionId });
  }, []);

  const getProviders = useCallback(async () => {
    return client.opencode.config.providers();
  }, []);

  const getModels = useCallback(async () => {
    return client.opencode.config.models();
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const abortSession = useCallback(async (sessionId: string) => {
    return client.opencode.session.abort({ sessionId });
  }, []);

  return {
    createSession,
    listSessions,
    getSession,
    updateSession,
    deleteSession,
    sendMessage,
    getMessages,
    getProviders,
    getModels,
    abort,
    abortSession,
  };
}

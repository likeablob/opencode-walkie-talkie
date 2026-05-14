import { implement } from "@orpc/server";

import { contract } from "~/shared/contract";

import { opencodeClient, serverAuthHeaders, serverEnv } from "./env";

const os = implement(contract);

const sessionCreate = os.opencode.session.create.handler(async ({ input }) => {
  const result = await opencodeClient.session.create(input ?? {});
  if (result.error) throw result.error;
  return result.data ?? { id: "", title: undefined };
});

const sessionList = os.opencode.session.list.handler(async ({ input }) => {
  const result = await opencodeClient.session.list(input ?? {});
  if (result.error) throw result.error;
  return result.data ?? [];
});

const sessionGet = os.opencode.session.get.handler(async ({ input }) => {
  const result = await opencodeClient.session.get({ sessionID: input.sessionId });
  if (result.error) throw result.error;
  return result.data ?? { id: "", title: undefined };
});

const sessionUpdate = os.opencode.session.update.handler(async ({ input }) => {
  const result = await opencodeClient.session.update({
    sessionID: input.sessionId,
    title: input.title,
  });
  if (result.error) throw result.error;
  return result.data ?? { id: "", title: undefined };
});

const sessionDelete = os.opencode.session.delete.handler(async ({ input }) => {
  const result = await opencodeClient.session.delete({ sessionID: input.sessionId });
  if (result.error) throw result.error;
  return { success: true };
});

const sessionAbort = os.opencode.session.abort.handler(async ({ input }) => {
  const result = await opencodeClient.session.abort({ sessionID: input.sessionId });
  if (result.error) throw result.error;
  return { success: true };
});

const messageSend = os.opencode.message.send.handler(async ({ input }) => {
  const result = await opencodeClient.session.promptAsync({
    sessionID: input.sessionId,
    parts: input.parts,
    agent: input.agent,
    model: input.model,
  });

  if (result.error) throw result.error;
  return result.data ?? { success: true };
});

const messageList = os.opencode.message.list.handler(async ({ input }) => {
  const result = await opencodeClient.session.messages({ sessionID: input.sessionId });
  if (result.error) throw result.error;
  return result.data ?? [];
});

const configProviders = os.opencode.config.providers.handler(async () => {
  const result = await opencodeClient.config.providers();
  if (result.error) throw result.error;
  return result.data ?? { providers: [] };
});

const configModels = os.opencode.config.models.handler(async () => {
  const result = await opencodeClient.config.providers();
  if (result.error) throw result.error;

  const providers = result.data?.providers ?? [];
  return providers.flatMap((p: { models?: Record<string, unknown>; id: string }) =>
    Object.keys(p.models || {}).map((modelId: string) => ({
      modelId,
      providerId: p.id,
    })),
  );
});

const health = os.opencode.health.handler(async () => {
  const result = await opencodeClient.global.health();
  if (result.error) throw result.error;
  return result.data ?? {};
});

const sttTranscribe = os.stt.transcribe.handler(async ({ input, signal }) => {
  const formData = new FormData();
  formData.append("file", input.audio, "audio.wav");
  formData.append("response_format", "json");
  if (serverEnv.stt.model) {
    formData.append("model", serverEnv.stt.model);
  }
  if (serverEnv.stt.language) {
    formData.append("language", serverEnv.stt.language);
  }

  const res = await fetch(`${serverEnv.stt.baseUrl}/v1/audio/transcriptions`, {
    method: "POST",
    headers: serverAuthHeaders.stt,
    body: formData,
    signal,
  });

  if (!res.ok) {
    throw new Error(`STT failed: ${res.status}`);
  }

  return res.json();
});

const ttsSynthesize = os.tts.synthesize.handler(async ({ input, signal }) => {
  const res = await fetch(`${serverEnv.tts.baseUrl}/v1/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...serverAuthHeaders.tts,
    },
    body: JSON.stringify({
      model: serverEnv.tts.model,
      input: input.text,
      voice: input.voice ?? serverEnv.tts.defaultVoice,
      response_format: input.format ?? serverEnv.tts.defaultFormat,
    }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`TTS failed: ${res.status}`);
  }

  const audioBlob = await res.blob();
  return { audio: audioBlob };
});

const sseEvents = os.sse.events.handler(async function* () {
  const events = await opencodeClient.event.subscribe();

  for await (const event of events.stream) {
    yield event;
  }
});

export const router = os.router({
  opencode: {
    session: {
      create: sessionCreate,
      list: sessionList,
      get: sessionGet,
      update: sessionUpdate,
      delete: sessionDelete,
      abort: sessionAbort,
    },
    message: {
      send: messageSend,
      list: messageList,
    },
    config: {
      providers: configProviders,
      models: configModels,
    },
    health: health,
  },
  stt: {
    transcribe: sttTranscribe,
  },
  tts: {
    synthesize: ttsSynthesize,
  },
  sse: {
    events: sseEvents,
  },
});

export type Router = typeof router;

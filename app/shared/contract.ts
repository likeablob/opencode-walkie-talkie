import type { Event } from "@opencode-ai/sdk/v2";

import { eventIterator, oc } from "@orpc/contract";
import * as z from "zod";

const SessionSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
});

const SessionInfoSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  slug: z.string(),
  directory: z.string().optional(),
  time: z.object({
    created: z.number(),
    updated: z.number(),
  }),
});

const MessagePartSchema = z
  .object({
    type: z.string(),
    id: z.string().optional(),
    text: z.string().optional(),
  })
  .catchall(z.unknown());

const MessageInfoSchema = z
  .object({
    id: z.string(),
    role: z.enum(["user", "assistant"]),
    sessionID: z.string(),
    time: z
      .object({
        created: z.number(),
        completed: z.number().optional(),
      })
      .optional(),
  })
  .catchall(z.unknown());

const MessageSchema = z
  .object({
    info: MessageInfoSchema.optional(),
    parts: z.array(MessagePartSchema),
  })
  .catchall(z.unknown());

const TranscriptionSchema = z.object({
  text: z.string(),
});

const ProviderSchema = z.object({
  name: z.string(),
  models: z.record(z.string(), z.unknown()).optional(),
});

const ConfigProvidersResponseSchema = z.object({
  providers: z.array(ProviderSchema),
  default: z.record(z.string(), z.string()).optional(),
});

const ModelInfoSchema = z.object({
  modelId: z.string(),
  providerId: z.string(),
});

const EventSchema = z.custom<Event>();

const HealthSchema = z.object({
  healthy: z.literal(true).optional(),
  version: z.string().optional(),
});

const MessageSendResponseSchema = z.object({
  success: z.boolean(),
});

const sessionCreateContract = oc
  .input(z.object({ title: z.string().optional() }).optional())
  .output(SessionSchema);

const sessionListContract = oc
  .input(z.object({ directory: z.string().optional() }).optional())
  .output(z.array(SessionInfoSchema));

const sessionGetContract = oc.input(z.object({ sessionId: z.string() })).output(SessionSchema);

const sessionUpdateContract = oc
  .input(z.object({ sessionId: z.string(), title: z.string() }))
  .output(SessionSchema);

const sessionDeleteContract = oc
  .input(z.object({ sessionId: z.string() }))
  .output(z.object({ success: z.boolean() }));

const sessionAbortContract = oc
  .input(z.object({ sessionId: z.string() }))
  .output(z.object({ success: z.boolean() }));

const messageSendContract = oc
  .input(
    z.object({
      sessionId: z.string(),
      parts: z.array(z.object({ type: z.literal("text"), text: z.string() })),
      agent: z.string().optional(),
      model: z
        .object({
          modelID: z.string(),
          providerID: z.string(),
        })
        .optional(),
    }),
  )
  .output(MessageSendResponseSchema);

const messageListContract = oc
  .input(z.object({ sessionId: z.string() }))
  .output(z.array(MessageSchema));

const configProvidersContract = oc.output(ConfigProvidersResponseSchema);

const configModelsContract = oc.output(z.array(ModelInfoSchema));

const healthContract = oc.output(HealthSchema);

const sttTranscribeContract = oc
  // TODO: Investigate Blob SSR compatibility - z.instanceof(Blob) may fail in SSR context
  .input(z.object({ audio: z.instanceof(Blob) }))
  .output(TranscriptionSchema);

const ttsSynthesizeContract = oc
  .input(
    z.object({
      text: z.string(),
      voice: z.string().optional(),
      format: z.enum(["wav", "mp3"]).optional(),
    }),
  )
  // TODO: Investigate Blob SSR compatibility - z.instanceof(Blob) may fail in SSR context
  .output(z.object({ audio: z.instanceof(Blob) }));

const sseEventsContract = oc.output(eventIterator(EventSchema));

export const contract = {
  opencode: {
    session: {
      create: sessionCreateContract,
      list: sessionListContract,
      get: sessionGetContract,
      update: sessionUpdateContract,
      delete: sessionDeleteContract,
      abort: sessionAbortContract,
    },
    message: {
      send: messageSendContract,
      list: messageListContract,
    },
    config: {
      providers: configProvidersContract,
      models: configModelsContract,
    },
    health: healthContract,
  },
  stt: {
    transcribe: sttTranscribeContract,
  },
  tts: {
    synthesize: ttsSynthesizeContract,
  },
  sse: {
    events: sseEventsContract,
  },
};

export type Contract = typeof contract;

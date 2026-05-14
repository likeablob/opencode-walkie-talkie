import { createOpencodeClient, OpencodeClient } from "@opencode-ai/sdk/v2";

const OPENCODE_URL = process.env.OPENCODE_URL ?? "http://127.0.0.1:4096";
const OPENCODE_SERVER_PASSWORD = process.env.OPENCODE_SERVER_PASSWORD ?? "";
const OPENCODE_DIRECTORY = process.env.OPENCODE_DIRECTORY ?? process.cwd();
const OPENAI_STT_BASEURL = process.env.OPENAI_STT_BASEURL ?? "http://127.0.0.1:8816";
const OPENAI_STT_API_KEY = process.env.OPENAI_STT_API_KEY ?? "";
const OPENAI_STT_MODEL = process.env.OPENAI_STT_MODEL ?? "";
const OPENAI_STT_LANGUAGE = process.env.OPENAI_STT_LANGUAGE ?? "";
const OPENAI_TTS_BASEURL = process.env.OPENAI_TTS_BASEURL ?? "http://127.0.0.1:8000";
const OPENAI_TTS_API_KEY = process.env.OPENAI_TTS_API_KEY ?? "";
const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL ?? "tts-1";
const OPENAI_TTS_VOICE = process.env.OPENAI_TTS_VOICE ?? "auto";
const OPENAI_TTS_FORMAT = process.env.OPENAI_TTS_FORMAT ?? "wav";

export const serverEnv = {
  opencode: {
    baseUrl: OPENCODE_URL,
    apiKey: OPENCODE_SERVER_PASSWORD,
    directory: OPENCODE_DIRECTORY,
  },
  stt: {
    baseUrl: OPENAI_STT_BASEURL,
    apiKey: OPENAI_STT_API_KEY,
    model: OPENAI_STT_MODEL,
    language: OPENAI_STT_LANGUAGE,
  },
  tts: {
    baseUrl: OPENAI_TTS_BASEURL,
    apiKey: OPENAI_TTS_API_KEY,
    model: OPENAI_TTS_MODEL,
    defaultVoice: OPENAI_TTS_VOICE,
    defaultFormat: OPENAI_TTS_FORMAT,
  },
};

function getBasicAuthHeader(apiKey: string): Record<string, string> {
  if (!apiKey) return {};
  return { Authorization: `Basic ${Buffer.from(`opencode:${apiKey}`).toString("base64")}` };
}

function getBearerAuthHeader(apiKey: string): Record<string, string> {
  if (!apiKey) return {};
  return { Authorization: `Bearer ${apiKey}` };
}

export const serverAuthHeaders = {
  stt: getBearerAuthHeader(OPENAI_STT_API_KEY),
  tts: getBearerAuthHeader(OPENAI_TTS_API_KEY),
};

export const opencodeClient: OpencodeClient = createOpencodeClient({
  baseUrl: OPENCODE_URL,
  directory: OPENCODE_DIRECTORY,
  headers: getBasicAuthHeader(OPENCODE_SERVER_PASSWORD),
});

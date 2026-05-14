export type Language = "ja" | "en";

export type TranslationKey =
  | "youSaid"
  | "confirm"
  | "accepted"
  | "rejected"
  | "recordingCorrection"
  | "ready"
  | "recording"
  | "converting"
  | "transcribing"
  | "sending"
  | "waiting"
  | "waitingForResponse"
  | "interrupted"
  | "agentStopped"
  | "agentThinking"
  | "tapToStop"
  | "holdToSpeak"
  | "modePlan"
  | "modeBuild"
  | "modelChanged"
  | "playing"
  | "loadingAudio"
  | "settingsAutoMessageTitle"
  | "settingsAutoMessageEnable"
  | "settingsAutoMessageTextJa"
  | "settingsAutoMessageTextEn";

const translations: Record<TranslationKey, Record<Language, string>> = {
  youSaid: {
    ja: "以下の内容を送信します：",
    en: "You said: ",
  },
  confirm: {
    ja: "確認してください",
    en: "Confirm?",
  },
  accepted: {
    ja: "送信しました",
    en: "Accepted",
  },
  rejected: {
    ja: "拒否しました",
    en: "Rejected",
  },
  recordingCorrection: {
    ja: "修正を録音してください",
    en: "Recording correction...",
  },
  ready: {
    ja: "準備完了",
    en: "Ready",
  },
  recording: {
    ja: "録音中",
    en: "Recording",
  },
  converting: {
    ja: "音声変換中...",
    en: "Converting audio...",
  },
  transcribing: {
    ja: "音声認識中...",
    en: "Transcribing...",
  },
  sending: {
    ja: "エージェントに送信中...",
    en: "Sending to agent...",
  },
  waiting: {
    ja: "応答待機中...",
    en: "Waiting for response...",
  },
  waitingForResponse: {
    ja: "応答待機中...",
    en: "Waiting for response...",
  },
  interrupted: {
    ja: "中断しました",
    en: "Interrupted",
  },
  agentStopped: {
    ja: "エージェントを停止しました",
    en: "Agent stopped",
  },
  agentThinking: {
    ja: "エージェント思考中",
    en: "Agent thinking",
  },
  tapToStop: {
    ja: "タップまたはボタンを離して停止",
    en: "Tap or release button to stop",
  },
  holdToSpeak: {
    ja: "ボタン長押しまたはタップで発話開始",
    en: "Hold button or tap to speak",
  },
  modePlan: {
    ja: "プランモード",
    en: "Plan mode",
  },
  modeBuild: {
    ja: "ビルドモード",
    en: "Build mode",
  },
  modelChanged: {
    ja: "モデル",
    en: "Model",
  },
  playing: {
    ja: "再生中",
    en: "Playing",
  },
  loadingAudio: {
    ja: "音声読み込み中",
    en: "Loading audio",
  },
  settingsAutoMessageTitle: {
    ja: "初回メッセージ自動追加",
    en: "Auto Message on First Send",
  },
  settingsAutoMessageEnable: {
    ja: "有効",
    en: "Enable",
  },
  settingsAutoMessageTextJa: {
    ja: "日本語メッセージ",
    en: "Japanese Message",
  },
  settingsAutoMessageTextEn: {
    ja: "英語メッセージ",
    en: "English Message",
  },
};

export function getLocalizedText(key: string, language: Language, transcription?: string): string {
  if (!(key in translations)) {
    return key;
  }
  const tKey = key as TranslationKey;
  const text = translations[tKey]?.[language] || translations[tKey]?.["ja"] || key;

  if (key === "youSaid" && transcription) {
    return text + transcription;
  }

  return text;
}

export { translations };

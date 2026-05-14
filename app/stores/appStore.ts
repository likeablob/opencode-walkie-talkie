import { toMerged } from "es-toolkit";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

export type AudioState = "idle" | "recording" | "playing" | "loading";

export type InputState =
  | "idle"
  | "recording"
  | "confirming"
  | "refining"
  | "sending"
  | "waiting"
  | "processing";

export type AgentMode = "plan" | "build";

export type LogDisplay = "latest" | "full";

export type Transaction = {
  id: string;
  timestamp: Date;
  type: "user" | "agent";
  text: string;
};

export type ModelInfo = {
  modelId: string;
  providerId: string;
};

export type SessionInfo = {
  id: string;
  title?: string;
  slug: string;
  directory?: string;
  time: {
    created: number;
    updated: number;
  };
};

export type GamepadConfig = {
  ptt: number | null;
  accept: number | null;
  reject: number | null;
  interrupt: number | null;
  modeToggle: number | null;
  modelCycle: number | null;
};

export type GamepadState = {
  connected: boolean;
  index: number | null;
  id: string | null;
  buttons: boolean[];
  axes: number[];
};

export type AutoMessageSettings = {
  enabled: boolean;
  textJa: string;
  textEn: string;
};

const DEFAULT_AUTO_MESSAGE: AutoMessageSettings = {
  enabled: false,
  textJa: "これは音声セッションです。音声認識のエラーを考慮して返信してください。",
  textEn: "This is a voice session. Please consider speech recognition errors when replying.",
};

const DEFAULT_GAMEPAD_CONFIG: GamepadConfig = {
  ptt: 1,
  accept: 3,
  reject: 2,
  interrupt: 0,
  modeToggle: 9,
  modelCycle: 8,
};

export type AppState = {
  audio: {
    state: AudioState;
    currentTranscription: string | null;
    refinedText: string | null;
  };
  input: {
    state: InputState;
    history: string[];
  };
  session: {
    id: string | null;
    title: string | null;
    model: ModelInfo | null;
    mode: AgentMode;
    availableModels: ModelInfo[];
    filteredModelIds: string[];
    sessionList: SessionInfo[];
  };
  agent: {
    isRunning: boolean;
    lastResponse: string | null;
  };
  gamepad: {
    connected: boolean;
    id: string | null;
    config: GamepadConfig;
  };
  audioDevices: {
    selectedDeviceId: string | null;
  };
  ui: {
    wakeLockActive: boolean;
    locked: boolean;
    logDisplay: LogDisplay;
    language: "ja" | "en";
  };
  settings: {
    autoMessage: AutoMessageSettings;
  };
  transactions: Transaction[];
};

const initialState: AppState = {
  audio: {
    state: "idle",
    currentTranscription: null,
    refinedText: null,
  },
  input: {
    state: "idle",
    history: [],
  },
  session: {
    id: null,
    title: null,
    model: null,
    mode: "build",
    availableModels: [],
    filteredModelIds: [],
    sessionList: [],
  },
  agent: {
    isRunning: false,
    lastResponse: null,
  },
  gamepad: {
    connected: false,
    id: null,
    config: DEFAULT_GAMEPAD_CONFIG,
  },
  audioDevices: {
    selectedDeviceId: null,
  },
  ui: {
    wakeLockActive: false,
    locked: false,
    logDisplay: "latest",
    language: "en",
  },
  settings: {
    autoMessage: DEFAULT_AUTO_MESSAGE,
  },
  transactions: [],
};

type AppActions = {
  setAudioState: (state: AudioState) => void;
  setTranscription: (text: string | null) => void;
  setRefinedText: (text: string | null) => void;
  setInputState: (state: InputState) => void;
  addInputHistory: (text: string) => void;
  setSessionId: (id: string | null) => void;
  setSessionTitle: (title: string | null) => void;
  setSessionList: (sessions: SessionInfo[]) => void;
  setModel: (model: ModelInfo | null) => void;
  setMode: (mode: AgentMode) => void;
  setAvailableModels: (models: ModelInfo[]) => void;
  setFilteredModelIds: (ids: string[]) => void;
  toggleModelFilter: (modelId: string) => void;
  cycleModel: () => void;
  setAgentRunning: (running: boolean) => void;
  setLastResponse: (response: string | null) => void;
  setGamepadConnected: (connected: boolean, id: string | null) => void;
  setGamepadConfig: (config: GamepadConfig) => void;
  setSelectedAudioDevice: (deviceId: string | null) => void;
  setWakeLock: (active: boolean) => void;
  setLock: (locked: boolean) => void;
  toggleLock: () => void;
  setLogDisplay: (display: LogDisplay) => void;
  setLanguage: (language: "ja" | "en") => void;
  cycleLogDisplay: () => void;
  addTransaction: (transaction: Transaction) => void;
  clearTransactions: () => void;
  setAutoMessageSettings: (settings: AutoMessageSettings) => void;
  reset: () => void;
};

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setAudioState: (state) => set((s) => ({ audio: { ...s.audio, state } })),

        setTranscription: (text) =>
          set((s) => ({ audio: { ...s.audio, currentTranscription: text } })),

        setRefinedText: (text) => set((s) => ({ audio: { ...s.audio, refinedText: text } })),

        setInputState: (state) => set((s) => ({ input: { ...s.input, state } })),

        addInputHistory: (text) =>
          set((s) => ({ input: { ...s.input, history: [...s.input.history, text] } })),

        setSessionId: (id) => set((s) => ({ session: { ...s.session, id } })),

        setSessionTitle: (title) => set((s) => ({ session: { ...s.session, title } })),

        setSessionList: (sessions) =>
          set((s) => ({ session: { ...s.session, sessionList: sessions } })),

        setModel: (model) => set((s) => ({ session: { ...s.session, model } })),

        setMode: (mode) => set((s) => ({ session: { ...s.session, mode } })),

        setAvailableModels: (models) =>
          set((s) => ({ session: { ...s.session, availableModels: models } })),

        setFilteredModelIds: (ids) =>
          set((s) => ({ session: { ...s.session, filteredModelIds: ids } })),

        toggleModelFilter: (modelId) =>
          set((s) => {
            const filtered = s.session.filteredModelIds;
            const exists = filtered.includes(modelId);
            const newFiltered = exists
              ? filtered.filter((id) => id !== modelId)
              : [...filtered, modelId];
            return { session: { ...s.session, filteredModelIds: newFiltered } };
          }),

        cycleModel: () =>
          set((s) => {
            const models =
              s.session.filteredModelIds.length > 0
                ? s.session.availableModels.filter((m) =>
                    s.session.filteredModelIds.includes(m.modelId),
                  )
                : s.session.availableModels;
            if (models.length === 0) return s;
            const currentIdx = models.findIndex((m) => m.modelId === s.session.model?.modelId);
            const nextIdx = (currentIdx + 1) % models.length;
            return { session: { ...s.session, model: models[nextIdx] } };
          }),

        setAgentRunning: (running) => set((s) => ({ agent: { ...s.agent, isRunning: running } })),

        setLastResponse: (response) =>
          set((s) => ({ agent: { ...s.agent, lastResponse: response } })),

        setGamepadConnected: (connected, id) =>
          set((s) => ({ gamepad: { ...s.gamepad, connected, id } })),

        setGamepadConfig: (config) => set((s) => ({ gamepad: { ...s.gamepad, config } })),

        setSelectedAudioDevice: (deviceId) =>
          set((s) => ({ audioDevices: { ...s.audioDevices, selectedDeviceId: deviceId } })),

        setWakeLock: (active) => set((s) => ({ ui: { ...s.ui, wakeLockActive: active } })),

        setLock: (locked) => set((s) => ({ ui: { ...s.ui, locked } })),

        toggleLock: () => set((s) => ({ ui: { ...s.ui, locked: !s.ui.locked } })),

        setLogDisplay: (display) => set((s) => ({ ui: { ...s.ui, logDisplay: display } })),

        setLanguage: (language) => set((s) => ({ ui: { ...s.ui, language } })),

        cycleLogDisplay: () =>
          set((s) => {
            const modes: LogDisplay[] = ["latest", "full"];
            const currentIdx = modes.indexOf(s.ui.logDisplay);
            const nextIdx = (currentIdx + 1) % modes.length;
            return { ui: { ...s.ui, logDisplay: modes[nextIdx] } };
          }),

        addTransaction: (transaction) =>
          set((s) => ({ transactions: [...s.transactions, transaction] })),

        clearTransactions: () => set({ transactions: [] }),

        setAutoMessageSettings: (settings) =>
          set((s) => ({ settings: { ...s.settings, autoMessage: settings } })),

        reset: () => set(initialState),
      }),
      {
        name: "walkie-talkie-store",
        storage: createJSONStorage(() => localStorage),
        merge: (persistedState, currentState) =>
          toMerged(currentState, persistedState as Partial<AppStore>),
        partialize: (state) => ({
          session: {
            id: state.session.id,
            title: state.session.title,
            model: state.session.model,
            mode: state.session.mode,
            filteredModelIds: state.session.filteredModelIds,
          },
          ui: {
            language: state.ui.language,
          },
          gamepad: {
            config: state.gamepad.config,
          },
          audioDevices: {
            selectedDeviceId: state.audioDevices.selectedDeviceId,
          },
          settings: {
            autoMessage: state.settings.autoMessage,
          },
        }),
      },
    ),
    { name: "AppStore" },
  ),
);

export const appStore = useAppStore;

export function loadGamepadConfig(): GamepadConfig {
  return useAppStore.getState().gamepad.config;
}

export function saveGamepadConfig(config: GamepadConfig): void {
  useAppStore.getState().setGamepadConfig(config);
}

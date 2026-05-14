import type { Route } from "./+types/home";
import type { AssistantMessage } from "@opencode-ai/sdk/v2";
import type { ActionExecutorDeps } from "~/lib/ActionExecutor";
import type { Language } from "~/lib/i18n";
import type { GamepadConfig, Transaction } from "~/stores/appStore";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  AgentResponseCard,
  ControlBar,
  ControlButtons,
  ConversationLog,
  getPTTStatus,
  Header,
  LockOverlay,
  ModeModelSelector,
  PTTButton,
  SessionFooter,
  SessionListDialog,
  SettingsDialog,
  TranscriptionCard,
} from "~/components/walkie";
import {
  useAudioPlayback,
  useAudioRecorder,
  useOpenCode,
  useSSE,
  useSTT,
  useTTS,
  useWakeLock,
} from "~/hooks";
import { useAudioDevices } from "~/hooks/useAudioDevices";
import { useGamepadFSM } from "~/hooks/useGamepadFSM";
import { useSoundEffects } from "~/hooks/useSoundEffects";
import { convertWebmToWav } from "~/lib/audioUtils";
import { AuxiliaryControls } from "~/lib/AuxiliaryControls";
import { GamepadFSMController } from "~/lib/GamepadFSMController";
import { getLocalizedText } from "~/lib/i18n";
import { useAppStore } from "~/stores/appStore";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "OpenCode Walkie-Talkie" },
    { name: "description", content: "Hands-free voice interface for OpenCode" },
  ];
}

export default function Home() {
  const language = useAppStore((s) => s.ui.language);
  const currentTranscription = useAppStore((s) => s.audio.currentTranscription);
  const audioState = useAppStore((s) => s.audio.state);
  const sessionId = useAppStore((s) => s.session.id);
  const sessionModel = useAppStore((s) => s.session.model);
  const sessionMode = useAppStore((s) => s.session.mode);
  const sessionTitle = useAppStore((s) => s.session.title);
  const sessionFilteredModelIds = useAppStore((s) => s.session.filteredModelIds);
  const sessionList = useAppStore((s) => s.session.sessionList);
  const agentIsRunning = useAppStore((s) => s.agent.isRunning);
  const agentLastResponse = useAppStore((s) => s.agent.lastResponse);
  const uiLogDisplay = useAppStore((s) => s.ui.logDisplay);
  const uiLocked = useAppStore((s) => s.ui.locked);
  const availableModels = useAppStore((s) => s.session.availableModels);
  const transactions = useAppStore((s) => s.transactions);
  const autoMessageSettings = useAppStore((s) => s.settings.autoMessage);

  const setTranscription = useAppStore((s) => s.setTranscription);
  const setSessionId = useAppStore((s) => s.setSessionId);
  const setSessionTitle = useAppStore((s) => s.setSessionTitle);
  const setSessionList = useAppStore((s) => s.setSessionList);
  const setModel = useAppStore((s) => s.setModel);
  const setMode = useAppStore((s) => s.setMode);
  const setAvailableModels = useAppStore((s) => s.setAvailableModels);
  const setAgentRunning = useAppStore((s) => s.setAgentRunning);
  const setLastResponse = useAppStore((s) => s.setLastResponse);
  const setGamepadConnected = useAppStore((s) => s.setGamepadConnected);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const cycleLogDisplay = useAppStore((s) => s.cycleLogDisplay);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const clearTransactions = useAppStore((s) => s.clearTransactions);
  const cycleModel = useAppStore((s) => s.cycleModel);
  const setAutoMessageSettings = useAppStore((s) => s.setAutoMessageSettings);

  const audioDevices = useAudioDevices();
  const recorder = useAudioRecorder(audioDevices.selectedDeviceId);
  const playback = useAudioPlayback();
  const wakeLock = useWakeLock();
  const sse = useSSE();
  const stt = useSTT();
  const tts = useTTS();
  const opencode = useOpenCode();
  const soundEffects = useSoundEffects();

  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [sessionListDialogOpen, setSessionListDialogOpen] = useState(false);

  const gamepadConfig = useAppStore((s) => s.gamepad.config);
  const setGamepadConfig = useAppStore((s) => s.setGamepadConfig);

  const sessionIdRef = useRef<string | null>(null);
  const transactionIdRef = useRef(0);
  const initializedRef = useRef(false);
  const streamingPartsRef = useRef<Map<string, string>>(new Map());
  const lastAgentTextRef = useRef<string | null>(null);
  const messageRoleMapRef = useRef<Map<string, "user" | "assistant">>(new Map());
  const assistantTextPartsRef = useRef<Map<string, string>>(new Map());

  const t = useCallback(
    (key: string, transcription?: string) => getLocalizedText(key, language, transcription),
    [language],
  );

  const sendToAgent = useCallback(
    async (text?: string) => {
      const inputText = text ?? currentTranscription;
      if (!sessionIdRef.current || !inputText) return;

      const isEmptySession = transactions.length === 0;
      const autoPrefix =
        isEmptySession && autoMessageSettings.enabled
          ? `[${language === "ja" ? autoMessageSettings.textJa : autoMessageSettings.textEn}]\n\n`
          : "";
      const finalText = autoPrefix + inputText;

      const tx: Transaction = {
        id: `tx-${++transactionIdRef.current}`,
        timestamp: new Date(),
        type: "user",
        text: inputText,
      };
      addTransaction(tx);

      setStatusMessage(t("waiting"));

      opencode
        .sendMessage(
          sessionIdRef.current,
          [{ type: "text", text: finalText }],
          sessionMode === "plan" ? "plan" : "build",
          sessionModel
            ? {
                modelID: sessionModel.modelId,
                providerID: sessionModel.providerId,
              }
            : undefined,
        )
        .catch((err) => {
          console.error("Send error:", err);
          setStatusMessage(`Send error: ${err}`);
        });

      setTranscription(null);
    },
    [
      sessionModel,
      sessionMode,
      currentTranscription,
      addTransaction,
      setTranscription,
      opencode,
      t,
      transactions,
      autoMessageSettings,
      language,
    ],
  );

  const fsmDeps: ActionExecutorDeps = {
    recorder,
    playback,
    tts,
    soundEffects,
    sendToAgent,
    opencode: {
      abort: opencode.abort,
      abortSession: opencode.abortSession,
    },
    t,
  };

  const loadSessions = useCallback(async () => {
    try {
      const sessions = await opencode.listSessions();
      setSessionList(Array.isArray(sessions) ? sessions : []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
      setSessionList([]);
    }
  }, [opencode, setSessionList]);

  const fsm = useGamepadFSM(fsmDeps);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      try {
        const models = await opencode.getModels();
        setAvailableModels(models);

        const storedSessionId = useAppStore.getState().session.id;
        const storedFilteredIds = useAppStore.getState().session.filteredModelIds;

        const filteredModels =
          storedFilteredIds.length > 0
            ? models.filter((m) => storedFilteredIds.includes(m.modelId))
            : models;

        if (filteredModels.length > 0 && !useAppStore.getState().session.model) {
          setModel(filteredModels[0]);
        }

        if (storedSessionId) {
          try {
            const sessionInfo = await opencode.getSession(storedSessionId);
            sessionIdRef.current = storedSessionId;
            setSessionTitle(sessionInfo.title ?? null);

            const messages = await opencode.getMessages(storedSessionId);
            if (messages !== null && messages.length > 0) {
              messages.forEach((msg, index) => {
                const role = msg.info?.role;
                if (!role) return;

                const transaction: Transaction = {
                  id: msg.info?.id || `history-${index}`,
                  timestamp: msg.info?.time?.created ? new Date(msg.info.time.created) : new Date(),
                  type: role === "user" ? "user" : "agent",
                  text: msg.parts
                    .filter((part) => part.type === "text" && part.text)
                    .map((part) => part.text)
                    .join("\n"),
                };

                if (transaction.text) {
                  addTransaction(transaction);
                }
              });

              transactionIdRef.current = messages.length;

              setStatusMessage(t("ready"));
              sse.connect();
              loadSessions();
              return;
            } else if (messages !== null) {
              setStatusMessage(t("ready"));
              sse.connect();
              loadSessions();
              return;
            }
          } catch {
            useAppStore.getState().setSessionId(null);
          }
        }

        const session = await opencode.createSession();
        sessionIdRef.current = session.id;
        setSessionId(session.id);
        setSessionTitle(session.title ?? null);

        sse.connect();
        setStatusMessage(t("ready"));

        loadSessions();
      } catch (err) {
        setStatusMessage(`Init error: ${err}`);
      }
    };

    init();

    return () => {
      sse.disconnect();
    };
  }, [
    opencode,
    setAvailableModels,
    setModel,
    setSessionId,
    setSessionTitle,
    addTransaction,
    sse,
    t,
    loadSessions,
  ]);

  useEffect(() => {
    setGamepadConnected(fsm.gamepadState.connected, fsm.gamepadState.id);
  }, [fsm.gamepadState.connected, fsm.gamepadState.id, setGamepadConnected]);

  const handleModeToggle = useCallback(async () => {
    const newMode = sessionMode === "plan" ? "build" : "plan";
    setMode(newMode);

    const modeText = newMode === "plan" ? "modePlan" : "modeBuild";
    const text = t(modeText);
    const audioBuffer = await tts.synthesizeDecoded(text, { cache: true });
    playback.enqueue(audioBuffer, "interrupt");

    setStatusMessage(`Mode: ${newMode}`);
  }, [sessionMode, setMode, tts, playback, t]);

  const handleModelCycle = useCallback(async () => {
    if (availableModels.length === 0) return;

    const currentModel = sessionModel;
    if (!currentModel) return;

    cycleModel();

    const nextModel = useAppStore.getState().session.model;
    if (!nextModel) return;

    const text = `${t("modelChanged")} ${nextModel.modelId}`;
    const audioBuffer = await tts.synthesizeDecoded(text, { cache: true });
    playback.enqueue(audioBuffer, "interrupt");

    setStatusMessage(`Model: ${nextModel.modelId}`);
  }, [availableModels, sessionModel, cycleModel, tts, playback, t]);

  const handleDisplayToggle = useCallback(() => {
    cycleLogDisplay();
    const modes = ["latest", "full"];
    const nextMode = modes[(modes.indexOf(uiLogDisplay) + 1) % modes.length];
    setStatusMessage(`Log display: ${nextMode === "latest" ? "Latest" : "Full"}`);
  }, [uiLogDisplay, cycleLogDisplay]);

  const auxControlsRef = useRef(new AuxiliaryControls());

  useEffect(() => {
    const buttons = fsm.gamepadState.buttons;
    if (
      !fsm.gamepadState.connected ||
      buttons.length === 0 ||
      GamepadFSMController.getInstance().isDisabled()
    ) {
      auxControlsRef.current.reset();
      return;
    }

    const config = useAppStore.getState().gamepad.config;
    const actions = auxControlsRef.current.poll(buttons, config);

    actions.forEach((action) => {
      switch (action) {
        case "modeToggle":
          handleModeToggle();
          break;
        case "modelCycle":
          handleModelCycle();
          break;
      }
    });
  }, [fsm.gamepadState.buttons, fsm.gamepadState.connected, handleModeToggle, handleModelCycle]);

  const handleRecordingComplete = useCallback(async () => {
    if (!recorder.audioBlob) return;

    try {
      const wavBlob = await convertWebmToWav(recorder.audioBlob);
      const transcription = await stt.transcribe(wavBlob);

      fsm.handleSTTComplete(transcription);
      recorder.clearAudio();
    } catch (err) {
      setStatusMessage(`Error: ${err}`);
      fsm.handleSTTComplete("");
    }
  }, [recorder, stt, fsm, setStatusMessage]);

  useEffect(() => {
    if (recorder.audioBlob && fsm.inputState === "processing") {
      handleRecordingComplete();
    }
  }, [recorder.audioBlob, fsm.inputState, handleRecordingComplete]);

  const speakResponse = useCallback(
    async (text: string) => {
      try {
        useAppStore.getState().setAudioState("loading");
        const audioBuffer = await tts.synthesizeDecoded(text);
        playback.enqueue(audioBuffer, "interrupt");
      } catch (err) {
        setStatusMessage(`TTS error: ${err}`);
        useAppStore.getState().setAudioState("idle");
      }
    },
    [tts, playback],
  );

  useEffect(() => {
    sse.on("message.updated", (evt) => {
      const info = evt.properties.info;
      const role = info.role;
      const messageId = info.id;

      if (messageId && role) {
        messageRoleMapRef.current.set(messageId, role);
      }

      if (role === "assistant" && sessionIdRef.current === evt.properties.sessionID) {
        const assistantInfo = info as AssistantMessage;
        const error = assistantInfo.error;
        const completed = assistantInfo.time?.completed;
        streamingPartsRef.current.clear();
        setAgentRunning(true);

        if (!error && completed) {
          const textParts = assistantTextPartsRef.current.get(messageId || "");
          if (textParts) {
            const tx: Transaction = {
              id: `tx-${++transactionIdRef.current}`,
              timestamp: new Date(),
              type: "agent",
              text: textParts,
            };
            addTransaction(tx);
            speakResponse(textParts);
            assistantTextPartsRef.current.delete(messageId || "");
            lastAgentTextRef.current = null;
            streamingPartsRef.current.clear();
            fsm.handleAgentResponseComplete();
          }
        }
      }
    });

    sse.on("message.part.delta", (evt) => {
      const { sessionID, partID, delta, field } = evt.properties;

      if (sessionIdRef.current !== sessionID) return;
      if (!delta || field !== "text") return;

      const currentText = streamingPartsRef.current.get(partID) || "";
      streamingPartsRef.current.set(partID, currentText + delta);

      const fullText = Array.from(streamingPartsRef.current.values())
        .filter((t) => t.length > 0)
        .join("\n");

      if (fullText) {
        setLastResponse(fullText);
      }
    });

    sse.on("session.status", async (evt) => {
      if (sessionIdRef.current !== evt.properties.sessionID) return;

      if (evt.properties.status.type === "busy") {
        setAgentRunning(true);
      } else if (evt.properties.status.type === "idle") {
        setAgentRunning(false);
      }
    });

    sse.on("message.part.updated", (evt) => {
      const part = evt.properties.part;

      if (part.type !== "text") return;
      const messageId = part.messageID;
      const role = messageId ? messageRoleMapRef.current.get(messageId) : undefined;
      const partText = part.text;

      if (partText && role === "assistant" && sessionIdRef.current === evt.properties.sessionID) {
        assistantTextPartsRef.current.set(messageId, partText);
        lastAgentTextRef.current = partText;
        setLastResponse(partText);
      }
    });

    sse.on("session.idle", async (evt) => {
      if (sessionIdRef.current !== evt.properties.sessionID) return;

      streamingPartsRef.current.clear();
      lastAgentTextRef.current = null;

      const isRunning = useAppStore.getState().agent.isRunning;
      if (!isRunning) return;

      fsm.handleAgentResponseComplete();
    });

    sse.on("session.updated", async (evt) => {
      const sessionId = evt.properties.sessionID;
      const title = evt.properties.info?.title;

      if (sessionId !== sessionIdRef.current || !title) return;

      if (!title.startsWith("OWT:")) {
        const updated = await opencode.updateSession(sessionId, `OWT: ${title}`);
        setSessionTitle(updated.title ?? null);
      } else {
        setSessionTitle(title);
      }
    });

    sse.on("connected", () => {
      console.log("SSE connected");
    });

    sse.on("error", (err: unknown) => {
      console.error("SSE error:", err);
    });
  }, [
    sse,
    speakResponse,
    setLastResponse,
    addTransaction,
    setSessionTitle,
    setAgentRunning,
    fsm,
    opencode,
  ]);

  const handleNewSession = useCallback(async () => {
    try {
      setStatusMessage("Creating new session...");

      const session = await opencode.createSession();
      sessionIdRef.current = session.id;
      setSessionId(session.id);
      setSessionTitle(session.title ?? null);

      clearTransactions();
      setLastResponse(null);
      setTranscription(null);

      setStatusMessage(`New session: ${session.id.slice(0, 8)}`);
    } catch (err) {
      setStatusMessage(`Session error: ${err}`);
    }
  }, [
    opencode,
    setSessionId,
    setSessionTitle,
    clearTransactions,
    setLastResponse,
    setTranscription,
  ]);

  const handleSessionSelect = useCallback(
    async (selectedSessionId: string) => {
      if (selectedSessionId === sessionIdRef.current) return;

      try {
        setStatusMessage("Switching session...");
        sse.disconnect();

        const sessionInfo = await opencode.getSession(selectedSessionId);
        sessionIdRef.current = selectedSessionId;
        setSessionId(selectedSessionId);
        setSessionTitle(sessionInfo.title ?? null);

        clearTransactions();
        setLastResponse(null);
        setTranscription(null);

        const messages = await opencode.getMessages(selectedSessionId);
        if (messages && messages.length > 0) {
          messages.forEach((msg, index) => {
            const role = msg.info?.role;
            if (!role) return;

            const transaction: Transaction = {
              id: msg.info?.id || `history-${index}`,
              timestamp: msg.info?.time?.created ? new Date(msg.info.time.created) : new Date(),
              type: role === "user" ? "user" : "agent",
              text: msg.parts
                .filter((part) => part.type === "text" && part.text)
                .map((part) => part.text)
                .join("\n"),
            };

            if (transaction.text) {
              addTransaction(transaction);
            }
          });

          transactionIdRef.current = messages.length;
        }

        sse.connect();
        setStatusMessage(t("ready"));
      } catch (err) {
        setStatusMessage(`Session switch error: ${err}`);
      }
    },
    [
      opencode,
      sse,
      setSessionId,
      setSessionTitle,
      clearTransactions,
      setLastResponse,
      setTranscription,
      addTransaction,
      t,
    ],
  );

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      setLanguage(lang);
    },
    [setLanguage],
  );

  const handleModelFilterToggle = useCallback((modelId: string) => {
    useAppStore.getState().toggleModelFilter(modelId);
  }, []);

  const handleGamepadConfigChange = useCallback(
    (config: GamepadConfig) => {
      setGamepadConfig(config);
      fsm.setConfig(config);
    },
    [setGamepadConfig, fsm],
  );

  const handleWakeLockToggle = useCallback(async () => {
    if (wakeLock.isLocked) {
      await wakeLock.release();
    } else {
      await wakeLock.request();
    }
  }, [wakeLock]);

  const handleLockToggle = useCallback(() => {
    useAppStore.getState().toggleLock();
  }, []);

  useEffect(() => {
    wakeLock.request();
    // For initial wake lock request on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakeLock.request]);

  // TODO: Consider wrapping in `if (process.env.NODE_ENV === 'development')` for production safety
  useEffect(() => {
    window.debugSendUserText = (text: string) => {
      console.log("[DEBUG] Sending text:", text);
      sendToAgent(text);
    };

    window.debugGetState = () => {
      const state = useAppStore.getState();
      console.log("[DEBUG] Current state:", state);
      return state;
    };

    return () => {
      delete window.debugSendUserText;
      delete window.debugGetState;
    };
  }, [sendToAgent]);

  const status = getPTTStatus(
    recorder.isRecording,
    audioState === "playing",
    audioState === "loading",
    agentIsRunning,
    fsm.inputState,
    t,
  );

  const touchPressStartRef = useRef<number>(0);
  const touchLongPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePTTStart = useCallback(() => {
    const currentAudioState = useAppStore.getState().audio.state;
    if (currentAudioState === "playing") {
      playback.stop();
    }
    touchPressStartRef.current = performance.now();
    const ctrl = GamepadFSMController.getInstance();
    ctrl.injectEvent({ type: "PTT_PRESS", timestamp: performance.now() });

    touchLongPressTimeoutRef.current = setTimeout(() => {
      ctrl.injectEvent({ type: "PTT_LONG_PRESS", timestamp: performance.now() });
      touchLongPressTimeoutRef.current = null;
    }, 500);
  }, [playback]);

  useEffect(() => {
    return () => {
      if (touchLongPressTimeoutRef.current) {
        clearTimeout(touchLongPressTimeoutRef.current);
      }
    };
  }, []);

  const handlePTTEnd = useCallback(() => {
    if (touchLongPressTimeoutRef.current) {
      clearTimeout(touchLongPressTimeoutRef.current);
      touchLongPressTimeoutRef.current = null;
    }

    if (touchPressStartRef.current > 0) {
      const duration = performance.now() - touchPressStartRef.current;
      const ctrl = GamepadFSMController.getInstance();
      ctrl.injectEvent({ type: "PTT_RELEASE", duration, timestamp: performance.now() });
      touchPressStartRef.current = 0;
    }
  }, []);

  return (
    <>
      <LockOverlay locked={uiLocked} />
      <main className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-4 select-none">
        <div className="w-full max-w-sm space-y-4">
          <Header
            title="OpenCode Walkie-Talkie"
            gamepadConnected={fsm.gamepadState.connected}
            gamepadId={fsm.gamepadState.id}
            sseConnectionState={sse.connectionState}
          >
            <div className="absolute top-0 right-0">
              <SettingsDialog
                language={language}
                availableModels={availableModels}
                filteredModelIds={sessionFilteredModelIds}
                gamepadConfig={gamepadConfig}
                gamepadConnected={fsm.gamepadState.connected}
                gamepadButtons={fsm.gamepadState.buttons}
                audioDevices={audioDevices.devices}
                selectedMicDeviceId={audioDevices.selectedDeviceId}
                audioPermissionGranted={audioDevices.permissionGranted}
                autoMessageSettings={autoMessageSettings}
                onOpenChange={(open) => fsm.setDisabled(open)}
                onLanguageChange={handleLanguageChange}
                onModelFilterToggle={handleModelFilterToggle}
                onGamepadConfigChange={handleGamepadConfigChange}
                onMicDeviceChange={audioDevices.selectDevice}
                onAutoMessageSettingsChange={setAutoMessageSettings}
              />
            </div>
          </Header>

          <PTTButton
            isRecording={recorder.isRecording}
            isPlaying={audioState === "playing"}
            isAgentRunning={agentIsRunning}
            inputState={fsm.inputState}
            statusIcon={status.statusIcon}
            statusText={status.statusText}
            subText={recorder.isRecording ? t("tapToStop") : t("holdToSpeak")}
            onPTTStart={handlePTTStart}
            onPTTEnd={handlePTTEnd}
          />

          <ModeModelSelector
            mode={sessionMode}
            model={sessionModel}
            onModeToggle={handleModeToggle}
            onModelCycle={handleModelCycle}
          />

          <ControlButtons
            inputState={fsm.inputState}
            isPlaying={audioState === "playing"}
            isAgentRunning={agentIsRunning}
            onAccept={() => {
              const ctrl = GamepadFSMController.getInstance();
              ctrl.injectEvent({ type: "ACCEPT_PRESS", timestamp: performance.now() });
            }}
            onReject={() => {
              const ctrl = GamepadFSMController.getInstance();
              ctrl.injectEvent({ type: "REJECT_PRESS", timestamp: performance.now() });
            }}
            onInterrupt={() => {
              playback.stop();
              const ctrl = GamepadFSMController.getInstance();
              ctrl.injectEvent({ type: "INTERRUPT_PRESS", timestamp: performance.now() });
            }}
          />

          <TranscriptionCard
            transcription={currentTranscription}
            isProcessing={fsm.inputState === "processing"}
            statusMessage={statusMessage}
          />

          <AgentResponseCard
            isAgentRunning={agentIsRunning}
            lastResponse={agentLastResponse}
            logDisplay={uiLogDisplay}
            waitingText={t("waitingForResponse")}
          />

          <ConversationLog
            transactions={transactions}
            logDisplay={uiLogDisplay}
            onClear={clearTransactions}
          />

          <ControlBar
            logDisplay={uiLogDisplay}
            wakeLockActive={wakeLock.isLocked}
            locked={uiLocked}
            onDisplayToggle={handleDisplayToggle}
            onWakeLockToggle={handleWakeLockToggle}
            onLockToggle={handleLockToggle}
          />

          <SessionFooter
            sessionTitle={sessionTitle}
            onNewSession={handleNewSession}
            onOpenSessionList={() => setSessionListDialogOpen(true)}
          />

          <SessionListDialog
            sessions={sessionList}
            currentSessionId={sessionId}
            open={sessionListDialogOpen}
            onOpenChange={setSessionListDialogOpen}
            onSelect={handleSessionSelect}
          />
        </div>
      </main>
    </>
  );
}

import type { SoundEffectName } from "~/hooks/useSoundEffects";
import type { TTSOptions } from "~/hooks/useTTS";
import type { FSMAction } from "~/lib/inputFSM";

import { GamepadFSMController } from "~/lib/GamepadFSMController";
import { useAppStore } from "~/stores/appStore";

export type ActionExecutorDeps = {
  recorder: {
    startRecording: () => void;
    stopRecording: () => void;
    clearAudio: () => void;
    isRecording: boolean;
  };
  playback: {
    enqueue: (source: AudioBuffer, priority: "interrupt") => void;
    stop: () => void;
    isPlaying: boolean;
  };
  tts: {
    synthesizeDecoded: (text: string, options?: TTSOptions) => Promise<AudioBuffer>;
    abort: () => void;
  };
  soundEffects: {
    play: (sound: SoundEffectName) => void;
  };
  sendToAgent: (text?: string) => void;
  opencode: {
    abort: () => void;
    abortSession: (sessionId: string) => Promise<{ success: boolean }>;
  };
  t: (key: string, transcription?: string) => string;
};

export class ActionExecutor {
  private acceptTimeout: ReturnType<typeof setTimeout> | null = null;
  private getDeps: () => ActionExecutorDeps;

  constructor(getDeps: () => ActionExecutorDeps) {
    this.getDeps = getDeps;
  }

  private get deps(): ActionExecutorDeps {
    return this.getDeps();
  }

  async execute(actions: FSMAction[]): Promise<void> {
    console.log(
      "[ActionExecutor] Executing actions:",
      actions.map((a) => a.type),
    );

    for (const action of actions) {
      await this.executeAction(action);
    }
  }

  private async executeAction(action: FSMAction): Promise<void> {
    switch (action.type) {
      case "START_RECORDING":
        if (!this.deps.recorder.isRecording) {
          this.deps.recorder.startRecording();
        }
        break;

      case "STOP_RECORDING":
        if (this.deps.recorder.isRecording) {
          this.deps.recorder.stopRecording();
        }
        break;

      case "PLAY_TTS":
        await this.playTTS(action.text, action.priority);
        break;

      case "CLEAR_TRANSCRIPTION":
        useAppStore.getState().setTranscription(null);
        this.deps.recorder.clearAudio();
        break;

      case "SET_TRANSCRIPTION":
        useAppStore.getState().setTranscription(action.text);
        break;

      case "SEND_TO_AGENT": {
        const transcription = useAppStore.getState().audio.currentTranscription;
        if (transcription) {
          this.deps.sendToAgent(transcription);
        }
        break;
      }

      case "INTERRUPT_AGENT": {
        this.deps.playback.stop();
        this.deps.tts.abort();
        this.deps.opencode.abort();
        const sessionId = useAppStore.getState().session.id;
        if (sessionId) {
          // fire-and-forget
          this.deps.opencode.abortSession(sessionId);
        }
        useAppStore.getState().setAgentRunning(false);
        break;
      }

      case "SET_INPUT_STATE":
        useAppStore.getState().setInputState(action.state);
        break;

      case "SCHEDULE_ACCEPT":
        this.cancelAcceptTimeout();
        this.acceptTimeout = setTimeout(() => {
          this.handleAccept();
        }, action.duration);
        break;

      case "CANCEL_SCHEDULED_ACCEPT":
        this.cancelAcceptTimeout();
        break;

      case "PLAY_SOUND":
        this.deps.soundEffects.play(action.sound);
        break;

      case "STOP_TTS":
        this.deps.playback.stop();
        this.deps.tts.abort();
        break;
    }
  }

  private async playTTS(textKey: string, priority: "interrupt"): Promise<void> {
    let text: string;
    let shouldCache: boolean;

    if (textKey.startsWith("youSaid:")) {
      const transcription = textKey.split(":")[1];
      text = this.deps.t("youSaid", transcription);
      shouldCache = false;
    } else {
      text = this.deps.t(textKey);
      shouldCache = true;
    }

    useAppStore.getState().setAudioState("loading");
    const audioBuffer = await this.deps.tts.synthesizeDecoded(text, { cache: shouldCache });
    this.deps.playback.enqueue(audioBuffer, priority);
  }

  private cancelAcceptTimeout(): void {
    if (this.acceptTimeout !== null) {
      clearTimeout(this.acceptTimeout);
      this.acceptTimeout = null;
    }
  }

  private async handleAccept(): Promise<void> {
    try {
      const ctrl = GamepadFSMController.getInstance();
      ctrl.injectEvent({ type: "ACCEPT_TIMEOUT", timestamp: performance.now() });
    } catch (err) {
      console.error("[ActionExecutor] handleAccept error:", err);
    } finally {
      this.acceptTimeout = null;
    }
  }

  dispose(): void {
    this.cancelAcceptTimeout();
  }
}

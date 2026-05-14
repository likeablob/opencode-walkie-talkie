export type InputState = "idle" | "recording" | "confirming" | "waiting" | "processing";

export type GamepadEvent =
  | { type: "PTT_PRESS"; timestamp: number }
  | { type: "PTT_RELEASE"; duration: number; timestamp: number }
  | { type: "PTT_DOUBLE_CLICK"; timestamp: number }
  | { type: "PTT_LONG_PRESS"; timestamp: number }
  | { type: "ACCEPT_PRESS"; timestamp: number }
  | { type: "REJECT_PRESS"; timestamp: number }
  | { type: "INTERRUPT_PRESS"; timestamp: number }
  | { type: "STT_COMPLETE"; text: string; timestamp: number }
  | { type: "AGENT_RESPONSE_COMPLETE"; timestamp: number }
  | { type: "ACCEPT_TIMEOUT"; timestamp: number };

export type FSMAction =
  | { type: "START_RECORDING" }
  | { type: "STOP_RECORDING" }
  | { type: "PLAY_TTS"; text: string; priority: "interrupt" }
  | { type: "CLEAR_TRANSCRIPTION" }
  | { type: "SET_TRANSCRIPTION"; text: string }
  | { type: "SEND_TO_AGENT" }
  | { type: "INTERRUPT_AGENT" }
  | { type: "SET_INPUT_STATE"; state: InputState }
  | { type: "SCHEDULE_ACCEPT"; duration: number }
  | { type: "CANCEL_SCHEDULED_ACCEPT" }
  | { type: "PLAY_SOUND"; sound: "drop-003" }
  | { type: "STOP_TTS" };

export type TransitionResult = {
  nextState: InputState;
  actions: FSMAction[];
};

export class InputStateMachine {
  transition(state: InputState, event: GamepadEvent): TransitionResult {
    console.log("[FSM] transition:", { state, event: event.type });

    switch (state) {
      case "idle":
        return this.handleIdle(event);

      case "recording":
        return this.handleRecording(event);

      case "confirming":
        return this.handleConfirming(event);

      case "waiting":
        return this.handleWaiting(event);

      case "processing":
        return this.handleProcessing(event);

      default:
        return { nextState: state, actions: [] };
    }
  }

  private handleIdle(event: GamepadEvent): TransitionResult {
    switch (event.type) {
      case "PTT_LONG_PRESS":
        return {
          nextState: "recording",
          actions: [{ type: "PLAY_SOUND", sound: "drop-003" }, { type: "START_RECORDING" }],
        };

      case "PTT_PRESS":
      case "PTT_RELEASE":
        return { nextState: "idle", actions: [] };

      case "INTERRUPT_PRESS":
        return {
          nextState: "idle",
          actions: [{ type: "STOP_TTS" }],
        };

      default:
        return { nextState: "idle", actions: [] };
    }
  }

  private handleRecording(event: GamepadEvent): TransitionResult {
    switch (event.type) {
      case "PTT_PRESS":
        return {
          nextState: "processing",
          actions: [{ type: "STOP_RECORDING" }],
        };

      case "PTT_RELEASE":
        return {
          nextState: "processing",
          actions: [{ type: "STOP_RECORDING" }],
        };

      case "PTT_DOUBLE_CLICK":
        return {
          nextState: "idle",
          actions: [{ type: "STOP_RECORDING" }, { type: "CLEAR_TRANSCRIPTION" }],
        };

      default:
        return { nextState: "recording", actions: [] };
    }
  }

  private handleConfirming(event: GamepadEvent): TransitionResult {
    switch (event.type) {
      case "PTT_RELEASE":
        if (event.duration < 500) {
          return {
            nextState: "confirming",
            actions: [{ type: "SCHEDULE_ACCEPT", duration: 300 }],
          };
        }
        return { nextState: "confirming", actions: [] };

      case "PTT_DOUBLE_CLICK":
        return {
          nextState: "idle",
          actions: [
            { type: "CANCEL_SCHEDULED_ACCEPT" },
            { type: "PLAY_TTS", text: "rejected", priority: "interrupt" },
            { type: "CLEAR_TRANSCRIPTION" },
          ],
        };

      case "PTT_LONG_PRESS":
        return {
          nextState: "recording",
          actions: [
            { type: "CANCEL_SCHEDULED_ACCEPT" },
            { type: "STOP_TTS" },
            { type: "PLAY_SOUND", sound: "drop-003" },
            { type: "CLEAR_TRANSCRIPTION" },
            { type: "START_RECORDING" },
          ],
        };

      case "ACCEPT_PRESS":
        return {
          nextState: "waiting",
          actions: [
            { type: "CANCEL_SCHEDULED_ACCEPT" },
            { type: "STOP_TTS" },
            { type: "PLAY_TTS", text: "accepted", priority: "interrupt" },
            { type: "SEND_TO_AGENT" },
          ],
        };

      case "REJECT_PRESS":
        return {
          nextState: "idle",
          actions: [
            { type: "CANCEL_SCHEDULED_ACCEPT" },
            { type: "PLAY_TTS", text: "rejected", priority: "interrupt" },
            { type: "CLEAR_TRANSCRIPTION" },
          ],
        };

      case "ACCEPT_TIMEOUT":
        return {
          nextState: "waiting",
          actions: [
            { type: "STOP_TTS" },
            { type: "PLAY_TTS", text: "accepted", priority: "interrupt" },
            { type: "SEND_TO_AGENT" },
          ],
        };

      default:
        return { nextState: "confirming", actions: [] };
    }
  }

  private handleWaiting(event: GamepadEvent): TransitionResult {
    switch (event.type) {
      case "PTT_PRESS":
        return {
          nextState: "recording",
          actions: [
            { type: "INTERRUPT_AGENT" },
            { type: "PLAY_SOUND", sound: "drop-003" },
            { type: "START_RECORDING" },
          ],
        };

      case "INTERRUPT_PRESS":
        return {
          nextState: "idle",
          actions: [
            { type: "INTERRUPT_AGENT" },
            { type: "PLAY_TTS", text: "interrupted", priority: "interrupt" },
          ],
        };

      case "AGENT_RESPONSE_COMPLETE":
        return {
          nextState: "idle",
          actions: [],
        };

      default:
        return { nextState: "waiting", actions: [] };
    }
  }

  private handleProcessing(event: GamepadEvent): TransitionResult {
    switch (event.type) {
      case "STT_COMPLETE":
        if (!event.text || event.text.trim() === "") {
          return {
            nextState: "idle",
            actions: [{ type: "CLEAR_TRANSCRIPTION" }],
          };
        }
        return {
          nextState: "confirming",
          actions: [
            { type: "SET_TRANSCRIPTION", text: event.text },
            { type: "PLAY_TTS", text: `youSaid:${event.text}`, priority: "interrupt" },
          ],
        };

      case "PTT_RELEASE":
        return {
          nextState: "idle",
          actions: [{ type: "CLEAR_TRANSCRIPTION" }],
        };

      case "PTT_LONG_PRESS":
        return {
          nextState: "recording",
          actions: [
            { type: "CLEAR_TRANSCRIPTION" },
            { type: "PLAY_SOUND", sound: "drop-003" },
            { type: "START_RECORDING" },
          ],
        };

      default:
        return { nextState: "processing", actions: [] };
    }
  }
}

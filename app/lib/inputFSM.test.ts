import type { GamepadEvent } from "./inputFSM";

import { beforeEach, describe, expect, it } from "vitest";

import { InputStateMachine } from "./inputFSM";

describe("InputStateMachine", () => {
  let fsm: InputStateMachine;

  beforeEach(() => {
    fsm = new InputStateMachine();
  });

  describe("idle state", () => {
    it("should ignore PTT_PRESS (short press disabled)", () => {
      const event: GamepadEvent = { type: "PTT_PRESS", timestamp: 1000 };
      const result = fsm.transition("idle", event);

      expect(result.nextState).toBe("idle");
      expect(result.actions).toEqual([]);
    });

    it("should transition to recording on PTT_LONG_PRESS", () => {
      const event: GamepadEvent = { type: "PTT_LONG_PRESS", timestamp: 1500 };
      const result = fsm.transition("idle", event);

      expect(result.nextState).toBe("recording");
      expect(result.actions).toEqual([
        { type: "PLAY_SOUND", sound: "drop-003" },
        { type: "START_RECORDING" },
      ]);
    });

    it("should ignore PTT_RELEASE in idle state", () => {
      const event: GamepadEvent = { type: "PTT_RELEASE", duration: 100, timestamp: 1000 };
      const result = fsm.transition("idle", event);

      expect(result.nextState).toBe("idle");
      expect(result.actions).toEqual([]);
    });

    it("should ignore other events in idle state", () => {
      const events: GamepadEvent[] = [
        { type: "PTT_DOUBLE_CLICK", timestamp: 1000 },
        { type: "ACCEPT_PRESS", timestamp: 1000 },
      ];

      events.forEach((event) => {
        const result = fsm.transition("idle", event);
        expect(result.nextState).toBe("idle");
        expect(result.actions).toEqual([]);
      });
    });
  });

  describe("recording state", () => {
    it("should transition to processing on PTT_PRESS (safety fallback)", () => {
      const event: GamepadEvent = { type: "PTT_PRESS", timestamp: 1500 };
      const result = fsm.transition("recording", event);

      expect(result.nextState).toBe("processing");
      expect(result.actions).toEqual([{ type: "STOP_RECORDING" }]);
    });

    it("should transition to processing on PTT_RELEASE", () => {
      const event: GamepadEvent = { type: "PTT_RELEASE", duration: 1000, timestamp: 2000 };
      const result = fsm.transition("recording", event);

      expect(result.nextState).toBe("processing");
      expect(result.actions).toEqual([{ type: "STOP_RECORDING" }]);
    });

    it("should transition to idle on PTT_DOUBLE_CLICK", () => {
      const event: GamepadEvent = { type: "PTT_DOUBLE_CLICK", timestamp: 1500 };
      const result = fsm.transition("recording", event);

      expect(result.nextState).toBe("idle");
      expect(result.actions).toContainEqual({ type: "STOP_RECORDING" });
    });

    it("should ignore PTT_LONG_PRESS during recording", () => {
      const event: GamepadEvent = { type: "PTT_LONG_PRESS", timestamp: 2000 };
      const result = fsm.transition("recording", event);

      expect(result.nextState).toBe("recording");
      expect(result.actions).toEqual([]);
    });
  });

  describe("confirming state", () => {
    it("should schedule accept on short PTT_RELEASE (<500ms) and stay in confirming", () => {
      const event: GamepadEvent = { type: "PTT_RELEASE", duration: 200, timestamp: 3000 };
      const result = fsm.transition("confirming", event);

      expect(result.nextState).toBe("confirming");
      expect(result.actions).toContainEqual({ type: "SCHEDULE_ACCEPT", duration: 300 });
    });

    it("should stay in confirming on long PTT_RELEASE (>500ms)", () => {
      const event: GamepadEvent = { type: "PTT_RELEASE", duration: 600, timestamp: 3000 };
      const result = fsm.transition("confirming", event);

      expect(result.nextState).toBe("confirming");
      expect(result.actions).toEqual([]);
    });

    it("should transition to idle on PTT_DOUBLE_CLICK (cancel scheduled accept)", () => {
      const event: GamepadEvent = { type: "PTT_DOUBLE_CLICK", timestamp: 2500 };
      const result = fsm.transition("confirming", event);

      expect(result.nextState).toBe("idle");
      expect(result.actions).toContainEqual({ type: "CANCEL_SCHEDULED_ACCEPT" });
      expect(result.actions).toContainEqual({
        type: "PLAY_TTS",
        text: "rejected",
        priority: "interrupt",
      });
      expect(result.actions).toContainEqual({ type: "CLEAR_TRANSCRIPTION" });
    });

    it("should transition to recording on PTT_LONG_PRESS (cancel scheduled accept)", () => {
      const event: GamepadEvent = { type: "PTT_LONG_PRESS", timestamp: 3000 };
      const result = fsm.transition("confirming", event);

      expect(result.nextState).toBe("recording");
      expect(result.actions).toContainEqual({ type: "CANCEL_SCHEDULED_ACCEPT" });
      expect(result.actions).toContainEqual({ type: "STOP_TTS" });
      expect(result.actions).toContainEqual({ type: "PLAY_SOUND", sound: "drop-003" });
      expect(result.actions).toContainEqual({ type: "CLEAR_TRANSCRIPTION" });
      expect(result.actions).toContainEqual({ type: "START_RECORDING" });
    });

    it("should transition to waiting on ACCEPT_PRESS (cancel scheduled accept)", () => {
      const event: GamepadEvent = { type: "ACCEPT_PRESS", timestamp: 3000 };
      const result = fsm.transition("confirming", event);

      expect(result.nextState).toBe("waiting");
      expect(result.actions).toContainEqual({ type: "CANCEL_SCHEDULED_ACCEPT" });
      expect(result.actions).toContainEqual({
        type: "PLAY_TTS",
        text: "accepted",
        priority: "interrupt",
      });
      expect(result.actions).toContainEqual({ type: "SEND_TO_AGENT" });
    });

    it("should transition to idle on REJECT_PRESS (cancel scheduled accept)", () => {
      const event: GamepadEvent = { type: "REJECT_PRESS", timestamp: 3000 };
      const result = fsm.transition("confirming", event);

      expect(result.nextState).toBe("idle");
      expect(result.actions).toContainEqual({ type: "CANCEL_SCHEDULED_ACCEPT" });
      expect(result.actions).toContainEqual({
        type: "PLAY_TTS",
        text: "rejected",
        priority: "interrupt",
      });
    });

    it("should transition to waiting on ACCEPT_TIMEOUT", () => {
      const event: GamepadEvent = { type: "ACCEPT_TIMEOUT", timestamp: 3500 };
      const result = fsm.transition("confirming", event);

      expect(result.nextState).toBe("waiting");
      expect(result.actions).toContainEqual({
        type: "PLAY_TTS",
        text: "accepted",
        priority: "interrupt",
      });
      expect(result.actions).toContainEqual({ type: "SEND_TO_AGENT" });
    });
  });

  describe("waiting state", () => {
    it("should transition to recording on PTT_PRESS", () => {
      const event: GamepadEvent = { type: "PTT_PRESS", timestamp: 4500 };
      const result = fsm.transition("waiting", event);

      expect(result.nextState).toBe("recording");
      expect(result.actions).toContainEqual({ type: "INTERRUPT_AGENT" });
      expect(result.actions).toContainEqual({ type: "PLAY_SOUND", sound: "drop-003" });
      expect(result.actions).toContainEqual({ type: "START_RECORDING" });
    });

    it("should transition to idle on INTERRUPT_PRESS", () => {
      const event: GamepadEvent = { type: "INTERRUPT_PRESS", timestamp: 4000 };
      const result = fsm.transition("waiting", event);

      expect(result.nextState).toBe("idle");
      expect(result.actions).toContainEqual({ type: "INTERRUPT_AGENT" });
    });

    it("should transition to idle on AGENT_RESPONSE_COMPLETE", () => {
      const event: GamepadEvent = { type: "AGENT_RESPONSE_COMPLETE", timestamp: 5000 };
      const result = fsm.transition("waiting", event);

      expect(result.nextState).toBe("idle");
      expect(result.actions).toEqual([]);
    });
  });

  describe("processing state", () => {
    it("should transition to confirming on STT_COMPLETE with text", () => {
      const event: GamepadEvent = {
        type: "STT_COMPLETE",
        text: "test transcription",
        timestamp: 2500,
      };
      const result = fsm.transition("processing", event);

      expect(result.nextState).toBe("confirming");
      expect(result.actions).toContainEqual({
        type: "SET_TRANSCRIPTION",
        text: "test transcription",
      });
      expect(result.actions).toContainEqual({
        type: "PLAY_TTS",
        text: "youSaid:test transcription",
        priority: "interrupt",
      });
    });

    it("should transition to idle on empty STT_COMPLETE", () => {
      const event: GamepadEvent = {
        type: "STT_COMPLETE",
        text: "",
        timestamp: 2500,
      };
      const result = fsm.transition("processing", event);

      expect(result.nextState).toBe("idle");
      expect(result.actions).toEqual([{ type: "CLEAR_TRANSCRIPTION" }]);
    });

    it("should transition to idle on whitespace-only STT_COMPLETE", () => {
      const event: GamepadEvent = {
        type: "STT_COMPLETE",
        text: "   ",
        timestamp: 2500,
      };
      const result = fsm.transition("processing", event);

      expect(result.nextState).toBe("idle");
      expect(result.actions).toEqual([{ type: "CLEAR_TRANSCRIPTION" }]);
    });

    it("should transition to idle on PTT_RELEASE (cancel)", () => {
      const event: GamepadEvent = { type: "PTT_RELEASE", duration: 200, timestamp: 3000 };
      const result = fsm.transition("processing", event);

      expect(result.nextState).toBe("idle");
      expect(result.actions).toContainEqual({ type: "CLEAR_TRANSCRIPTION" });
    });

    it("should transition to recording on PTT_LONG_PRESS (rerecord safety)", () => {
      const event: GamepadEvent = { type: "PTT_LONG_PRESS", timestamp: 3000 };
      const result = fsm.transition("processing", event);

      expect(result.nextState).toBe("recording");
      expect(result.actions).toContainEqual({ type: "CLEAR_TRANSCRIPTION" });
      expect(result.actions).toContainEqual({ type: "PLAY_SOUND", sound: "drop-003" });
      expect(result.actions).toContainEqual({ type: "START_RECORDING" });
    });
  });
});

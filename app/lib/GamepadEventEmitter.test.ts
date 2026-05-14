import type { GamepadConfig } from "~/stores/appStore";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GamepadEventEmitter } from "./GamepadEventEmitter";

function createButtonsFromConfig(
  config: GamepadConfig,
  pressed: Partial<Record<keyof GamepadConfig, boolean>> = {},
): boolean[] {
  const buttonIndices = Object.values(config).filter((v) => v !== null) as number[];
  const maxIndex = Math.max(...buttonIndices);
  const buttons = new Array(maxIndex + 1).fill(false);

  for (const [key, isPressed] of Object.entries(pressed)) {
    const buttonIndex = config[key as keyof GamepadConfig];
    if (buttonIndex !== null && isPressed) {
      buttons[buttonIndex] = true;
    }
  }

  return buttons;
}

describe("GamepadEventEmitter", () => {
  let emitter: GamepadEventEmitter;
  const defaultConfig: GamepadConfig = {
    ptt: 1,
    accept: 3,
    reject: 2,
    interrupt: 0,
    modeToggle: 9,
    modelCycle: 8,
  };

  beforeEach(() => {
    emitter = new GamepadEventEmitter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    emitter.reset();
  });

  describe("PTT_PRESS detection", () => {
    it("should emit PTT_PRESS on first button press", () => {
      const currentButtons = createButtonsFromConfig(defaultConfig, { ptt: true });
      const timestamp = 1000;

      vi.setSystemTime(timestamp);

      const events = emitter.poll(currentButtons, defaultConfig, timestamp);

      expect(events).toContainEqual({ type: "PTT_PRESS", timestamp });
    });

    it("should not emit PTT_PRESS on button hold", () => {
      const timestamp1 = 1000;
      const timestamp2 = 1100;

      vi.setSystemTime(timestamp1);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, timestamp1);
      emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        timestamp1,
      );

      vi.setSystemTime(timestamp2);
      const events = emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        timestamp2,
      );

      expect(events.find((e) => e.type === "PTT_PRESS")).toBeUndefined();
    });
  });

  describe("PTT_RELEASE detection", () => {
    it("should emit PTT_RELEASE with duration on button release", () => {
      const pressTimestamp = 1000;
      const releaseTimestamp = 2500;
      const expectedDuration = 1500;

      vi.setSystemTime(pressTimestamp);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, pressTimestamp);
      emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        pressTimestamp,
      );

      vi.setSystemTime(releaseTimestamp);
      const events = emitter.poll(
        createButtonsFromConfig(defaultConfig),
        defaultConfig,
        releaseTimestamp,
      );

      const releaseEvent = events.find((e) => e.type === "PTT_RELEASE");
      expect(releaseEvent).toBeDefined();
      expect(releaseEvent).toMatchObject({
        type: "PTT_RELEASE",
        duration: expectedDuration,
        timestamp: releaseTimestamp,
      });
    });
  });

  describe("PTT_DOUBLE_CLICK detection", () => {
    it("should emit PTT_DOUBLE_CLICK on second press within 300ms", () => {
      const timestamp1 = 1000;
      const timestamp2 = 1200;

      vi.setSystemTime(timestamp1);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, timestamp1);
      emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        timestamp1,
      );
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, timestamp1);

      vi.setSystemTime(timestamp2);
      const events = emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        timestamp2,
      );

      expect(events).toContainEqual({ type: "PTT_DOUBLE_CLICK", timestamp: timestamp2 });
    });

    it("should not emit PTT_DOUBLE_CLICK on second press after 300ms", () => {
      const timestamp1 = 1000;
      const timestamp2 = 1400;

      vi.setSystemTime(timestamp1);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, timestamp1);
      emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        timestamp1,
      );
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, timestamp1);

      vi.setSystemTime(timestamp2);
      const events = emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        timestamp2,
      );

      expect(events.find((e) => e.type === "PTT_DOUBLE_CLICK")).toBeUndefined();
      expect(events).toContainEqual({ type: "PTT_PRESS", timestamp: timestamp2 });
    });

    it("should not emit multiple PTT_DOUBLE_CLICK while button held", () => {
      const timestamp1 = 1000;
      const timestamp2 = 1200;

      vi.setSystemTime(timestamp1);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, timestamp1);
      emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        timestamp1,
      );
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, timestamp1);

      vi.setSystemTime(timestamp2);
      emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        timestamp2,
      );

      vi.setSystemTime(timestamp2 + 100);
      const events = emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        timestamp2 + 100,
      );

      expect(events.find((e) => e.type === "PTT_DOUBLE_CLICK")).toBeUndefined();
    });
  });

  describe("PTT_LONG_PRESS detection", () => {
    it("should emit PTT_LONG_PRESS after 500ms via poll", () => {
      const pressTimestamp = 1000;

      vi.setSystemTime(pressTimestamp);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, pressTimestamp);
      emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        pressTimestamp,
      );

      vi.advanceTimersByTime(500);
      vi.setSystemTime(pressTimestamp + 500);
      const events = emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        pressTimestamp + 500,
      );

      expect(events).toContainEqual({ type: "PTT_LONG_PRESS", timestamp: pressTimestamp + 500 });
    });

    it("should not emit PTT_LONG_PRESS before 500ms via poll", () => {
      const pressTimestamp = 1000;

      vi.setSystemTime(pressTimestamp);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, pressTimestamp);
      emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        pressTimestamp,
      );

      vi.advanceTimersByTime(400);
      vi.setSystemTime(pressTimestamp + 400);
      const events = emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        pressTimestamp + 400,
      );

      expect(events.find((e) => e.type === "PTT_LONG_PRESS")).toBeUndefined();
    });

    it("should not emit multiple PTT_LONG_PRESS while button held", () => {
      const pressTimestamp = 1000;

      vi.setSystemTime(pressTimestamp);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, pressTimestamp);
      emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        pressTimestamp,
      );

      vi.advanceTimersByTime(500);
      vi.setSystemTime(pressTimestamp + 500);
      const events1 = emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        pressTimestamp + 500,
      );
      expect(events1).toContainEqual({ type: "PTT_LONG_PRESS", timestamp: pressTimestamp + 500 });

      vi.advanceTimersByTime(100);
      vi.setSystemTime(pressTimestamp + 600);
      const events2 = emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        pressTimestamp + 600,
      );
      expect(events2.find((e) => e.type === "PTT_LONG_PRESS")).toBeUndefined();
    });

    it("should emit PTT_RELEASE after long press when button released", () => {
      const pressTimestamp = 1000;

      vi.setSystemTime(pressTimestamp);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, pressTimestamp);
      emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        pressTimestamp,
      );

      vi.advanceTimersByTime(500);
      vi.setSystemTime(pressTimestamp + 500);
      const events1 = emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        pressTimestamp + 500,
      );
      expect(events1.find((e) => e.type === "PTT_LONG_PRESS")).toBeDefined();

      const releaseTimestamp = pressTimestamp + 1200;
      vi.advanceTimersByTime(700);
      vi.setSystemTime(releaseTimestamp);
      const events2 = emitter.poll(
        createButtonsFromConfig(defaultConfig),
        defaultConfig,
        releaseTimestamp,
      );

      const releaseEvent = events2.find((e) => e.type === "PTT_RELEASE");
      expect(releaseEvent).toBeDefined();
      expect(releaseEvent).toMatchObject({
        type: "PTT_RELEASE",
        duration: 1200,
        timestamp: releaseTimestamp,
      });
    });

    it("should emit PTT_RELEASE after double click when button released", () => {
      const timestamp1 = 1000;
      const timestamp2 = 1200;

      vi.setSystemTime(timestamp1);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, timestamp1);
      emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        timestamp1,
      );
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, timestamp1);

      vi.setSystemTime(timestamp2);
      emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        timestamp2,
      );

      const releaseTimestamp = timestamp2 + 800;
      vi.advanceTimersByTime(800);
      vi.setSystemTime(releaseTimestamp);
      const events = emitter.poll(
        createButtonsFromConfig(defaultConfig),
        defaultConfig,
        releaseTimestamp,
      );

      const releaseEvent = events.find((e) => e.type === "PTT_RELEASE");
      expect(releaseEvent).toBeDefined();
    });

    it("should reset on button release", () => {
      const pressTimestamp = 1000;

      vi.setSystemTime(pressTimestamp);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, pressTimestamp);
      emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        pressTimestamp,
      );

      vi.advanceTimersByTime(500);
      vi.setSystemTime(pressTimestamp + 500);
      const events1 = emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        pressTimestamp + 500,
      );
      expect(events1.find((e) => e.type === "PTT_LONG_PRESS")).toBeDefined();

      vi.setSystemTime(pressTimestamp + 600);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, pressTimestamp + 600);

      vi.setSystemTime(pressTimestamp + 2000);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, pressTimestamp + 2000);
      emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        pressTimestamp + 2000,
      );

      vi.advanceTimersByTime(500);
      vi.setSystemTime(pressTimestamp + 2500);
      const events2 = emitter.poll(
        createButtonsFromConfig(defaultConfig, { ptt: true }),
        defaultConfig,
        pressTimestamp + 2500,
      );
      expect(events2.find((e) => e.type === "PTT_LONG_PRESS")).toBeDefined();
    });
  });

  describe("ACCEPT/REJECT/INTERRUPT button detection", () => {
    it("should emit ACCEPT_PRESS on accept button press", () => {
      const currentButtons = createButtonsFromConfig(defaultConfig, { accept: true });
      const timestamp = 1000;

      vi.setSystemTime(timestamp);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, timestamp);

      const events = emitter.poll(currentButtons, defaultConfig, timestamp);

      expect(events).toContainEqual({ type: "ACCEPT_PRESS", timestamp });
    });

    it("should emit REJECT_PRESS on reject button press", () => {
      const currentButtons = createButtonsFromConfig(defaultConfig, { reject: true });
      const timestamp = 1000;

      vi.setSystemTime(timestamp);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, timestamp);

      const events = emitter.poll(currentButtons, defaultConfig, timestamp);

      expect(events).toContainEqual({ type: "REJECT_PRESS", timestamp });
    });

    it("should emit INTERRUPT_PRESS on interrupt button press", () => {
      const currentButtons = createButtonsFromConfig(defaultConfig, { interrupt: true });
      const timestamp = 1000;

      vi.setSystemTime(timestamp);
      emitter.poll(createButtonsFromConfig(defaultConfig), defaultConfig, timestamp);

      const events = emitter.poll(currentButtons, defaultConfig, timestamp);

      expect(events).toContainEqual({ type: "INTERRUPT_PRESS", timestamp });
    });
  });
});

import type { GamepadEvent } from "~/lib/inputFSM";
import type { GamepadConfig } from "~/stores/appStore";

const DOUBLE_CLICK_THRESHOLD_MS = 300;
const LONG_PRESS_THRESHOLD_MS = 500;

export class GamepadEventEmitter {
  private lastPressTime: Map<number, number> = new Map();
  private pressStartTime: Map<number, number> = new Map();
  private doubleClickTriggered: Set<number> = new Set();
  private longPressTriggered: Set<number> = new Set();
  private disabledButtons: Set<number> = new Set();
  private prevButtons: boolean[] = [];

  poll(currentButtons: boolean[], config: GamepadConfig, timestamp: number): GamepadEvent[] {
    const events: GamepadEvent[] = [];

    const prevButtons = this.prevButtons;
    this.prevButtons = currentButtons;

    const pttIndex = config.ptt;
    const acceptIndex = config.accept;
    const rejectIndex = config.reject;
    const interruptIndex = config.interrupt;

    if (pttIndex !== null) {
      events.push(...this.pollButton(pttIndex, currentButtons, prevButtons, timestamp));
    }

    if (acceptIndex !== null && this.wasJustPressed(acceptIndex, currentButtons, prevButtons)) {
      events.push({ type: "ACCEPT_PRESS", timestamp });
    }

    if (rejectIndex !== null && this.wasJustPressed(rejectIndex, currentButtons, prevButtons)) {
      events.push({ type: "REJECT_PRESS", timestamp });
    }

    if (
      interruptIndex !== null &&
      this.wasJustPressed(interruptIndex, currentButtons, prevButtons)
    ) {
      events.push({ type: "INTERRUPT_PRESS", timestamp });
    }

    return events;
  }

  private pollButton(
    buttonIndex: number,
    currentButtons: boolean[],
    prevButtons: boolean[],
    timestamp: number,
  ): GamepadEvent[] {
    const events: GamepadEvent[] = [];

    const current = currentButtons[buttonIndex] ?? false;
    const prev = prevButtons[buttonIndex] ?? false;

    if (current && !prev && !this.disabledButtons.has(buttonIndex)) {
      const lastPress = this.lastPressTime.get(buttonIndex) || 0;
      const timeSinceLastPress = timestamp - lastPress;

      const isDoubleClick =
        timeSinceLastPress < DOUBLE_CLICK_THRESHOLD_MS &&
        !this.doubleClickTriggered.has(buttonIndex);

      this.lastPressTime.set(buttonIndex, timestamp);

      if (isDoubleClick) {
        this.doubleClickTriggered.add(buttonIndex);
        this.disabledButtons.add(buttonIndex);

        console.log("[GamepadEventEmitter] Double click detected:", {
          buttonIndex,
          timeSinceLastPress,
        });

        events.push({ type: "PTT_DOUBLE_CLICK", timestamp });
      } else {
        events.push({ type: "PTT_PRESS", timestamp });
      }
    }

    if (current) {
      if (!this.pressStartTime.has(buttonIndex)) {
        this.pressStartTime.set(buttonIndex, timestamp);
      } else if (
        !this.longPressTriggered.has(buttonIndex) &&
        !this.disabledButtons.has(buttonIndex)
      ) {
        const duration = timestamp - this.pressStartTime.get(buttonIndex)!;

        if (duration >= LONG_PRESS_THRESHOLD_MS) {
          this.longPressTriggered.add(buttonIndex);
          this.disabledButtons.add(buttonIndex);

          console.log("[GamepadEventEmitter] Long press detected:", {
            buttonIndex,
            duration,
          });

          events.push({ type: "PTT_LONG_PRESS", timestamp });
        }
      }
    }

    if (!current && prev) {
      this.doubleClickTriggered.delete(buttonIndex);
      this.longPressTriggered.delete(buttonIndex);
      this.disabledButtons.delete(buttonIndex);

      const startTime = this.pressStartTime.get(buttonIndex);

      if (startTime) {
        const duration = timestamp - startTime;
        this.pressStartTime.delete(buttonIndex);

        console.log("[GamepadEventEmitter] PTT released:", {
          buttonIndex,
          duration,
        });

        events.push({ type: "PTT_RELEASE", duration, timestamp });
      }
    }

    return events;
  }

  private wasJustPressed(buttonIndex: number, current: boolean[], prev: boolean[]): boolean {
    return (current[buttonIndex] ?? false) && !(prev[buttonIndex] ?? false);
  }

  reset(): void {
    this.lastPressTime.clear();
    this.pressStartTime.clear();
    this.doubleClickTriggered.clear();
    this.longPressTriggered.clear();
    this.disabledButtons.clear();
    this.prevButtons = [];
  }
}

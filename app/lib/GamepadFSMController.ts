import type { ActionExecutorDeps } from "./ActionExecutor";
import type { GamepadEvent, InputState } from "./inputFSM";
import type { GamepadConfig, GamepadState } from "~/stores/appStore";

import { useAppStore } from "~/stores/appStore";

import { ActionExecutor } from "./ActionExecutor";
import { GamepadEventEmitter } from "./GamepadEventEmitter";
import { InputStateMachine } from "./inputFSM";

export type FSMControllerState = {
  inputState: InputState;
  gamepadState: GamepadState;
};

type StateListener = (state: FSMControllerState) => void;

export class GamepadFSMController {
  private static instance: GamepadFSMController | null = null;

  static getInstance(): GamepadFSMController {
    if (!this.instance) {
      this.instance = new GamepadFSMController();
    }
    return this.instance;
  }

  static resetInstance(): void {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
  }

  private fsm = new InputStateMachine();
  private emitter = new GamepadEventEmitter();
  private depsGetter: (() => ActionExecutorDeps) | null = null;
  private executor: ActionExecutor | null = null;
  private listeners = new Set<StateListener>();

  private inputState: InputState = "idle";
  private gamepadState: GamepadState = {
    connected: false,
    index: null,
    id: null,
    buttons: [],
    axes: [],
  };

  private gamepadIndex: number | null = null;
  private lastButtons: boolean[] = [];
  private rafId: number | null = null;
  private started = false;
  private disabled = false;
  private connectHandler: ((e: globalThis.GamepadEvent) => void) | null = null;
  private disconnectHandler: ((e: globalThis.GamepadEvent) => void) | null = null;

  state(): FSMControllerState {
    return {
      inputState: this.inputState,
      gamepadState: this.gamepadState,
    };
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.state();
    this.listeners.forEach((fn) => fn(state));
  }

  setDeps(getDeps: () => ActionExecutorDeps): void {
    this.depsGetter = getDeps;
    if (!this.executor) {
      this.executor = new ActionExecutor(getDeps);
    }
  }

  setConfig(config: GamepadConfig): void {
    useAppStore.getState().setGamepadConfig(config);
  }

  setDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  isDisabled(): boolean {
    return this.disabled;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.setupGamepadListeners();
    this.checkExistingGamepad();
  }

  private setupGamepadListeners(): void {
    const onConnect = (e: globalThis.GamepadEvent) => {
      this.gamepadIndex = e.gamepad.index;
      const buttons = e.gamepad.buttons.map((b: GamepadButton) => b.pressed);
      this.lastButtons = buttons;
      this.emitter.reset();

      this.gamepadState = {
        connected: true,
        index: e.gamepad.index,
        id: e.gamepad.id,
        buttons,
        axes: e.gamepad.axes.slice(0, 4),
      };
      this.notify();

      this.startPolling();
    };

    const onDisconnect = (e: globalThis.GamepadEvent) => {
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
        this.lastButtons = [];
        this.emitter.reset();
        this.stopPolling();

        this.gamepadState = {
          connected: false,
          index: null,
          id: null,
          buttons: [],
          axes: [],
        };
        this.notify();
      }
    };

    window.addEventListener("gamepadconnected", onConnect);
    window.addEventListener("gamepaddisconnected", onDisconnect);

    this.connectHandler = onConnect;
    this.disconnectHandler = onDisconnect;
  }

  private checkExistingGamepad(): void {
    const gamepads = navigator.getGamepads();
    const first = gamepads.find((g) => g !== null);
    if (first) {
      this.gamepadIndex = first.index;
      const buttons = first.buttons.map((b) => b.pressed);
      this.lastButtons = buttons;

      this.gamepadState = {
        connected: true,
        index: first.index,
        id: first.id,
        buttons,
        axes: first.axes.slice(0, 4),
      };
      this.notify();

      this.startPolling();
    }
  }

  private startPolling(): void {
    if (this.rafId !== null) return;

    const poll = () => {
      const gamepads = navigator.getGamepads();
      const gamepad = this.gamepadIndex !== null ? gamepads[this.gamepadIndex] : null;

      if (gamepad) {
        const currentButtons = gamepad.buttons.map((b) => b.pressed);
        const currentAxes = gamepad.axes.slice(0, 4);

        const buttonsChanged =
          currentButtons.length !== this.lastButtons.length ||
          currentButtons.some((pressed, idx) => pressed !== this.lastButtons[idx]);

        const timestamp = performance.now();
        const events = this.emitter.poll(
          currentButtons,
          useAppStore.getState().gamepad.config,
          timestamp,
        );

        if (buttonsChanged) {
          this.lastButtons = currentButtons;
          this.gamepadState = {
            connected: true,
            index: gamepad.index,
            id: gamepad.id,
            buttons: currentButtons,
            axes: currentAxes,
          };
          this.notify();
        }

        if (!this.disabled) {
          events.forEach((event) => {
            this.transition(event);
          });
        }
      }

      this.rafId = requestAnimationFrame(poll);
    };

    this.rafId = requestAnimationFrame(poll);
  }

  private stopPolling(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  handleSTTComplete(text: string): void {
    const event: GamepadEvent = { type: "STT_COMPLETE", text, timestamp: performance.now() };
    this.transition(event);
  }

  handleAgentResponseComplete(): void {
    const event: GamepadEvent = { type: "AGENT_RESPONSE_COMPLETE", timestamp: performance.now() };
    this.transition(event);
  }

  injectEvent(event: GamepadEvent): void {
    this.transition(event);
  }

  private transition(event: GamepadEvent): void {
    const result = this.fsm.transition(this.inputState, event);

    if (result.nextState !== this.inputState) {
      this.inputState = result.nextState;
    }

    if (this.executor && result.actions.length > 0) {
      this.executor.execute(result.actions);
    }

    this.notify();
  }
  destroy(): void {
    this.stopPolling();

    if (this.connectHandler) {
      window.removeEventListener("gamepadconnected", this.connectHandler);
      this.connectHandler = null;
    }
    if (this.disconnectHandler) {
      window.removeEventListener("gamepaddisconnected", this.disconnectHandler);
      this.disconnectHandler = null;
    }

    if (this.executor) {
      this.executor.dispose();
      this.executor = null;
    }

    this.emitter.reset();
    this.listeners.clear();
    this.started = false;
  }
}

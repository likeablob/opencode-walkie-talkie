import type { GamepadConfig } from "~/stores/appStore";

export type AuxiliaryAction = "modeToggle" | "modelCycle";

export class AuxiliaryControls {
  private prevButtons: boolean[] = [];

  poll(buttons: boolean[], config: GamepadConfig): AuxiliaryAction[] {
    const actions: AuxiliaryAction[] = [];
    const prev = this.prevButtons;
    this.prevButtons = buttons;

    const wasPressed = (index: number | null): boolean =>
      index !== null && (buttons[index] ?? false) && !(prev[index] ?? false);

    if (wasPressed(config.modeToggle)) actions.push("modeToggle");
    if (wasPressed(config.modelCycle)) actions.push("modelCycle");

    return actions;
  }

  reset(): void {
    this.prevButtons = [];
  }
}

import type { GamepadConfig } from "~/stores/appStore";

import { useEffect, useState } from "react";
import { Check, Edit3, Gamepad2, X } from "lucide-react";

import { cn } from "~/lib/utils";

export type ButtonMapperProps = {
  config: GamepadConfig;
  gamepadConnected: boolean;
  gamepadButtons: boolean[];
  onConfigChange: (config: GamepadConfig) => void;
};

const BUTTON_LABELS: Record<keyof GamepadConfig, string> = {
  ptt: "Push-to-Talk",
  accept: "Accept / Confirm",
  reject: "Reject / Cancel",
  interrupt: "Interrupt TTS",
  modeToggle: "Mode Toggle",
  modelCycle: "Model Cycle",
};

export function ButtonMapper({
  config,
  gamepadConnected,
  gamepadButtons,
  onConfigChange,
}: ButtonMapperProps) {
  const [listeningKey, setListeningKey] = useState<keyof GamepadConfig | null>(null);

  useEffect(() => {
    if (!listeningKey || !gamepadConnected) return;

    const pressedIndex = gamepadButtons.findIndex((pressed) => pressed);
    if (pressedIndex >= 0) {
      const newConfig = { ...config };

      (Object.keys(newConfig) as (keyof GamepadConfig)[]).forEach((key) => {
        if (newConfig[key] === pressedIndex) {
          newConfig[key] = null;
        }
      });

      newConfig[listeningKey] = pressedIndex;
      onConfigChange(newConfig);
      setListeningKey(null);
    }
  }, [listeningKey, gamepadConnected, gamepadButtons, config, onConfigChange]);

  const handleRemapClick = (key: keyof GamepadConfig) => {
    setListeningKey(key);
  };

  const handleClearClick = (key: keyof GamepadConfig) => {
    const newConfig = { ...config, [key]: null };
    onConfigChange(newConfig);
  };

  return (
    <div className="space-y-2">
      <div className="mb-2 flex items-center gap-2">
        <Gamepad2 className="h-4 w-4" />
        <span className="font-medium">Button Mapping</span>
      </div>
      {!gamepadConnected && (
        <div className="text-muted-foreground mb-2 text-xs">Connect gamepad to remap buttons</div>
      )}
      <div className="space-y-1">
        {(Object.keys(config) as (keyof GamepadConfig)[]).map((key) => (
          <div
            key={key}
            className={cn(
              "flex items-center justify-between rounded border p-2 transition-all",
              listeningKey === key ? "bg-primary/20 border-primary" : "bg-card border-border",
            )}
          >
            <div className="flex items-center gap-2">
              {listeningKey === key ? (
                <Edit3 className="text-primary h-3 w-3 animate-pulse" />
              ) : config[key] === null ? (
                <X className="text-muted-foreground h-3 w-3" />
              ) : (
                <Check className="text-muted-foreground h-3 w-3" />
              )}
              <span className="text-xs">{BUTTON_LABELS[key]}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-muted rounded px-2 py-1 font-mono text-xs">
                {config[key] === null ? "None" : `Btn ${config[key]}`}
              </span>
              {config[key] !== null && (
                <button
                  onClick={() => handleClearClick(key)}
                  className="bg-muted hover:bg-muted/80 border-border rounded border px-2 py-1 text-xs transition-all"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => handleRemapClick(key)}
                disabled={!gamepadConnected || listeningKey === key}
                className={cn(
                  "rounded border px-2 py-1 text-xs transition-all",
                  listeningKey === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : gamepadConnected
                      ? "bg-accent hover:bg-accent/80 border-border"
                      : "bg-muted text-muted-foreground border-border cursor-not-allowed",
                )}
              >
                {listeningKey === key ? "Waiting..." : "Remap"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {listeningKey && (
        <div className="text-primary mt-2 animate-pulse text-xs">
          Press a button on your gamepad to assign to {BUTTON_LABELS[listeningKey]}
        </div>
      )}
    </div>
  );
}

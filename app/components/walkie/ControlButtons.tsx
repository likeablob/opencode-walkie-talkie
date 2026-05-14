import type { InputState } from "~/stores/appStore";

import { Check, Square, X } from "lucide-react";

import { cn } from "~/lib/utils";

export type ControlButtonsProps = {
  inputState: InputState;
  isPlaying: boolean;
  isAgentRunning: boolean;
  onAccept: () => void;
  onReject: () => void;
  onInterrupt: () => void;
};

export function ControlButtons({
  inputState,
  isPlaying,
  isAgentRunning,
  onAccept,
  onReject,
  onInterrupt,
}: ControlButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        onClick={onAccept}
        disabled={inputState !== "confirming"}
        className={cn(
          "bg-card border-border rounded-lg border p-3 text-center transition-all",
          inputState === "confirming"
            ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary active:scale-95"
            : "opacity-50",
        )}
      >
        <Check className="mx-auto mb-1 h-6 w-6" />
        <div className="text-xs">Accept</div>
      </button>
      <button
        onClick={onReject}
        disabled={inputState !== "confirming"}
        className={cn(
          "bg-card border-border rounded-lg border p-3 text-center transition-all",
          inputState === "confirming"
            ? "bg-destructive hover:bg-destructive/90 border-destructive text-white active:scale-95"
            : "opacity-50",
        )}
      >
        <X className="mx-auto mb-1 h-6 w-6" />
        <div className="text-xs">Reject</div>
      </button>
      <button
        onClick={onInterrupt}
        disabled={!isPlaying && !isAgentRunning}
        className={cn(
          "bg-card border-border rounded-lg border p-3 text-center transition-all",
          isPlaying || isAgentRunning
            ? "border-orange-600 bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
            : "opacity-50",
        )}
      >
        <Square className="mx-auto mb-1 h-6 w-6" />
        <div className="text-xs">Stop</div>
      </button>
    </div>
  );
}

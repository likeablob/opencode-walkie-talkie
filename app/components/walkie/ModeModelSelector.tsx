import type { ModelInfo } from "~/stores/appStore";

import { RefreshCw } from "lucide-react";

export type ModeModelSelectorProps = {
  mode: "plan" | "build";
  model: ModelInfo | null;
  onModeToggle: () => void;
  onModelCycle: () => void;
};

export function ModeModelSelector({
  mode,
  model,
  onModeToggle,
  onModelCycle,
}: ModeModelSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <button
        onClick={onModeToggle}
        className="bg-card border-border hover:bg-accent rounded-lg border p-3 text-left transition-all active:scale-95"
      >
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <span>Mode</span>
          <RefreshCw className="h-3 w-3 text-blue-400" />
        </div>
        <div className="font-medium capitalize">{mode}</div>
      </button>
      <button
        onClick={onModelCycle}
        className="bg-card border-border hover:bg-accent rounded-lg border p-3 text-left transition-all active:scale-95"
      >
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <span>Model</span>
          <RefreshCw className="h-3 w-3 text-blue-400" />
        </div>
        <div className="truncate font-medium">
          {model?.modelId?.split("/").pop()?.slice(0, 18) ?? "None"}
        </div>
      </button>
    </div>
  );
}

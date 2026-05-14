import type { LogDisplay } from "~/stores/appStore";

import { LockSlider } from "./LockSlider";

export type ControlBarProps = {
  logDisplay: LogDisplay;
  wakeLockActive: boolean;
  locked: boolean;
  onDisplayToggle: () => void;
  onWakeLockToggle: () => void;
  onLockToggle: () => void;
};

export function ControlBar({
  logDisplay,
  wakeLockActive,
  locked,
  onDisplayToggle,
  onWakeLockToggle,
  onLockToggle,
}: ControlBarProps) {
  const buttonClass =
    "bg-card border border-border rounded p-2 text-center hover:bg-accent transition-all";
  const disabledClass = locked ? "pointer-events-none opacity-50" : "";

  return (
    <div className="relative z-50 grid grid-cols-3 gap-2 text-xs">
      <button onClick={onWakeLockToggle} className={`${buttonClass} ${disabledClass}`}>
        <span className="text-muted-foreground">Wake lock: </span>
        <span className={wakeLockActive ? "text-green-400" : "text-red-400"}>
          {wakeLockActive ? "ON" : "OFF"}
        </span>
      </button>

      {locked ? (
        <LockSlider onUnlock={onLockToggle} />
      ) : (
        <button onClick={onLockToggle} className={buttonClass}>
          <span className="text-muted-foreground">Lock: </span>
          <span className="text-red-400">OFF</span>
        </button>
      )}

      <button onClick={onDisplayToggle} className={`${buttonClass} ${disabledClass}`}>
        <span className="text-muted-foreground">Log display: </span>
        <span className="font-medium">{logDisplay === "latest" ? "Latest" : "Full"}</span>
      </button>
    </div>
  );
}

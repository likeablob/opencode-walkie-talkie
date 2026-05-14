import { useCallback, useRef } from "react";
import { Lock } from "lucide-react";
import { animate, motion, useMotionValue } from "motion/react";

export type LockSliderProps = {
  onUnlock: () => void;
  disabled?: boolean;
};

export function LockSlider({ onUnlock, disabled = false }: LockSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const handleDragEnd = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const trackWidth = container.offsetWidth;
    const handleWidth = trackWidth * 0.2;
    const maxX = trackWidth - handleWidth;

    if (x.get() >= maxX * 0.9) {
      animate(x, 0, { type: "spring", bounce: 0, duration: 0.25 });
      onUnlock();
    } else {
      animate(x, 0, { type: "spring", bounce: 0, duration: 0.25 });
    }
  }, [x, onUnlock]);

  return (
    <div
      ref={containerRef}
      className={`bg-muted border-border relative overflow-hidden rounded border ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <motion.div
        className="bg-primary absolute inset-y-0 left-0 z-10 flex cursor-grab items-center justify-center opacity-80 active:cursor-grabbing"
        style={{
          width: "20%",
          x,
        }}
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        <Lock className="text-primary-foreground h-3 w-3" />
      </motion.div>
      <span
        className="text-muted-foreground pointer-events-none absolute inset-0 z-0 flex items-center justify-center text-xs"
        style={{ left: "20%" }}
      >
        Slide to unlock
      </span>
    </div>
  );
}

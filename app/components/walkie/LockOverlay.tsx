export type LockOverlayProps = {
  locked: boolean;
};

export function LockOverlay({ locked }: LockOverlayProps) {
  if (!locked) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/20"
      style={{ pointerEvents: "auto" }}
      aria-hidden="true"
    />
  );
}

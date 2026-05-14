// Ambient type extensions for debug utilities exposed on `window`.
// These are development-only helpers injected in home.tsx.
import type { AppState } from "~/stores/appStore";

declare global {
  interface Window {
    debugSendUserText?: (text: string) => void;
    debugGetState?: () => AppState;
  }
}

export {};

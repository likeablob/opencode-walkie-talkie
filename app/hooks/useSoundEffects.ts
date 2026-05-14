import { useCallback } from "react";

import { useSound } from "~/hooks/use-sound";
import { drop003Sound } from "~/lib/drop-003";

export type SoundEffectName = "drop-003";

export function useSoundEffects() {
  const [playItemSelect] = useSound(drop003Sound);

  const play = useCallback(
    (soundName: SoundEffectName) => {
      console.log("[SoundEffects] play:", soundName);
      switch (soundName) {
        case "drop-003":
          playItemSelect();
          break;
        default:
          console.warn("[SoundEffects] Sound not found:", soundName);
      }
    },
    [playItemSelect],
  );

  return {
    play,
  };
}

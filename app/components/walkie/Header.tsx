import type { SSEConnectionState } from "~/hooks/useSSE";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";

export type HeaderProps = {
  title: string;
  gamepadConnected: boolean;
  gamepadId: string | null;
  sseConnectionState: SSEConnectionState;
  children?: React.ReactNode;
};

const sseStateConfig: Record<SSEConnectionState, { color: string; label: string }> = {
  connected: { color: "bg-green-500", label: "SSE Connected" },
  reconnecting: { color: "bg-yellow-500", label: "SSE Reconnecting..." },
  disconnected: { color: "bg-red-500", label: "SSE Disconnected" },
};

export function Header({
  title,
  gamepadConnected,
  gamepadId,
  sseConnectionState,
  children,
}: HeaderProps) {
  const sseConfig = sseStateConfig[sseConnectionState];

  return (
    <header className="relative text-center">
      <h1 className="inline-flex items-center gap-2 text-xl font-bold">
        {title}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`h-2.5 w-2.5 rounded-full ${sseConfig.color} cursor-default`} />
            </TooltipTrigger>
            <TooltipContent side="right">{sseConfig.label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h1>
      <p className="text-muted-foreground text-xs">
        {gamepadConnected ? `✓ ${gamepadId?.slice(0, 25)}` : "No gamepad detected"}
      </p>
      {children}
    </header>
  );
}

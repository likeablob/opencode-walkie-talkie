import type { LogDisplay } from "~/stores/appStore";

import { Loader2 } from "lucide-react";

export type AgentResponseCardProps = {
  isAgentRunning: boolean;
  lastResponse: string | null;
  logDisplay: LogDisplay;
  waitingText: string;
};

export function AgentResponseCard({
  isAgentRunning,
  lastResponse,
  logDisplay,
  waitingText,
}: AgentResponseCardProps) {
  if (logDisplay === "full") return null;

  if (!lastResponse && !isAgentRunning) return null;

  return (
    <div className="bg-card border-border max-h-60 overflow-y-auto rounded-lg border p-3">
      <div className="text-muted-foreground mb-1 text-xs">Agent response</div>
      {isAgentRunning && !lastResponse ? (
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="text-foreground h-4 w-4 animate-spin" />
          <span>{waitingText}</span>
        </div>
      ) : (
        <div className="text-sm">{lastResponse}</div>
      )}
    </div>
  );
}

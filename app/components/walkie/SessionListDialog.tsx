import type { SessionInfo } from "~/stores/appStore";

import { CheckCircle, Clock } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

export type SessionListDialogProps = {
  sessions: SessionInfo[];
  currentSessionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (sessionId: string) => void;
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return "just now";
}

export function SessionListDialog({
  sessions,
  currentSessionId,
  open,
  onOpenChange,
  onSelect,
}: SessionListDialogProps) {
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const sortedSessions = [...safeSessions].sort((a, b) => {
    const aUpdated = a?.time?.updated ?? 0;
    const bUpdated = b?.time?.updated ?? 0;
    return bUpdated - aUpdated;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85dvh] flex-col overflow-hidden sm:max-w-[calc(100%-2rem)] md:h-[600px] md:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Select Session</DialogTitle>
          <DialogDescription>Choose a session to continue or view history</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1">
          {sortedSessions.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">No sessions found</div>
          ) : (
            sortedSessions.map((session) => {
              const isSelected = session.id === currentSessionId;
              return (
                <button
                  key={session.id}
                  onClick={() => {
                    onSelect(session.id);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "hover:bg-muted/50 flex items-center gap-3 rounded-lg p-3 text-left transition-colors",
                    isSelected && "bg-muted/50 ring-primary/50 ring-1 ring-inset",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{session.title || session.slug}</div>
                    <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(session.time.updated)}</span>
                    </div>
                  </div>
                  {isSelected && <CheckCircle className="text-primary h-4 w-4 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

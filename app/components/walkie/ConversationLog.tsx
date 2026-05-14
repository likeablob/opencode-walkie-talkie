import type { LogDisplay, Transaction } from "~/stores/appStore";

import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";

import { cn } from "~/lib/utils";

export type ConversationLogProps = {
  transactions: Transaction[];
  logDisplay: LogDisplay;
  onClear: () => void;
};

export function ConversationLog({ transactions, logDisplay, onClear }: ConversationLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && transactions.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transactions.length]);

  if (logDisplay !== "full" || transactions.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="bg-card border-border max-h-60 overflow-y-auto rounded-lg border p-3"
    >
      <div className="text-muted-foreground mb-2 flex justify-between text-xs">
        <span>Conversation Log</span>
        <button onClick={onClear} className="text-muted-foreground hover:text-foreground">
          Clear
        </button>
      </div>
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className={cn(
              "rounded p-2 text-sm",
              tx.type === "user" ? "bg-blue-900/30" : "bg-green-900/30",
            )}
          >
            <div className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
              {tx.type === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
              <span>
                {tx.type === "user" ? "You" : "Agent"} • {tx.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="line-clamp-3">{tx.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

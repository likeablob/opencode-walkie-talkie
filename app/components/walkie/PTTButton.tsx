import type { InputState } from "~/stores/appStore";

import { Bot, CheckCircle, Circle, Loader2, Mic, Send, Volume2 } from "lucide-react";

import { cn } from "~/lib/utils";

export type PTTButtonProps = {
  isRecording: boolean;
  isPlaying: boolean;
  isAgentRunning: boolean;
  inputState: InputState;
  statusIcon: React.ReactNode;
  statusText: string;
  subText: string;
  onPTTStart: () => void;
  onPTTEnd: () => void;
};

export function PTTButton({
  isRecording,
  isPlaying,
  isAgentRunning,
  statusIcon,
  statusText,
  subText,
  onPTTStart,
  onPTTEnd,
}: PTTButtonProps) {
  return (
    <button
      onPointerDown={onPTTStart}
      onPointerUp={onPTTEnd}
      onPointerLeave={onPTTEnd}
      className={cn(
        "w-full rounded-xl p-8 text-center transition-all duration-150 active:scale-95",
        "border-border border-2",
        isRecording && "bg-destructive border-destructive animate-pulse text-white",
        isPlaying && "border-green-600 bg-green-500 text-white",
        isAgentRunning && "bg-primary text-primary-foreground border-primary",
        !isRecording && !isPlaying && !isAgentRunning && "bg-card hover:bg-accent",
      )}
    >
      <div className="mb-1 flex justify-center">{statusIcon}</div>
      <div className="text-lg font-medium">{statusText}</div>
      <div
        className={cn(
          "mt-1 text-xs",
          isRecording || isPlaying || isAgentRunning ? "text-white" : "text-foreground",
        )}
      >
        {subText}
      </div>
    </button>
  );
}

export function getPTTStatus(
  isRecording: boolean,
  isPlaying: boolean,
  isLoading: boolean,
  isAgentRunning: boolean,
  inputState: PTTButtonProps["inputState"],
  t: (key: string, transcription?: string) => string,
) {
  if (isRecording)
    return {
      statusIcon: <Circle className="h-8 w-8 fill-none stroke-white stroke-2" />,
      statusText: t("recording"),
    };
  if (isPlaying)
    return {
      statusIcon: <Volume2 className="h-8 w-8 stroke-white stroke-2" />,
      statusText: t("playing"),
    };
  if (isLoading)
    return {
      statusIcon: <Loader2 className="stroke-foreground h-8 w-8 animate-spin stroke-2" />,
      statusText: t("loadingAudio"),
    };
  if (isAgentRunning)
    return {
      statusIcon: <Bot className="h-8 w-8 stroke-white stroke-2" />,
      statusText: t("agentThinking"),
    };
  if (inputState === "confirming")
    return {
      statusIcon: <CheckCircle className="stroke-muted-foreground h-8 w-8 stroke-2" />,
      statusText: t("confirm"),
    };
  if (inputState === "sending")
    return {
      statusIcon: <Send className="stroke-foreground h-8 w-8 stroke-2" />,
      statusText: t("sending"),
    };
  if (inputState === "waiting")
    return {
      statusIcon: <Loader2 className="stroke-foreground h-8 w-8 animate-spin stroke-2" />,
      statusText: t("waiting"),
    };
  return { statusIcon: <Mic className="h-8 w-8" />, statusText: t("ready") };
}

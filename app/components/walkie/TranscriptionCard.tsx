import { Loader2 } from "lucide-react";

export type TranscriptionCardProps = {
  transcription: string | null;
  isProcessing: boolean;
  statusMessage: string;
};

export function TranscriptionCard({
  transcription,
  isProcessing,
  statusMessage,
}: TranscriptionCardProps) {
  const isTranscribing =
    isProcessing && (statusMessage.includes("音声認識") || statusMessage.includes("Transcribing"));

  if (!transcription && !isTranscribing) return null;

  return (
    <div className="bg-card border-border rounded-lg border p-3">
      <div className="text-muted-foreground mb-1 text-xs">Transcription</div>
      {isTranscribing ? (
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{statusMessage}</span>
        </div>
      ) : (
        <div className="text-sm">{transcription}</div>
      )}
    </div>
  );
}

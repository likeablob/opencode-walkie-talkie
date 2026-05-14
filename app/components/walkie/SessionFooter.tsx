import { List, Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "~/components/ui/button-group";

export type SessionFooterProps = {
  sessionTitle: string | null;
  onNewSession: () => void;
  onOpenSessionList: () => void;
};

export function SessionFooter({
  sessionTitle,
  onNewSession,
  onOpenSessionList,
}: SessionFooterProps) {
  return (
    <ButtonGroup className="w-full">
      <ButtonGroupText className="shrink-0 text-xs">Session</ButtonGroupText>
      <ButtonGroupSeparator />
      <ButtonGroupText className="flex-1 justify-start bg-transparent px-2.5 text-xs italic">
        {sessionTitle ?? "No session"}
      </ButtonGroupText>
      <ButtonGroupSeparator />
      <Button size="icon" variant="outline" className="size-6" onClick={onOpenSessionList}>
        <List className="size-3" />
      </Button>
      <ButtonGroupSeparator />
      <Button size="icon" variant="outline" className="size-6" onClick={onNewSession}>
        <Plus className="size-3" />
      </Button>
    </ButtonGroup>
  );
}

import { ToolCallDialog } from "~/components/agent-chat/tool-call-dialog";
import { useToolCall } from "~/lib/tool-context";

export function ToolCallDialogContainer({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const call = useToolCall(id);
  if (call == null) return null;
  return <ToolCallDialog call={call} onClose={onClose} />;
}

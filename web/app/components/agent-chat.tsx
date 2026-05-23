import { useMemo, useState } from "react";

import { ChatLauncherButton } from "~/components/agent-chat/chat-launcher-button";
import { ChatPanel } from "~/components/agent-chat/chat-panel";
import { DebugDialog } from "~/components/agent-chat/debug-dialog";
import { ToolCallDialogContainer } from "~/components/agent-chat/tool-call-dialog-container";
import { useAgentChat } from "~/components/agent-chat/use-agent-chat";
import {
  ToolContextProvider,
  createToolContextStore,
  type ToolContextStore,
} from "~/lib/tool-context";

export function AgentChat() {
  const toolStore = useMemo<ToolContextStore>(() => createToolContextStore(), []);
  const [isOpen, setIsOpen] = useState(false);
  const chat = useAgentChat({ isOpen, toolStore });

  return (
    <ToolContextProvider store={toolStore}>
      <div className="fixed bottom-5 right-5 z-50">
        {isOpen ? (
          <ChatPanel
            messages={chat.messages}
            draft={chat.draft}
            isSending={chat.isSending}
            error={chat.error}
            bottomRef={chat.bottomRef}
            inputRef={chat.inputRef}
            prefs={chat.prefs}
            onAgentModelChange={chat.selectAgentModel}
            onClose={() => setIsOpen(false)}
            onDebugClick={chat.setDebugMessage}
            onDraftChange={chat.setDraft}
            onImageModelChange={chat.selectImageModel}
            onNewChat={chat.startNewChat}
            onSendMessage={chat.sendMessage}
            onToolSelect={chat.setSelectedToolCallID}
          />
        ) : (
          <ChatLauncherButton onOpen={() => setIsOpen(true)} />
        )}
        {chat.debugMessage != null ? (
          <DebugDialog
            title={
              chat.debugMessage.role === "user" ? "Raw request" : "Raw response"
            }
            body={chat.debugMessage.rawDebug ?? ""}
            onClose={() => chat.setDebugMessage(null)}
          />
        ) : null}
        {chat.selectedToolCallID != null ? (
          <ToolCallDialogContainer
            id={chat.selectedToolCallID}
            onClose={() => chat.setSelectedToolCallID(null)}
          />
        ) : null}
      </div>
    </ToolContextProvider>
  );
}

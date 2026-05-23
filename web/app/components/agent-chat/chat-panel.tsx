import {
  Bot,
  ImageIcon,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import type { RefObject } from "react";

import { BubbleRow, type BubbleMessage } from "~/components/agent-chat/bubble-row";
import { ModelDropdown } from "~/components/model-dropdown";
import type { AgentPreferencesState } from "~/state/agent-preferences/types";

export type ChatPanelProps = {
  messages: BubbleMessage[];
  draft: string;
  isSending: boolean;
  error: string | null;
  bottomRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  prefs: AgentPreferencesState;
  onAgentModelChange: (id: string) => void;
  onClose: () => void;
  onDebugClick: (message: BubbleMessage) => void;
  onDraftChange: (draft: string) => void;
  onImageModelChange: (id: string) => void;
  onNewChat: () => void;
  onSendMessage: () => void;
  onToolSelect: (id: string) => void;
};

export function ChatPanel({
  messages,
  draft,
  isSending,
  error,
  bottomRef,
  inputRef,
  prefs,
  onAgentModelChange,
  onClose,
  onDebugClick,
  onDraftChange,
  onImageModelChange,
  onNewChat,
  onSendMessage,
  onToolSelect,
}: ChatPanelProps) {
  return (
    <section className="flex h-[min(36rem,calc(100vh-2.5rem))] w-[min(28rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200">
            <Bot className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Recipe copilot
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Powered by the agent API
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            onClick={onNewChat}
            disabled={isSending}
            aria-label="Start new chat"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            New
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            onClick={onClose}
            aria-label="Close recipe copilot"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50/80 px-4 py-4 dark:bg-zinc-950/40">
        {messages.map((message) => (
          <BubbleRow
            key={message.id}
            message={message}
            onDebugClick={onDebugClick}
            onToolSelect={onToolSelect}
          />
        ))}
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form
        className="border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
        onSubmit={(event) => {
          event.preventDefault();
          void onSendMessage();
        }}
      >
        <div className="flex flex-col gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void onSendMessage();
              }
            }}
            rows={2}
            placeholder="Ask the copilot..."
            className="min-h-10 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
          />
          <div className="flex items-center gap-2">
            {prefs.options != null && prefs.options.imageOptions.length > 1 ? (
              <ModelDropdown
                ariaLabel="Image model"
                icon={<ImageIcon className="size-3.5" />}
                options={prefs.options.imageOptions.map((opt) => ({
                  id: opt.id,
                  label: opt.model,
                }))}
                value={prefs.imageModel}
                disabled={isSending}
                onChange={onImageModelChange}
              />
            ) : null}
            {prefs.options != null && prefs.options.agentOptions.length > 1 ? (
              <ModelDropdown
                ariaLabel="Agent model"
                icon={<Sparkles className="size-3.5" />}
                options={prefs.options.agentOptions.map((opt) => ({
                  id: opt.id,
                  label: opt.model,
                }))}
                value={prefs.agentModel}
                disabled={isSending}
                onChange={onAgentModelChange}
              />
            ) : null}
            <div className="flex-1" />
            <button
              type="submit"
              disabled={draft.trim() === "" || isSending}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-600 text-white shadow-sm transition hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70 dark:focus-visible:ring-offset-zinc-900"
              aria-label={isSending ? "Agent is working" : "Send message"}
              aria-busy={isSending}
            >
              {isSending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Send className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

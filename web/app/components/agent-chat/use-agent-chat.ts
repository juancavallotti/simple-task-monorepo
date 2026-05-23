import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useRevalidator } from "react-router";

import type { BubbleMessage } from "~/components/agent-chat/bubble-row";
import { getAgentBaseURL } from "~/lib/agent-base-url";
import {
  isInternalToolName,
  parseAssistantResponse,
  uniqueUIActions,
  type UIAction,
} from "~/lib/agent-ui-actions";
import {
  agentAppName,
  buildModelContext,
  ensureSession,
  getSessionID,
  getUserID,
  randomID,
  saveSavedPrefs,
  startNewSession,
} from "~/lib/agent-session";
import {
  buildAgentMessage,
  getAppContext,
  getHighlightedText,
} from "~/lib/app-context";
import { readAgentStream } from "~/lib/agent-stream";
import { formatJson, formatJsonEvents } from "~/lib/format-json";
import type { ToolContextStore } from "~/lib/tool-context";
import { useAgentPreferencesState } from "~/state/agent-preferences/context";
import { AgentPreferencesActionType } from "~/state/agent-preferences/types";

export type ChatMessage = BubbleMessage;

function initialMessages(): ChatMessage[] {
  return [
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I can help manage recipes, inspect the current recipe list, or create and update recipes.",
    },
  ];
}

function replaceMessageContent(
  messages: ChatMessage[],
  messageID: string,
  content: string,
  uiActions?: UIAction[],
): ChatMessage[] {
  return messages.map((message) =>
    message.id === messageID ? { ...message, content, uiActions } : message,
  );
}

export function useAgentChat({
  isOpen,
  toolStore,
}: {
  isOpen: boolean;
  toolStore: ToolContextStore;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState<ChatMessage | null>(null);
  const [selectedToolCallID, setSelectedToolCallID] = useState<string | null>(
    null,
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const baseURL = useMemo(getAgentBaseURL, []);
  const location = useLocation();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { state: prefs, dispatch: prefsDispatch } = useAgentPreferencesState();

  useEffect(() => {
    if (prefs.options == null) return;
    if (prefs.agentModel == null && prefs.imageModel == null) return;
    saveSavedPrefs({
      agentModel: prefs.agentModel,
      imageModel: prefs.imageModel,
    });
  }, [prefs.options, prefs.agentModel, prefs.imageModel]);

  useEffect(() => {
    if (!isOpen) return;
    bottomRef.current?.scrollIntoView({ block: "end" });
    inputRef.current?.focus();
  }, [isOpen, messages]);

  function startNewChat() {
    if (isSending) return;
    startNewSession();
    setMessages(initialMessages());
    setDraft("");
    setError(null);
    toolStore.reset();
    inputRef.current?.focus();
  }

  function runSideEffects(uiActions: UIAction[]) {
    for (const action of uiActions) {
      if (action.type === "navigate_recipe") {
        void navigate(`/recipe/${encodeURIComponent(action.recipeId)}`);
      } else if (action.type === "navigate_recipe_list") {
        void navigate("/");
      } else if (action.type === "navigate_trace") {
        void navigate(`/traces/${encodeURIComponent(action.eventId)}`);
      } else if (action.type === "navigate_traces_list") {
        void navigate("/traces");
      } else if (action.type === "refresh_current_screen") {
        void revalidator.revalidate();
      }
    }
  }

  async function sendMessage() {
    const text = draft.trim();
    if (text === "" || isSending) return;
    const appContext = {
      ...getAppContext(location.pathname),
      highlightedText: getHighlightedText(),
    };

    const userID = getUserID();
    const sessionID = getSessionID();
    const body: Record<string, unknown> = {
      appName: agentAppName,
      userId: userID,
      sessionId: sessionID,
      streaming: true,
      newMessage: {
        role: "user",
        parts: [{ text: buildAgentMessage(text, appContext) }],
      },
    };
    const modelContext = buildModelContext(prefs);
    if (modelContext != null) {
      body.modelContext = modelContext;
    }

    const userMessage: ChatMessage = {
      id: randomID("user"),
      role: "user",
      content: text,
      rawDebug: formatJson(body),
    };
    let currentAssistantID = randomID("assistant");
    setMessages((current) => [
      ...current,
      userMessage,
      { id: currentAssistantID, role: "assistant", content: "" },
    ]);
    setDraft("");
    setError(null);
    setIsSending(true);

    let pendingNextBubble = false;
    let lastFinalizedBubbleID: string | null = null;

    function ensureCurrentBubble() {
      if (!pendingNextBubble) return;
      currentAssistantID = randomID("assistant");
      const newID = currentAssistantID;
      setMessages((current) => [
        ...current,
        { id: newID, role: "assistant", content: "" },
      ]);
      pendingNextBubble = false;
    }

    try {
      await ensureSession(baseURL, userID, sessionID);

      const res = await fetch(`${baseURL}/run_sse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`Agent request failed (${res.status})`);
      }

      await readAgentStream(res, {
        onTextProgress: (chunk, streamUIActions) => {
          ensureCurrentBubble();
          const id = currentAssistantID;
          const parsed = parseAssistantResponse(chunk);
          const uiActions = uniqueUIActions([
            ...streamUIActions,
            ...parsed.uiActions,
          ]);
          setMessages((current) =>
            replaceMessageContent(current, id, parsed.content, uiActions),
          );
        },

        onToolEvents: (toolEvents) => {
          for (const call of toolEvents.calls) {
            if (isInternalToolName(call.name)) continue;
            const isNew = toolStore.register(call);
            if (!isNew) continue;
            ensureCurrentBubble();
            const ownerId = currentAssistantID;
            setMessages((current) =>
              current.map((message) =>
                message.id === ownerId
                  ? {
                      ...message,
                      toolCallIds: [...(message.toolCallIds ?? []), call.id],
                    }
                  : message,
              ),
            );
          }
          for (const response of toolEvents.responses) {
            if (isInternalToolName(response.name)) continue;
            toolStore.applyResponse(response.id, response.response);
          }
        },

        onTurnFinalize: (chunk, streamUIActions, rawEvents) => {
          const id = currentAssistantID;
          const parsed = parseAssistantResponse(chunk);
          const uiActions = uniqueUIActions([
            ...streamUIActions,
            ...parsed.uiActions,
          ]);
          const rawDebug = formatJsonEvents(rawEvents);
          setMessages((current) =>
            current.map((message) =>
              message.id === id
                ? {
                    ...message,
                    content: parsed.content,
                    uiActions,
                    rawDebug:
                      message.rawDebug != null && message.rawDebug !== ""
                        ? `${message.rawDebug}\n\n${rawDebug}`
                        : rawDebug,
                  }
                : message,
            ),
          );
          runSideEffects(uiActions);
          lastFinalizedBubbleID = id;
          pendingNextBubble = true;
        },

        onTurnAuthoritativeText: (chunk, streamUIActions, rawEvents) => {
          const targetId = lastFinalizedBubbleID ?? currentAssistantID;
          const parsed = parseAssistantResponse(chunk);
          const uiActions = uniqueUIActions([
            ...streamUIActions,
            ...parsed.uiActions,
          ]);
          const rawDebugAppend = formatJsonEvents(rawEvents);
          setMessages((current) =>
            current.map((message) =>
              message.id === targetId
                ? {
                    ...message,
                    content: parsed.content,
                    uiActions,
                    rawDebug:
                      message.rawDebug != null && message.rawDebug !== ""
                        ? `${message.rawDebug}\n\n${rawDebugAppend}`
                        : rawDebugAppend,
                  }
                : message,
            ),
          );
          // Side effects already fired in onTurnFinalize; do not re-fire.
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent request failed.");
      const lastID = currentAssistantID;
      setMessages((current) =>
        current.filter(
          (message) => message.id !== lastID || message.content !== "",
        ),
      );
    } finally {
      setIsSending(false);
    }
  }

  function selectAgentModel(id: string) {
    prefsDispatch({
      type: AgentPreferencesActionType.SELECT_AGENT,
      data: id,
    });
  }

  function selectImageModel(id: string) {
    prefsDispatch({
      type: AgentPreferencesActionType.SELECT_IMAGE,
      data: id,
    });
  }

  return {
    messages,
    draft,
    setDraft,
    isSending,
    error,
    debugMessage,
    setDebugMessage,
    selectedToolCallID,
    setSelectedToolCallID,
    bottomRef,
    inputRef,
    prefs,
    selectAgentModel,
    selectImageModel,
    startNewChat,
    sendMessage,
  };
}

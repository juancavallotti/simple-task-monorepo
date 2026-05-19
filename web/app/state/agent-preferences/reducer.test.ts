import { describe, expect, it } from "vitest";

import { agentPreferencesReducer } from "./reducer";
import {
  AgentPreferencesActionType,
  agentPreferencesInitialState,
  type ProvidersResponse,
} from "./types";

const opts: ProvidersResponse = {
  defaultAgentModel: "google:gemini-3.1-flash-lite",
  defaultImageModel: "google:gemini-3.1-flash-image-preview",
  agentOptions: [
    {
      id: "google:gemini-3.1-flash-lite",
      provider: "google",
      model: "gemini-3.1-flash-lite",
      label: "Google · gemini",
    },
    {
      id: "anthropic:claude-haiku-4-5",
      provider: "anthropic",
      model: "claude-haiku-4-5",
      label: "Anthropic · claude",
    },
  ],
  imageOptions: [
    {
      id: "google:gemini-3.1-flash-image-preview",
      provider: "google",
      model: "gemini-3.1-flash-image-preview",
      label: "Google · gemini-img",
    },
  ],
};

describe("agentPreferencesReducer", () => {
  it("OPTIONS_LOADED with no saved prefs uses defaults", () => {
    const next = agentPreferencesReducer(agentPreferencesInitialState, {
      type: AgentPreferencesActionType.OPTIONS_LOADED,
      data: { options: opts, saved: null },
    });
    expect(next.agentModel).toBe("google:gemini-3.1-flash-lite");
    expect(next.imageModel).toBe("google:gemini-3.1-flash-image-preview");
    expect(next.options).toBe(opts);
  });

  it("OPTIONS_LOADED honors valid saved prefs", () => {
    const next = agentPreferencesReducer(agentPreferencesInitialState, {
      type: AgentPreferencesActionType.OPTIONS_LOADED,
      data: {
        options: opts,
        saved: {
          agentModel: "anthropic:claude-haiku-4-5",
          imageModel: null,
        },
      },
    });
    expect(next.agentModel).toBe("anthropic:claude-haiku-4-5");
    expect(next.imageModel).toBe("google:gemini-3.1-flash-image-preview");
  });

  it("OPTIONS_LOADED falls back to default when saved is no longer offered", () => {
    const next = agentPreferencesReducer(agentPreferencesInitialState, {
      type: AgentPreferencesActionType.OPTIONS_LOADED,
      data: {
        options: opts,
        saved: { agentModel: "openai:vanished", imageModel: null },
      },
    });
    expect(next.agentModel).toBe("google:gemini-3.1-flash-lite");
  });

  it("SELECT_AGENT ignores unknown IDs", () => {
    const loaded = agentPreferencesReducer(agentPreferencesInitialState, {
      type: AgentPreferencesActionType.OPTIONS_LOADED,
      data: { options: opts, saved: null },
    });
    const next = agentPreferencesReducer(loaded, {
      type: AgentPreferencesActionType.SELECT_AGENT,
      data: "garbage:foo",
    });
    expect(next.agentModel).toBe(loaded.agentModel);
  });

  it("SELECT_AGENT accepts known IDs", () => {
    const loaded = agentPreferencesReducer(agentPreferencesInitialState, {
      type: AgentPreferencesActionType.OPTIONS_LOADED,
      data: { options: opts, saved: null },
    });
    const next = agentPreferencesReducer(loaded, {
      type: AgentPreferencesActionType.SELECT_AGENT,
      data: "anthropic:claude-haiku-4-5",
    });
    expect(next.agentModel).toBe("anthropic:claude-haiku-4-5");
  });
});

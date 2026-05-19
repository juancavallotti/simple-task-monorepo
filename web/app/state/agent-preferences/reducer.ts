import {
  AgentPreferencesActionType,
  agentPreferencesInitialState,
  type AgentPreferencesAction,
  type AgentPreferencesState,
  type ProvidersResponse,
} from "./types";

export function agentPreferencesReducer(
  state: AgentPreferencesState = agentPreferencesInitialState,
  action: AgentPreferencesAction,
): AgentPreferencesState {
  switch (action.type) {
    case AgentPreferencesActionType.OPTIONS_LOADED: {
      const { options, saved } = action.data;
      return {
        options,
        loadError: null,
        agentModel: resolveSelection(
          saved?.agentModel ?? null,
          options,
          "agent",
        ),
        imageModel: resolveSelection(
          saved?.imageModel ?? null,
          options,
          "image",
        ),
      };
    }
    case AgentPreferencesActionType.OPTIONS_FAILED:
      return {
        ...state,
        loadError: action.data,
      };
    case AgentPreferencesActionType.SELECT_AGENT: {
      if (state.options == null) return state;
      if (!state.options.agentOptions.some((opt) => opt.id === action.data)) {
        return state;
      }
      return { ...state, agentModel: action.data };
    }
    case AgentPreferencesActionType.SELECT_IMAGE: {
      if (state.options == null) return state;
      if (!state.options.imageOptions.some((opt) => opt.id === action.data)) {
        return state;
      }
      return { ...state, imageModel: action.data };
    }
    default:
      return state;
  }
}

function resolveSelection(
  saved: string | null,
  options: ProvidersResponse,
  kind: "agent" | "image",
): string {
  const list = kind === "agent" ? options.agentOptions : options.imageOptions;
  const fallback =
    kind === "agent" ? options.defaultAgentModel : options.defaultImageModel;
  if (saved != null && list.some((opt) => opt.id === saved)) {
    return saved;
  }
  return fallback;
}

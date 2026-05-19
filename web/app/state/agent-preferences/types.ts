export type AgentOption = {
  id: string;
  provider: string;
  model: string;
  label: string;
};

export type ImageOption = {
  id: string;
  provider: string;
  model: string;
  label: string;
};

export type ProvidersResponse = {
  defaultAgentModel: string;
  defaultImageModel: string;
  agentOptions: AgentOption[];
  imageOptions: ImageOption[];
};

export type AgentPreferencesState = {
  options: ProvidersResponse | null;
  loadError: string | null;
  agentModel: string | null;
  imageModel: string | null;
};

export const AgentPreferencesActionType = {
  OPTIONS_LOADED: "OPTIONS_LOADED",
  OPTIONS_FAILED: "OPTIONS_FAILED",
  SELECT_AGENT: "SELECT_AGENT",
  SELECT_IMAGE: "SELECT_IMAGE",
} as const;

export type AgentPreferencesAction =
  | {
      type: typeof AgentPreferencesActionType.OPTIONS_LOADED;
      data: { options: ProvidersResponse; saved: SavedPrefs | null };
    }
  | { type: typeof AgentPreferencesActionType.OPTIONS_FAILED; data: string }
  | { type: typeof AgentPreferencesActionType.SELECT_AGENT; data: string }
  | { type: typeof AgentPreferencesActionType.SELECT_IMAGE; data: string };

export type SavedPrefs = {
  agentModel: string | null;
  imageModel: string | null;
};

export const agentPreferencesInitialState: AgentPreferencesState = {
  options: null,
  loadError: null,
  agentModel: null,
  imageModel: null,
};

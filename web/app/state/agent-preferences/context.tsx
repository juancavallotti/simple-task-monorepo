import type { ReactNode } from "react";

import { bootstrapProvider } from "@eetr/react-reducer-utils";

import { agentPreferencesReducer } from "./reducer";
import { agentPreferencesInitialState } from "./types";
import type {
  AgentPreferencesAction,
  AgentPreferencesState,
} from "./types";

const { Provider, useContextAccessors } = bootstrapProvider<
  AgentPreferencesState,
  AgentPreferencesAction
>(agentPreferencesReducer, agentPreferencesInitialState);

export function AgentPreferencesProvider({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>;
}

export { useContextAccessors as useAgentPreferencesState };

import type { ReactNode } from "react";

import { bootstrapProvider } from "@eetr/react-reducer-utils";

import { editRecipeInitialState, editRecipeReducer } from "./reducer";
import type { EditRecipeAction, EditRecipeState } from "./types";

const { Provider, useContextAccessors } = bootstrapProvider<
  EditRecipeState,
  EditRecipeAction
>(editRecipeReducer, editRecipeInitialState);

export function EditRecipeProvider({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>;
}

export { useContextAccessors as useEditRecipeState };

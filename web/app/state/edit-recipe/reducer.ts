import { emptyRecipeDraft, recipeToDraft } from "~/lib/recipe-draft";

import {
  EditRecipeActionType,
  type EditRecipeAction,
  type EditRecipeState,
} from "./types";

export const editRecipeInitialState: EditRecipeState = {
  baseRecipe: null,
  draft: emptyRecipeDraft(),
  loadError: null,
  saveError: null,
  submitting: false,
};

export function editRecipeReducer(
  state: EditRecipeState = editRecipeInitialState,
  action: EditRecipeAction,
): EditRecipeState {
  switch (action.type) {
    case EditRecipeActionType.LOAD_RESET:
      return editRecipeInitialState;
    case EditRecipeActionType.LOAD_SUCCESS:
      return {
        ...editRecipeInitialState,
        baseRecipe: action.data,
        draft: recipeToDraft(action.data),
      };
    case EditRecipeActionType.LOAD_FAILED:
    case EditRecipeActionType.MISSING_ID:
      return {
        ...editRecipeInitialState,
        loadError: action.data,
      };
    case EditRecipeActionType.UPDATE_DRAFT:
      return { ...state, draft: action.data };
    case EditRecipeActionType.SUBMIT_START:
      return { ...state, submitting: true, saveError: null };
    case EditRecipeActionType.SUBMIT_ERROR:
      return { ...state, submitting: false, saveError: action.data };
    default:
      return state;
  }
}

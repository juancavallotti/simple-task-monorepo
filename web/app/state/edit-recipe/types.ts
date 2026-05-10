import type { Recipe } from "~/lib/recipe-api";
import type { RecipeDraft } from "~/lib/recipe-draft";

export type EditRecipeState = {
  baseRecipe: Recipe | null;
  draft: RecipeDraft;
  loadError: string | null;
  saveError: string | null;
  submitting: boolean;
};

export const EditRecipeActionType = {
  LOAD_RESET: "LOAD_RESET",
  LOAD_SUCCESS: "LOAD_SUCCESS",
  LOAD_FAILED: "LOAD_FAILED",
  MISSING_ID: "MISSING_ID",
  UPDATE_DRAFT: "UPDATE_DRAFT",
  SUBMIT_START: "SUBMIT_START",
  SUBMIT_ERROR: "SUBMIT_ERROR",
} as const;

export type EditRecipeAction =
  | { type: typeof EditRecipeActionType.LOAD_RESET }
  | { type: typeof EditRecipeActionType.LOAD_SUCCESS; data: Recipe }
  | { type: typeof EditRecipeActionType.LOAD_FAILED; data: string }
  | { type: typeof EditRecipeActionType.MISSING_ID; data: string }
  | { type: typeof EditRecipeActionType.UPDATE_DRAFT; data: RecipeDraft }
  | { type: typeof EditRecipeActionType.SUBMIT_START }
  | { type: typeof EditRecipeActionType.SUBMIT_ERROR; data: string };

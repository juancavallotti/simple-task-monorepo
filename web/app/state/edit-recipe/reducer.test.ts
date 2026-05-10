import { describe, expect, it } from "vitest";

import type { Recipe } from "~/lib/recipe-api";
import { emptyRecipeDraft } from "~/lib/recipe-draft";

import { editRecipeReducer, editRecipeInitialState } from "./reducer";
import { EditRecipeActionType, type EditRecipeState } from "./types";

function sampleRecipe(): Recipe {
  return {
    id: "abc",
    name: "Pie",
    description: "Good",
    category: "Dessert",
    image: "",
    ingredients: ["flour"],
    instructions: ["bake"],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-02T00:00:00Z",
  };
}

describe("editRecipeReducer", () => {
  it("LOAD_RESET restores initial shape", () => {
    const dirty: EditRecipeState = {
      ...editRecipeInitialState,
      baseRecipe: sampleRecipe(),
      draft: { ...emptyRecipeDraft(), name: "X" },
      loadError: "e",
      saveError: "s",
      submitting: true,
    };
    const next = editRecipeReducer(dirty, {
      type: EditRecipeActionType.LOAD_RESET,
    });
    expect(next).toEqual(editRecipeInitialState);
  });

  it("LOAD_SUCCESS stores recipe and draft", () => {
    const r = sampleRecipe();
    const next = editRecipeReducer(editRecipeInitialState, {
      type: EditRecipeActionType.LOAD_SUCCESS,
      data: r,
    });
    expect(next.baseRecipe).toEqual(r);
    expect(next.draft.name).toBe("Pie");
    expect(next.loadError).toBeNull();
    expect(next.saveError).toBeNull();
  });

  it("LOAD_FAILED sets loadError", () => {
    const next = editRecipeReducer(editRecipeInitialState, {
      type: EditRecipeActionType.LOAD_FAILED,
      data: "gone",
    });
    expect(next.loadError).toBe("gone");
    expect(next.baseRecipe).toBeNull();
  });

  it("UPDATE_DRAFT updates draft only", () => {
    const r = sampleRecipe();
    const withRecipe = editRecipeReducer(editRecipeInitialState, {
      type: EditRecipeActionType.LOAD_SUCCESS,
      data: r,
    });
    const draft = { ...withRecipe.draft, name: "Tart" };
    const next = editRecipeReducer(withRecipe, {
      type: EditRecipeActionType.UPDATE_DRAFT,
      data: draft,
    });
    expect(next.draft.name).toBe("Tart");
    expect(next.baseRecipe).toEqual(r);
  });

  it("SUBMIT_START clears saveError and sets submitting", () => {
    const next = editRecipeReducer(
      { ...editRecipeInitialState, saveError: "old", submitting: false },
      { type: EditRecipeActionType.SUBMIT_START },
    );
    expect(next.submitting).toBe(true);
    expect(next.saveError).toBeNull();
  });

  it("SUBMIT_ERROR clears submitting and sets saveError", () => {
    const next = editRecipeReducer(
      { ...editRecipeInitialState, submitting: true },
      {
        type: EditRecipeActionType.SUBMIT_ERROR,
        data: "bad",
      },
    );
    expect(next.submitting).toBe(false);
    expect(next.saveError).toBe("bad");
  });
});

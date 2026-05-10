import { describe, expect, it } from "vitest";

import type { Recipe } from "~/lib/recipe-api";

import { draftToRecipeForReplace, emptyRecipeDraft } from "./recipe-draft";

describe("draftToRecipeForReplace", () => {
  it("merges trimmed draft fields and preserves id and timestamps", () => {
    const existing: Recipe = {
      id: "uuid-1",
      name: "Old",
      description: "d",
      category: "c",
      image: "http://x",
      ingredients: ["a"],
      instructions: ["b"],
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-02T00:00:00Z",
    };
    const draft = {
      ...emptyRecipeDraft(),
      name: "  New name  ",
      description: "desc",
      category: "Dinner",
      image: "",
      ingredients: ["  1 cup rice ", ""],
      instructions: ["  boil  "],
    };
    const out = draftToRecipeForReplace(existing, draft);
    expect(out.id).toBe("uuid-1");
    expect(out.name).toBe("New name");
    expect(out.ingredients).toEqual(["1 cup rice"]);
    expect(out.instructions).toEqual(["boil"]);
    expect(out.created_at).toBe(existing.created_at);
    expect(out.updated_at).toBe(existing.updated_at);
  });
});

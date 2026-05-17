import { describe, expect, it } from "vitest";

import { draftToRecipePatch, emptyRecipeDraft } from "./recipe-draft";

describe("draftToRecipePatch", () => {
  it("returns only trimmed mutable fields and omits photos", () => {
    const draft = {
      ...emptyRecipeDraft(),
      name: "  New name  ",
      description: "desc",
      category: "Dinner",
      image: "",
      ingredients: ["  1 cup rice ", ""],
      instructions: ["  boil  "],
    };
    const out = draftToRecipePatch(draft);
    expect(out).toEqual({
      name: "New name",
      description: "desc",
      category: "Dinner",
      image: "",
      ingredients: ["1 cup rice"],
      instructions: ["boil"],
    });
    expect("photos" in out).toBe(false);
    expect("id" in out).toBe(false);
    expect("created_at" in out).toBe(false);
    expect("updated_at" in out).toBe(false);
  });
});

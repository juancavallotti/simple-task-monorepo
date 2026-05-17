import { describe, expect, it } from "vitest";

import type { Recipe } from "~/lib/recipe-api";
import { getRecipeDisplayPhotos, getRecipePrimaryPhoto } from "~/lib/recipe-photos";

function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "recipe-1",
    name: "Soup",
    description: "A good soup",
    category: "Dinner",
    image: "https://example.com/soup.jpg",
    ingredients: ["water"],
    instructions: ["boil"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("recipe photos", () => {
  it("uses the image URL as the primary photo when there is no featured stored photo", () => {
    const primary = getRecipePrimaryPhoto(
      recipe({
        photos: [{ id: "photo-1", image_base64: "aW1n", featured: false }],
      }),
    );

    expect(primary).toMatchObject({
      src: "https://example.com/soup.jpg",
      source: "url",
    });
  });

  it("promotes the featured stored photo ahead of the image URL", () => {
    const photos = getRecipeDisplayPhotos(
      recipe({
        photos: [
          { id: "photo-1", image_base64: "aW1n", featured: false },
          { id: "photo-2", image_base64: "iVBORw0KGgo=", featured: true },
        ],
      }),
    );

    expect(photos.map((photo) => photo.key)).toEqual([
      "photo-2",
      "image-url",
      "photo-1",
    ]);
    expect(photos[0]).toMatchObject({
      src: "data:image/png;base64,iVBORw0KGgo=",
      featured: true,
      source: "stored",
    });
  });
});

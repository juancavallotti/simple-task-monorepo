/**
 * Shared recipe types (safe for client bundles).
 * All HTTP calls to the recipes service live in `recipes-http.server.ts` (Node only).
 */
export type Recipe = {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  photos?: RecipePhoto[];
  ingredients: string[];
  instructions: string[];
  created_at: string;
  updated_at: string;
};

export type RecipePhoto = {
  id?: string;
  image_base64: string;
  featured: boolean;
};

export type CreateRecipeBody = {
  name: string;
  description: string;
  category: string;
  image: string;
  ingredients: string[];
  instructions: string[];
};

export type RecipePatchBody = Partial<CreateRecipeBody>;

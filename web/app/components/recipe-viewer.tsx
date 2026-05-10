import { ChefHat } from "lucide-react";

import type { Recipe } from "~/lib/recipe-api";

export type RecipeViewerProps = {
  recipe: Recipe;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RecipeViewer({ recipe }: RecipeViewerProps) {
  const ingredients = recipe.ingredients.map((s) => s.trim()).filter(Boolean);
  const instructions = recipe.instructions.map((s) => s.trim()).filter(Boolean);

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="aspect-[21/9] max-h-72 w-full bg-zinc-100 dark:bg-zinc-800 sm:aspect-[2/1]">
        {recipe.image.trim() !== "" ? (
          <img
            src={recipe.image}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-zinc-400 dark:text-zinc-500">
            <ChefHat className="size-16 stroke-[1.25]" aria-hidden />
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8">
        <header className="border-b border-zinc-100 pb-6 dark:border-zinc-800">
          <div className="flex flex-wrap items-baseline gap-3 gap-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
              {recipe.name}
            </h1>
            {recipe.category.trim() !== "" ? (
              <span className="shrink-0 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {recipe.category}
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Added {formatDate(recipe.created_at)}
            {recipe.updated_at !== recipe.created_at ? (
              <> · Updated {formatDate(recipe.updated_at)}</>
            ) : null}
          </p>
          {recipe.description.trim() !== "" ? (
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {recipe.description}
            </p>
          ) : null}
        </header>

        <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-12">
          <section aria-labelledby="recipe-viewer-ingredients">
            <h2
              id="recipe-viewer-ingredients"
              className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Ingredients
            </h2>
            {ingredients.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-800 dark:text-zinc-200">
                {ingredients.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                No ingredients listed.
              </p>
            )}
          </section>

          <section aria-labelledby="recipe-viewer-instructions">
            <h2
              id="recipe-viewer-instructions"
              className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Instructions
            </h2>
            {instructions.length > 0 ? (
              <ol className="mt-3 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                {instructions.map((step, i) => (
                  <li key={i} className="pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                No steps listed.
              </p>
            )}
          </section>
        </div>
      </div>
    </article>
  );
}

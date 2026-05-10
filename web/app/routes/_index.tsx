import { ChefHat } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { type Recipe, listRecipes } from "~/lib/recipe-api";

import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Recipes · Recipe manager" },
    { name: "description", content: "Browse recipes" },
  ];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RecipesIndex() {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listRecipes()
      .then((data) => {
        if (!cancelled) setRecipes(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
        Recipes
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        All recipes from your library, newest first.
      </p>

      {error ? (
        <div
          className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          <p>{error}</p>
          <button
            type="button"
            className="mt-3 text-sm font-medium text-red-900 underline-offset-2 hover:underline dark:text-red-100"
            onClick={() => {
              setRecipes(null);
              setError(null);
              listRecipes()
                .then(setRecipes)
                .catch((err) => {
                  setError(
                    err instanceof Error ? err.message : "Something went wrong",
                  );
                });
            }}
          >
            Try again
          </button>
        </div>
      ) : null}

      {!error && recipes === null ? (
        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : null}

      {!error && recipes !== null && recipes.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No recipes yet. Create one to get started.
          </p>
          <Link
            to="/create"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Create recipe
          </Link>
        </div>
      ) : null}

      {!error && recipes !== null && recipes.length > 0 ? (
        <ul className="mt-8 flex flex-col gap-3">
          {recipes.map((r) => (
            <li
              key={r.id}
              className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {r.image.trim() !== "" ? (
                  <img
                    src={r.image}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-zinc-400 dark:text-zinc-500">
                    <ChefHat className="size-8 stroke-[1.5]" aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {r.name}
                  </h3>
                  {r.category.trim() !== "" ? (
                    <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {r.category}
                    </span>
                  ) : null}
                </div>
                {r.description.trim() !== "" ? (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {r.description}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  Added {formatDate(r.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

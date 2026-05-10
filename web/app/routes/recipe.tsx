import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { RecipeViewer } from "~/components/recipe-viewer";
import { type Recipe, getRecipe } from "~/lib/recipe-api";

import type { Route } from "./+types/recipe";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Recipe · Recipe manager" },
    { name: "description", content: "View recipe details" },
  ];
}

export default function RecipeDetail() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id == null || id === "") {
      setRecipe(null);
      setError("Missing recipe id.");
      return;
    }
    let cancelled = false;
    setError(null);
    setRecipe(null);
    getRecipe(id)
      .then((data) => {
        if (!cancelled) setRecipe(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="size-4 stroke-[2]" aria-hidden />
        All recipes
      </Link>

      {error ? (
        <div
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          <p>{error}</p>
        </div>
      ) : null}

      {!error && recipe === null ? (
        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : null}

      {!error && recipe !== null ? (
        <div className="mt-6">
          <RecipeViewer recipe={recipe} />
        </div>
      ) : null}
    </div>
  );
}

import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Recipes · Recipe manager" },
    { name: "description", content: "Browse recipes" },
  ];
}

export default function RecipesIndex() {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
        Recipes
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        List and manage recipes here. (Not wired yet.)
      </p>
    </div>
  );
}

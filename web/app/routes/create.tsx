import type { Route } from "./+types/create";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create recipe · Recipe manager" },
    { name: "description", content: "Add a new recipe" },
  ];
}

export default function CreateRecipe() {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
        Create recipe
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Form and actions will live here. (Not wired yet.)
      </p>
    </div>
  );
}

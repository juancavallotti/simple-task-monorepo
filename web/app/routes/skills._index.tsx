import { Plus } from "lucide-react";
import { Link, useLoaderData } from "react-router";

import type { Skill } from "~/lib/skills-api";

import type { Route } from "./+types/skills._index";

export async function loader({ request }: Route.LoaderArgs) {
  const { listSkills } = await import("~/lib/skills-http.server");
  try {
    const skills = await listSkills(request);
    return { skills, listError: null as string | null };
  } catch (err) {
    return {
      skills: null as Skill[] | null,
      listError:
        err instanceof Error ? err.message : "Something went wrong",
    };
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Skills · Recipe manager" },
    {
      name: "description",
      content: "Skill instructions the agent loads on demand",
    },
  ];
}

export default function SkillsIndex() {
  const { skills, listError } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
            Skills
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Domain-specific instructions the agent loads on demand. Edit the
            content to change agent behavior in that domain.
          </p>
        </div>
        <Link
          to="/skills/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="size-4 stroke-[2]" aria-hidden />
          New skill
        </Link>
      </div>

      {listError ? (
        <div
          className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {listError}
        </div>
      ) : null}

      {!listError && skills !== null && skills.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No skills yet.
          </p>
        </div>
      ) : null}

      {!listError && skills !== null && skills.length > 0 ? (
        <ul className="mt-6 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {skills.map((skill) => (
            <li key={skill.id}>
              <Link
                to={`/skills/${skill.id}`}
                className="block px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <p className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {skill.name}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {skill.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

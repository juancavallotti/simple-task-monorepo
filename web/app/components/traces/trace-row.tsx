import type { ReactNode } from "react";
import { Link } from "react-router";

import { formatDurationMs } from "~/lib/trace-format";
import type { Trace } from "~/lib/traces-api";

export function TraceRow({
  trace,
  eventId,
  isSelected,
  label,
  icon,
  duration,
}: {
  trace: Trace;
  eventId: string;
  isSelected: boolean;
  label: string;
  icon: ReactNode;
  duration: number | null;
}) {
  return (
    <Link
      replace
      to={`/traces/${eventId}?trace=${encodeURIComponent(trace.id)}`}
      className={
        isSelected
          ? "flex items-start gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "flex items-start gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
      }
    >
      <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium">{label}</span>
        <span className="text-xs opacity-70">
          {new Date(trace.occurred_at).toLocaleTimeString()}
          {duration != null ? ` · ${formatDurationMs(duration)}` : ""}
        </span>
      </span>
    </Link>
  );
}

import { JsonBlock } from "~/components/json-block";
import { durationMs, formatDurationMs } from "~/lib/trace-format";
import {
  getTraceMsg,
  itemToolName,
  type TraceItem,
} from "~/lib/trace-grouping";
import type { Trace } from "~/lib/traces-api";

function TraceJsonSection({
  trace,
  nextTrace,
}: {
  trace: Trace;
  nextTrace: Trace | undefined;
}) {
  const msg = getTraceMsg(trace.data);
  const label = msg.startsWith("tool.")
    ? msg.slice("tool.".length)
    : msg !== ""
      ? msg
      : "event";
  const sectionDuration = nextTrace
    ? durationMs(trace.occurred_at, nextTrace.occurred_at)
    : null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 border-y border-zinc-200 bg-white px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <span>{label}</span>
        <span className="font-normal normal-case tracking-normal">
          {new Date(trace.occurred_at).toLocaleTimeString()}
          {sectionDuration != null ? ` · ${formatDurationMs(sectionDuration)}` : ""}
        </span>
      </div>
      <JsonBlock value={trace.data} variant="panelSection" empty="(no data)" />
    </div>
  );
}

export function SelectedItemView({
  item,
  selectionMissed,
}: {
  item: TraceItem;
  selectionMissed: boolean;
}) {
  const missedHint = selectionMissed ? (
    <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
      Selected trace not found in this event — showing the first trace.
    </p>
  ) : null;

  if (item.kind === "single") {
    return (
      <>
        <div className="flex items-baseline justify-between gap-3 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
          <p className="truncate font-mono text-xs text-zinc-600 dark:text-zinc-400">
            {item.trace.id}
          </p>
          <p className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
            {new Date(item.trace.occurred_at).toLocaleString()}
          </p>
        </div>
        {missedHint}
        <JsonBlock value={item.trace.data} variant="panel" empty="(no data)" />
      </>
    );
  }

  const toolName = itemToolName(item);
  const first = item.traces[0];
  const last = item.traces[item.traces.length - 1];
  const totalDuration =
    item.traces.length > 1 ? durationMs(first.occurred_at, last.occurred_at) : null;

  return (
    <>
      <div className="flex items-baseline justify-between gap-3 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
          Tool call · <span className="font-mono">{toolName}</span>
          {item.functionCallId != null ? (
            <span className="ml-2 font-mono text-zinc-500 dark:text-zinc-500">
              · {item.functionCallId}
            </span>
          ) : null}
          {totalDuration != null ? (
            <span className="ml-2 text-zinc-500 dark:text-zinc-500">
              · {formatDurationMs(totalDuration)} total
            </span>
          ) : null}
        </p>
        <p className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
          {new Date(first.occurred_at).toLocaleString()}
        </p>
      </div>
      {missedHint}
      <div className="flex-1 overflow-auto bg-zinc-50 dark:bg-zinc-950/40">
        {item.traces.map((trace, i) => (
          <TraceJsonSection
            key={trace.id}
            trace={trace}
            nextTrace={item.traces[i + 1]}
          />
        ))}
      </div>
    </>
  );
}

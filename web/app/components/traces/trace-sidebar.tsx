import { Bot, Wrench } from "lucide-react";

import { durationMs } from "~/lib/trace-format";
import {
  getTraceMsg,
  itemKey,
  itemTime,
  itemToolName,
  type TraceItem,
} from "~/lib/trace-grouping";

import { TraceRow } from "./trace-row";

export function TraceSidebar({
  eventId,
  items,
  selectedItem,
}: {
  eventId: string;
  items: TraceItem[];
  selectedItem: TraceItem;
}) {
  return (
    <div className="flex w-72 shrink-0 flex-col gap-1 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
      {items.map((item, i) => {
        const next = items[i + 1];
        if (item.kind === "single") {
          const msg = getTraceMsg(item.trace.data);
          const duration = next
            ? durationMs(item.trace.occurred_at, itemTime(next))
            : null;

          return (
            <TraceRow
              key={item.trace.id}
              trace={item.trace}
              eventId={eventId}
              isSelected={itemKey(selectedItem) === item.trace.id}
              label={msg !== "" ? msg : "trace"}
              icon={
                msg === "agent.event" ? (
                  <Bot className="size-3.5 shrink-0" aria-hidden />
                ) : null
              }
              duration={duration}
            />
          );
        }

        const first = item.traces[0];
        const last = item.traces[item.traces.length - 1];
        const totalDuration =
          item.traces.length > 1
            ? durationMs(first.occurred_at, last.occurred_at)
            : null;

        return (
          <TraceRow
            key={first.id}
            trace={first}
            eventId={eventId}
            isSelected={itemKey(selectedItem) === first.id}
            label={itemToolName(item)}
            icon={<Wrench className="size-3.5 shrink-0" aria-hidden />}
            duration={totalDuration}
          />
        );
      })}
    </div>
  );
}

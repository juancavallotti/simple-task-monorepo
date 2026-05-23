import { ArrowLeft } from "lucide-react";
import {
  Link,
  useLoaderData,
  useNavigation,
  useParams,
  useSearchParams,
} from "react-router";

import { SelectedItemView } from "~/components/traces/selected-item-view";
import { TraceSidebar } from "~/components/traces/trace-sidebar";
import { useTraceDetailLoaderSync } from "~/components/traces/use-trace-detail-loader-sync";
import type { Trace } from "~/lib/traces-api";
import {
  findUserPrompt,
  groupTraces,
  type TraceItem,
} from "~/lib/trace-grouping";
import {
  TraceDetailProvider,
  useTraceDetailState,
} from "~/state/trace-detail/context";

import type { Route } from "./+types/traces.$event_id";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { listEventTraces } = await import("~/lib/traces-http.server");
  const eventId = params.event_id;
  if (eventId == null || eventId === "") {
    return {
      eventId: "",
      traces: null as Trace[] | null,
      error: "Missing event id.",
    };
  }
  try {
    const traces = await listEventTraces(request, eventId);
    return { eventId, traces, error: null as string | null };
  } catch (err) {
    return {
      eventId,
      traces: null as Trace[] | null,
      error: err instanceof Error ? err.message : "Something went wrong",
    };
  }
}

export function meta({ data }: Route.MetaArgs) {
  if (data?.eventId != null && data.eventId !== "") {
    return [{ title: `Event ${data.eventId} · Recipe manager` }];
  }
  return [{ title: "Event · Recipe manager" }];
}

function findContainingItem(
  items: TraceItem[],
  traceId: string | null,
): TraceItem | null {
  if (traceId == null) return null;
  for (const item of items) {
    if (item.kind === "single") {
      if (item.trace.id === traceId) return item;
    } else if (item.traces.some((t) => t.id === traceId)) {
      return item;
    }
  }
  return null;
}

function TraceDetailContent() {
  const params = useParams();
  const eventId = params.event_id ?? "";
  const loaderData = useLoaderData<typeof loader>();
  const { state, dispatch } = useTraceDetailState();
  const { traces, error } = state;
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get("trace");

  useTraceDetailLoaderSync({ eventId, loaderData, dispatch });

  const isPending =
    eventId !== "" &&
    navigation.state === "loading" &&
    navigation.location?.pathname === `/traces/${eventId}` &&
    traces == null;

  const items = traces != null ? groupTraces(traces) : [];
  const userPrompt = traces != null ? findUserPrompt(traces) : "";
  const matchedItem = findContainingItem(items, selectedId);
  const selectionMissed =
    traces != null && selectedId != null && matchedItem == null;
  const selectedItem = matchedItem ?? (items[0] ?? null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/traces"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="size-4 stroke-[2]" aria-hidden />
          All events
        </Link>
        {eventId !== "" ? (
          <p className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {eventId}
          </p>
        ) : null}
      </div>

      {error ? (
        <div
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          <p>{error}</p>
        </div>
      ) : null}

      {!error && (traces === null || isPending) ? (
        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : null}

      {!error && traces !== null && !isPending && userPrompt !== "" ? (
        <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            User prompt
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {userPrompt}
          </p>
        </section>
      ) : null}

      {!error && traces !== null && !isPending && traces.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This event has no traces.
          </p>
        </div>
      ) : null}

      {!error &&
      traces !== null &&
      !isPending &&
      traces.length > 0 &&
      selectedItem != null ? (
        <div className="mt-4 flex min-h-0 flex-1 gap-4">
          <TraceSidebar
            eventId={eventId}
            items={items}
            selectedItem={selectedItem}
          />

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <SelectedItemView
              item={selectedItem}
              selectionMissed={selectionMissed}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TraceDetailRoute() {
  return (
    <TraceDetailProvider>
      <TraceDetailContent />
    </TraceDetailProvider>
  );
}

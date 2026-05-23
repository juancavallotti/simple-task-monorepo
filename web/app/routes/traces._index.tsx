import { useLoaderData } from "react-router";

import { ClearAllEventsControl } from "~/components/traces/clear-all-events-control";
import { TraceEventListItem } from "~/components/traces/trace-event-list-item";
import { useTracesListController } from "~/components/traces/use-traces-list-controller";
import type { TracesActionResult } from "~/lib/traces-action-result";
import type { Event } from "~/lib/traces-api";
import {
  TracesListProvider,
  useTracesListState,
} from "~/state/traces-list/context";

import type { Route } from "./+types/traces._index";

export async function loader({ request }: Route.LoaderArgs) {
  const { listEvents } = await import("~/lib/traces-http.server");
  try {
    const events = await listEvents(request);
    return { events, listError: null as string | null };
  } catch (err) {
    return {
      events: null as Event[] | null,
      listError:
        err instanceof Error ? err.message : "Something went wrong",
    };
  }
}

export async function action({
  request,
}: Route.ActionArgs): Promise<TracesActionResult> {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "clear") {
    const { deleteAllEvents } = await import("~/lib/traces-http.server");
    try {
      await deleteAllEvents(request);
      return { ok: true as const, intent: "clear" as const };
    } catch (err) {
      return {
        ok: false as const,
        intent: "clear" as const,
        error: err instanceof Error ? err.message : "Could not clear events",
      };
    }
  }

  if (intent === "delete-event") {
    const { deleteEvent } = await import("~/lib/traces-http.server");
    const eventId = formData.get("event_id");
    if (typeof eventId !== "string" || eventId === "") {
      return {
        ok: false as const,
        intent: "delete-event" as const,
        error: "Missing event id.",
      };
    }
    try {
      await deleteEvent(request, eventId);
      return {
        ok: true as const,
        intent: "delete-event" as const,
        eventId,
      };
    } catch (err) {
      return {
        ok: false as const,
        intent: "delete-event" as const,
        eventId,
        error: err instanceof Error ? err.message : "Could not delete event",
      };
    }
  }

  return {
    ok: false as const,
    intent: "clear" as const,
    error: "Unsupported action.",
  };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Traces · Recipe manager" },
    { name: "description", content: "Recent agent events" },
  ];
}

function TracesIndexContent() {
  const loaderData = useLoaderData<typeof loader>();
  const { state, dispatch } = useTracesListState();
  const { events, listError, deletingEventId, isClearing, mutationError } =
    state;
  const tracesList = useTracesListController({ loaderData, dispatch });

  const hasEvents = events != null && events.length > 0;
  const anyMutation = isClearing || deletingEventId !== null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
            Traces
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Recent agent events, newest first.
          </p>
        </div>
        {hasEvents ? (
          <div className="shrink-0">
            <ClearAllEventsControl
              Form={tracesList.clearFetcher.Form}
              disabled={anyMutation}
              isConfirming={tracesList.isConfirmingClear}
              onCancel={() => tracesList.setIsConfirmingClear(false)}
              onConfirm={() => tracesList.setIsConfirmingClear(true)}
              onSubmit={tracesList.clearAllStarted}
            />
          </div>
        ) : null}
      </div>

      {mutationError ? (
        <div
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          <p>{mutationError}</p>
          <button
            type="button"
            className="mt-2 text-sm font-medium text-red-900 underline-offset-2 hover:underline dark:text-red-100"
            onClick={tracesList.dismissMutationError}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {listError ? (
        <div
          className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          <p>{listError}</p>
          <button
            type="button"
            className="mt-3 text-sm font-medium text-red-900 underline-offset-2 hover:underline dark:text-red-100"
            onClick={tracesList.retryList}
          >
            Try again
          </button>
        </div>
      ) : null}

      {!listError && (events === null || tracesList.isLoadingList) ? (
        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : null}

      {!listError &&
      events !== null &&
      !tracesList.isLoadingList &&
      events.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No events yet.
          </p>
        </div>
      ) : null}

      {!listError &&
      events !== null &&
      !tracesList.isLoadingList &&
      events.length > 0 ? (
        <ul className="mt-6 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {events.map((event) => (
            <TraceEventListItem
              key={event.event_id}
              event={event}
              Form={tracesList.deleteFetcher.Form}
              disabled={anyMutation}
              isConfirming={tracesList.confirmingEventId === event.event_id}
              isDeleting={deletingEventId === event.event_id}
              onCancelDelete={() => tracesList.setConfirmingEventId(null)}
              onConfirmDelete={() =>
                tracesList.setConfirmingEventId(event.event_id)
              }
              onDeleteStarted={() =>
                tracesList.deleteEventStarted(event.event_id)
              }
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function TracesIndex() {
  return (
    <TracesListProvider>
      <TracesIndexContent />
    </TracesListProvider>
  );
}

import { useEffect } from "react";

import type { Trace } from "~/lib/traces-api";
import type { TraceDetailAction } from "~/state/trace-detail/types";
import { TraceDetailActionType } from "~/state/trace-detail/types";

export function useTraceDetailLoaderSync({
  eventId,
  loaderData,
  dispatch,
}: {
  eventId: string;
  loaderData: {
    eventId: string;
    traces: Trace[] | null;
    error: string | null;
  };
  dispatch: (action: TraceDetailAction) => void;
}) {
  useEffect(() => {
    if (eventId === "") {
      dispatch({
        type: TraceDetailActionType.MISSING_ID,
        data: "Missing event id.",
      });
      return;
    }

    dispatch({ type: TraceDetailActionType.LOAD_RESET });
    if (loaderData.error) {
      dispatch({
        type: TraceDetailActionType.LOAD_FAILED,
        data: loaderData.error,
      });
    } else if (
      loaderData.traces != null &&
      loaderData.eventId === eventId
    ) {
      dispatch({
        type: TraceDetailActionType.LOAD_SUCCESS,
        data: loaderData.traces,
      });
    }
  }, [eventId, loaderData, dispatch]);
}

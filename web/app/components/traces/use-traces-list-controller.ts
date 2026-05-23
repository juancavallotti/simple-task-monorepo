import { useEffect, useState } from "react";
import { useFetcher, useNavigation, useRevalidator } from "react-router";

import type { TracesActionResult } from "~/lib/traces-action-result";
import type { Event } from "~/lib/traces-api";
import type { TracesListAction } from "~/state/traces-list/types";
import { TracesListActionType } from "~/state/traces-list/types";

export function useTracesListController({
  loaderData,
  dispatch,
}: {
  loaderData: {
    events: Event[] | null;
    listError: string | null;
  };
  dispatch: (action: TracesListAction) => void;
}) {
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const clearFetcher = useFetcher<TracesActionResult>();
  const deleteFetcher = useFetcher<TracesActionResult>();
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [confirmingEventId, setConfirmingEventId] = useState<string | null>(
    null,
  );

  const isLoadingList =
    navigation.state === "loading" &&
    navigation.location?.pathname === "/traces" &&
    navigation.formMethod == null;

  useEffect(() => {
    if (loaderData.listError != null) {
      dispatch({
        type: TracesListActionType.FETCH_FAILED,
        data: loaderData.listError,
      });
    } else if (loaderData.events != null) {
      dispatch({
        type: TracesListActionType.FETCH_SUCCESS,
        data: loaderData.events,
      });
    }
  }, [loaderData, dispatch]);

  useEffect(() => {
    if (clearFetcher.state !== "idle" || clearFetcher.data == null) return;
    const data = clearFetcher.data;
    if (data.intent !== "clear") return;
    if (data.ok) {
      dispatch({ type: TracesListActionType.CLEAR_ALL_SUCCEEDED });
    } else {
      dispatch({
        type: TracesListActionType.CLEAR_ALL_FAILED,
        data: data.error,
      });
    }
  }, [clearFetcher.state, clearFetcher.data, dispatch]);

  useEffect(() => {
    if (deleteFetcher.state !== "idle" || deleteFetcher.data == null) return;
    const data = deleteFetcher.data;
    if (data.intent !== "delete-event") return;
    if (data.ok) {
      dispatch({
        type: TracesListActionType.DELETE_EVENT_SUCCEEDED,
        data: data.eventId,
      });
    } else {
      dispatch({
        type: TracesListActionType.DELETE_EVENT_FAILED,
        data: data.error,
      });
    }
  }, [deleteFetcher.state, deleteFetcher.data, dispatch]);

  function retryList() {
    dispatch({ type: TracesListActionType.FETCH_STARTED });
    void revalidator.revalidate();
  }

  function dismissMutationError() {
    dispatch({ type: TracesListActionType.MUTATION_DISMISS });
  }

  function clearAllStarted() {
    setIsConfirmingClear(false);
    dispatch({ type: TracesListActionType.CLEAR_ALL_STARTED });
  }

  function deleteEventStarted(eventId: string) {
    setConfirmingEventId(null);
    dispatch({
      type: TracesListActionType.DELETE_EVENT_STARTED,
      data: eventId,
    });
  }

  return {
    clearFetcher,
    deleteFetcher,
    isConfirmingClear,
    setIsConfirmingClear,
    confirmingEventId,
    setConfirmingEventId,
    isLoadingList,
    retryList,
    dismissMutationError,
    clearAllStarted,
    deleteEventStarted,
  };
}

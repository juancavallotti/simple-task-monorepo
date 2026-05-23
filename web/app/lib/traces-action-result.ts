export type TracesActionResult =
  | { ok: true; intent: "clear" }
  | { ok: true; intent: "delete-event"; eventId: string }
  | {
      ok: false;
      intent: "clear" | "delete-event";
      eventId?: string;
      error: string;
    };

import { Trash2 } from "lucide-react";
import type { ElementType } from "react";

export function ClearAllEventsControl({
  Form,
  disabled,
  isConfirming,
  onCancel,
  onConfirm,
  onSubmit,
}: {
  Form: ElementType;
  disabled: boolean;
  isConfirming: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onSubmit: () => void;
}) {
  if (isConfirming) {
    return (
      <Form
        method="post"
        className="flex items-center gap-2"
        onSubmit={onSubmit}
      >
        <input type="hidden" name="intent" value="clear" />
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Delete all events?
        </span>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          onClick={onCancel}
          disabled={disabled}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:pointer-events-none disabled:opacity-40 dark:bg-red-700 dark:hover:bg-red-600"
          disabled={disabled}
        >
          Clear all
        </button>
      </Form>
    );
  }

  return (
    <button
      type="button"
      onClick={onConfirm}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-red-50 hover:text-red-700 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-red-950/40 dark:hover:text-red-300"
    >
      <Trash2 className="size-4 stroke-[2]" aria-hidden />
      Clear all
    </button>
  );
}

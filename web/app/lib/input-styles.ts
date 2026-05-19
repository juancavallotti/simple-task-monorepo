export function inputClass(disabled: boolean): string {
  return [
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors",
    "placeholder:text-zinc-400",
    "focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/30",
    "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/25",
    disabled ? "cursor-not-allowed opacity-60" : "",
  ].join(" ");
}

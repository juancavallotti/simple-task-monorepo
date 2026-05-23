import { MessageCircle } from "lucide-react";

export function ChatLauncherButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      className="flex size-14 items-center justify-center rounded-full bg-amber-600 text-white shadow-xl transition hover:scale-105 hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
      onClick={onOpen}
      aria-label="Open recipe copilot"
    >
      <MessageCircle className="size-6" aria-hidden />
    </button>
  );
}

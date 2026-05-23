import type { ReactNode } from "react";

import {
  HighlightedJSON,
  type HighlightedJSONVariant,
} from "~/components/highlighted-json";
import { formatJson } from "~/lib/format-json";

export type JsonBlockVariant = "dialog" | "debug" | "panel" | "panelSection";

export type JsonBlockProps = {
  value?: unknown;
  source?: string;
  empty?: ReactNode;
  variant?: JsonBlockVariant;
};

const preClasses: Record<JsonBlockVariant, string> = {
  dialog:
    "whitespace-pre-wrap break-words rounded-lg bg-zinc-900 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-300",
  debug:
    "flex-1 overflow-auto whitespace-pre-wrap break-words px-4 py-3 font-mono text-xs leading-relaxed text-zinc-300",
  panel:
    "m-0 flex-1 overflow-auto whitespace-pre-wrap break-words bg-zinc-50 p-4 font-mono text-xs leading-relaxed text-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200",
  panelSection:
    "m-0 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-200",
};

function highlightVariant(variant: JsonBlockVariant): HighlightedJSONVariant {
  return variant === "panel" || variant === "panelSection" ? "panel" : "dialog";
}

export function JsonBlock({
  value,
  source,
  empty,
  variant = "dialog",
}: JsonBlockProps) {
  const body = source ?? formatJson(value);

  return (
    <pre className={preClasses[variant]}>
      {body === "" ? (
        empty
      ) : (
        <HighlightedJSON source={body} variant={highlightVariant(variant)} />
      )}
    </pre>
  );
}

import type { ReactNode } from "react";

export type HighlightedJSONVariant = "dialog" | "panel";

export type HighlightedJSONProps = {
  source: string;
  variant?: HighlightedJSONVariant;
};

const tokenRe =
  /("(?:\\.|[^"\\])*")\s*:|"(?:\\.|[^"\\])*"|\btrue\b|\bfalse\b|\bnull\b|-?\d+\.?\d*(?:[eE][+-]?\d+)?/g;

const tokenClasses: Record<
  HighlightedJSONVariant,
  {
    key: string;
    string: string;
    boolean: string;
    null: string;
    number: string;
  }
> = {
  dialog: {
    key: "text-amber-300",
    string: "text-emerald-300",
    boolean: "text-rose-300",
    null: "text-zinc-500",
    number: "text-sky-300",
  },
  panel: {
    key: "text-sky-700 dark:text-sky-300",
    string: "text-emerald-700 dark:text-emerald-300",
    boolean: "text-purple-700 dark:text-purple-300",
    null: "text-zinc-500",
    number: "text-amber-700 dark:text-amber-400",
  },
};

export function HighlightedJSON({
  source,
  variant = "dialog",
}: HighlightedJSONProps) {
  const out: ReactNode[] = [];
  const classes = tokenClasses[variant];
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  tokenRe.lastIndex = 0;

  while ((match = tokenRe.exec(source)) !== null) {
    if (match.index > last) {
      out.push(source.slice(last, match.index));
    }

    const matched = match[0];
    if (match[1] != null) {
      out.push(
        <span key={key++} className={classes.key}>
          {match[1]}
        </span>,
      );
      out.push(matched.slice(match[1].length));
    } else if (matched.startsWith('"')) {
      out.push(
        <span key={key++} className={classes.string}>
          {matched}
        </span>,
      );
    } else if (matched === "true" || matched === "false") {
      out.push(
        <span key={key++} className={classes.boolean}>
          {matched}
        </span>,
      );
    } else if (matched === "null") {
      out.push(
        <span key={key++} className={classes.null}>
          {matched}
        </span>,
      );
    } else {
      out.push(
        <span key={key++} className={classes.number}>
          {matched}
        </span>,
      );
    }

    last = match.index + matched.length;
  }

  if (last < source.length) out.push(source.slice(last));
  return <>{out}</>;
}

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

export type MarkdownViewVariant = "chat" | "preview" | "recipe" | "skill";

export type MarkdownViewProps = {
  children: string;
  className?: string;
  variant?: MarkdownViewVariant;
};

const sharedComponents: Components = {
  a: ({ children, ...props }) => (
    <a
      {...props}
      className="font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-300"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-zinc-100 px-1 py-0.5 text-[0.8125em] text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
      {children}
    </code>
  ),
};

const chatComponents: Components = {
  ...sharedComponents,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
  pre: ({ children }) => (
    <pre className="overflow-auto rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-950">
      {children}
    </pre>
  ),
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
};

const previewComponents: Components = {
  ...sharedComponents,
  a: ({ children }) => <>{children}</>,
  blockquote: ({ children }) => <>{children}</>,
  br: () => " ",
  h1: ({ children }) => <>{children} </>,
  h2: ({ children }) => <>{children} </>,
  h3: ({ children }) => <>{children} </>,
  h4: ({ children }) => <>{children} </>,
  h5: ({ children }) => <>{children} </>,
  h6: ({ children }) => <>{children} </>,
  li: ({ children }) => <>{children} </>,
  ol: ({ children }) => <>{children}</>,
  p: ({ children }) => <>{children} </>,
  pre: ({ children }) => <>{children}</>,
  ul: ({ children }) => <>{children}</>,
};

const recipeComponents: Components = {
  ...sharedComponents,
  h2: ({ children }) => (
    <h2 className="mt-5 text-base font-semibold text-zinc-900 first:mt-0 dark:text-zinc-50">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 text-sm font-semibold text-zinc-900 first:mt-0 dark:text-zinc-50">
      {children}
    </h3>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>
  ),
  p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0">{children}</p>,
  pre: ({ children }) => (
    <pre className="my-3 overflow-auto rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-950">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {children}
    </tbody>
  ),
  td: ({ children }) => (
    <td className="border border-zinc-200 px-3 py-2 align-top dark:border-zinc-800">
      {children}
    </td>
  ),
  th: ({ children }) => (
    <th className="border border-zinc-200 bg-zinc-50 px-3 py-2 font-semibold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      {children}
    </th>
  ),
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>
  ),
};

const skillComponents: Components = {
  ...sharedComponents,
  h1: ({ children }) => (
    <h1 className="mt-6 text-lg font-semibold tracking-tight text-zinc-900 first:mt-0 dark:text-zinc-50">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 text-base font-semibold text-zinc-900 first:mt-0 dark:text-zinc-50">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-zinc-700 first:mt-0 dark:text-zinc-300">
      {children}
    </h3>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>
  ),
  p: ({ children }) => (
    <p className="my-3 leading-relaxed first:mt-0 last:mb-0">{children}</p>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-auto rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-950">
      {children}
    </pre>
  ),
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>
  ),
};

function componentsForVariant(variant: MarkdownViewVariant): Components {
  if (variant === "preview") return previewComponents;
  if (variant === "recipe") return recipeComponents;
  if (variant === "skill") return skillComponents;
  return chatComponents;
}

export function MarkdownView({
  children,
  className,
  variant = "chat",
}: MarkdownViewProps) {
  const markdown = (
    <ReactMarkdown
      remarkPlugins={variant === "chat" ? undefined : [remarkGfm]}
      components={componentsForVariant(variant)}
    >
      {children}
    </ReactMarkdown>
  );

  if (className == null || className === "") return markdown;
  return <div className={className}>{markdown}</div>;
}

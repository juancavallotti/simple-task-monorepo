import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function SkillMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
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
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

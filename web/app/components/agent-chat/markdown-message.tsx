import { MarkdownView } from "~/components/markdown-view";

export function MarkdownMessage({ content }: { content: string }) {
  return <MarkdownView variant="chat">{content}</MarkdownView>;
}

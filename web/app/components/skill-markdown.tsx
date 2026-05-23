import { MarkdownView } from "~/components/markdown-view";

export function SkillMarkdown({ content }: { content: string }) {
  return <MarkdownView variant="skill">{content}</MarkdownView>;
}

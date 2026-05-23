import { MarkdownView } from "~/components/markdown-view";

export type RecipeMarkdownProps = {
  children: string;
  className?: string;
};

export function RecipeMarkdown({ children, className = "" }: RecipeMarkdownProps) {
  return (
    <MarkdownView variant="recipe" className={className}>
      {children}
    </MarkdownView>
  );
}

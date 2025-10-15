// src/lib/renderMarkdown.ts
import MarkdownIt from "markdown-it";
const md = new MarkdownIt({ breaks: true }); // preserves single line breaks

export function renderMarkdown(content: string) {
    return md.render(content || "");
}

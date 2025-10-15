// src/lib/text.ts
export function makeExcerpt(input: string, max = 200): string {
    const text = (input ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length <= max) return text;
    const cut = text.slice(0, max).replace(/\s+?(\S+)?$/, ""); // backtrack to word boundary
    return `${cut}…`;
}

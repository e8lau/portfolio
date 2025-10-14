// src/lib/project-mappers.ts
import type { CollectionEntry } from "astro:content";
import type { ProjectCardProps } from "../types/projects";

export function toCardProps(entry: CollectionEntry<"projects">): ProjectCardProps {
    const fm = entry.data;
    // Adjust if your project URL structure differs:
    const href = `/projects/${entry.slug}/`;
    return {
        href,
        title: fm.title,
        excerpt: fm.description,
        cover: fm.thumb,
        categories: fm.categories ?? [],
        tags: fm.tags,
        started: fm.started,
        ended: fm.ended,
        status: fm.status,
        visibility: fm.visibility,
    };
}

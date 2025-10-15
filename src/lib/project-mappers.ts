// src/lib/project-mappers.ts
import type { CollectionEntry } from "astro:content";
import type { ProjectCardProps } from "../types/projects";

export function toCardProps(entry: CollectionEntry<"projects">): ProjectCardProps {
    const fm = entry.data;

    const href =
        fm.downloads?.[0]?.path ??
        fm.links?.demo ??
        `/projects/${entry.slug}/`;
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

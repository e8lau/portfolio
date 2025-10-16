// src/lib/project-mappers.ts
import type { CollectionEntry } from "astro:content";
import type { ProjectCardProps } from "../types/projects";
import { normalizeToDay } from "../lib/date";

export function toCardProps(entry: CollectionEntry<"projects">): ProjectCardProps {
    const fm = entry.data;

    const started = fm.started ?? null;
    const ended = fm.ended ?? null;

    const startDay = normalizeToDay(started, "start");
    const endDay = normalizeToDay(ended, "end");

    const href =
        fm.downloads?.[0]?.path ??
        fm.links?.demo ??
        `/projects/${entry.slug}/`;
    return {
        href,
        title: fm.title,
        excerpt: fm.description,
        cover: fm.thumb?.src.src,
        categories: fm.categories ?? [],
        tags: fm.tags,
        started: startDay ?? undefined,
        ended: endDay ?? undefined,
        status: fm.status,
        visibility: fm.visibility,
    };
}

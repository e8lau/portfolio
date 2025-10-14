// src/components/projects/ProjectCard.tsx
import * as React from "react";
import type { ProjectCardProps } from "../../types/projects";
import { formatRange } from "../../lib/date";

export default function ProjectCard({
    href,
    title,
    excerpt,
    cover,
    categories,
    tags,
    started,
    ended,
}: ProjectCardProps) {
    const range = formatRange(started, ended);
    const facets = (tags && tags.length ? tags : categories) ?? [];

    return (
        <article className="grid-list-items__item projects-card">
            <div className="projects-card__header">
                <div className="projects-card__cat-links">
                    {range && <span>{range}</span>}
                    {range && facets.length ? <span> · </span> : null}
                    {facets.map((t) => (
                        <a key={t} href={`/portfolio/?filter=${encodeURIComponent(t)}`}>{t}</a>
                    ))}
                </div>

                <h3 className="projects-card__title">
                    <a href={href}>{title}</a>
                </h3>
            </div>

            {excerpt && <p className="projects-card__text">{excerpt}</p>}

            {cover && (
                <a className="projects-card__img" href={href} aria-label={title}>
                    <img src={cover} alt="" loading="lazy" />
                </a>
            )}
        </article>
    );
}

// src/components/projects/ProjectCard.tsx
import * as React from "react";
import type { ProjectCardProps } from "../../types/projects";
import { formatRange, normalizeToDay } from "../../lib/date";

type Mode = "home" | "projects";

type Props = ProjectCardProps & {
    mode?: Mode;
    projectsPath?: string; // e.g., "/portfolio/portfolio"
    onOpenPreview?: (project: ProjectCardProps) => void;
};

const fmtSingle = (iso: string, locale = "en-US") =>
    new Date(iso).toLocaleDateString(locale, { month: "short", year: "numeric" });

export default function ProjectCard(props: Props) {
    const {
        href,
        title,
        excerpt,
        cover,
        started,
        ended,
        mode = "home",
        projectsPath = "/portfolio/portfolio",
        onOpenPreview,
    } = props;

    const range = formatRange(started, ended);
    const sN = normalizeToDay(started ?? null, "start");
    const eN = normalizeToDay(ended ?? null, "end");
    const sameDay = sN && eN && sN === eN;

    const searchUrl = `${projectsPath}?q=${encodeURIComponent(title)}`;
    const cardHref = mode === "projects" && onOpenPreview ? href : searchUrl;

    // handler for preview mode
    const handleCardClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
        if (mode === "projects" && onOpenPreview) {
            e.preventDefault();
            onOpenPreview(props);
        }
    };

    // date links (keep these as real anchors)
    const startHref = sN ? `${projectsPath}?start=${encodeURIComponent(sN)}` : null;
    const endHref = eN ? `${projectsPath}?end=${encodeURIComponent(eN)}` : null;

    return (
        <article className="grid-list-items__item projects-card has-stretched-link">
            <div className="projects-card__header">
                <div className="projects-card__cat-links">
                    {sN && !sameDay && (
                        <>
                            <a href={startHref!}>{fmtSingle(sN)}</a>
                            <span> – </span>
                            {eN ? <a href={endHref!}>{fmtSingle(eN)}</a> : <span>Present</span>}
                        </>
                    )}
                    {sameDay && sN && <a href={startHref!}>{fmtSingle(sN)}</a>}
                    {!sN && eN && (
                        <>
                            <span>Until </span>
                            <a href={endHref!}>{fmtSingle(eN)}</a>
                        </>
                    )}
                </div>

                <h3 className="projects-card__title">{title}</h3>
            </div>

            {excerpt && <p className="projects-card__text" title={excerpt}>{excerpt}</p>}

            {/* The stretched link overlay – makes the whole card clickable */}
            <a
                href={cardHref}
                className="stretched-link"
                aria-label={title}
                onClick={handleCardClick}
            />

            {cover && (
                <div className="projects-card__img" aria-label={title}>
                    <img src={cover} alt="" loading="lazy" decoding="async" />
                </div>
            )}
        </article>
    );
}

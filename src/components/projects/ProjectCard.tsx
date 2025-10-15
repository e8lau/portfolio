// src/components/projects/ProjectCard.tsx
import * as React from "react";
import type { ProjectCardProps } from "../../types/projects";
import { formatRange, normalizeToDay } from "../../lib/date";

type Mode = "home" | "projects";

type Props = ProjectCardProps & {
    /** where this card is rendered */
    mode?: Mode;
    /** Absolute/base-relative path to the Projects page (used in home mode & date links) */
    projectsPath?: string; // e.g., "/portfolio/portfolio"
    /** Projects page only: open preview modal */
    onOpenPreview?: (project: ProjectCardProps) => void;
};

// month-year looks clean for link labels
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

    // (still exported for anywhere else you use it)
    const range = formatRange(started, ended);

    const sN = normalizeToDay(started ?? null, "start");
    const eN = normalizeToDay(ended ?? null, "end");
    const sameDay = sN && eN && sN === eN;

    // build Projects link with search prefilled by title (home mode)
    const searchUrl = `${projectsPath}?q=${encodeURIComponent(title)}`;

    // pick the title behavior by mode
    const TitleLink =
        mode === "projects" && onOpenPreview ? (
            <a
                href={href}
                onClick={(e) => {
                    e.preventDefault();
                    onOpenPreview(props);
                }}
                role="button"
            >
                {title}
            </a>
        ) : (
            <a href={searchUrl}>{title}</a>
        );

    // date→date links using your ?start / ?end scheme
    const startHref = sN ? `${projectsPath}?start=${encodeURIComponent(sN)}` : null;
    const endHref = eN ? `${projectsPath}?end=${encodeURIComponent(eN)}` : null;

    return (
        <article className="grid-list-items__item projects-card">
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

                <h3 className="projects-card__title">
                    {React.cloneElement(TitleLink as React.ReactElement, { title })}
                </h3>
            </div>

            {excerpt && (
                <p className="projects-card__text" title={excerpt}>
                    {excerpt}
                </p>
            )}

            {cover && (
                <a className="projects-card__img" href={href} aria-label={title}>
                    <img src={cover} alt="" loading="lazy" decoding="async" />
                </a>
            )}
        </article>
    );
}

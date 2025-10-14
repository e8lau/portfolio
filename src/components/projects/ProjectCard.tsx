// src/components/projects/ProjectCard.tsx
import * as React from "react";
import type { ProjectCardProps } from "../../types/projects";
import { formatRange, normalizeToDay } from "../../lib/date";

// add a tiny local formatter for single-date label (month-year looks clean)
const fmtSingle = (iso: string, locale = "en-US") =>
    new Date(iso).toLocaleDateString(locale, { month: "short", year: "numeric" });

export default function ProjectCard({
    href,
    title,
    excerpt,
    cover,
    // categories,
    // tags,
    started,
    ended,
}: ProjectCardProps) {
    // We keep formatRange in case you still use it somewhere else,
    // but we’ll render two individual linked dates here.
    const range = formatRange(started, ended);

    const sN = normalizeToDay(started ?? null, "start");
    const eN = normalizeToDay(ended ?? null, "end");

    // build links to the Projects page with date prefilled as a single-day filter
    // NOTE: adjust "/portfolio/projects" if your route differs
    const base = "/portfolio/portfolio";
    const startHref = sN ? `${base}?start=${encodeURIComponent(sN)}` : null;
    const endHref = eN ? `${base}?end=${encodeURIComponent(eN)}` : null;

    // same-day → show just one link
    const sameDay = sN && eN && sN === eN;

    return (
        <article className="grid-list-items__item projects-card">
            <div className="projects-card__header">
                <div className="projects-card__cat-links">
                    {/* Date → Date, each date is its own link. No categories/tags here. */}
                    {sN && !sameDay && (
                        <>
                            <a href={startHref!}>{fmtSingle(sN)}</a>
                            <span> – </span>
                            {eN ? (
                                <a href={endHref!}>{fmtSingle(eN)}</a>
                            ) : (
                                <span>Present</span>
                            )}
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

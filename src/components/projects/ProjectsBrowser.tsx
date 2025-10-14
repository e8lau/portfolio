// src/components/projects/ProjectsBrowser.tsx
import * as React from "react";
import ProjectCard from "./ProjectCard.tsx";
import type { ProjectCardProps } from "../../types/projects";

type Props = { items: ProjectCardProps[] };

export default function ProjectsBrowser({ items }: Props) {
    const [query, setQuery] = React.useState("");
    const [facet, setFacet] = React.useState<string | null>(null);
    const [status, setStatus] = React.useState<string>(""); // optional status filter

    React.useEffect(() => {
        const url = new URL(window.location.href);
        const initial = url.searchParams.get("filter");
        if (initial) setFacet(initial);
    }, []);

    const filtered = items.filter((p) => {
        const q = query.trim().toLowerCase();
        const hay =
            p.title.toLowerCase() +
            " " +
            (p.excerpt ?? "").toLowerCase() +
            " " +
            (p.categories ?? []).join(" ").toLowerCase() +
            " " +
            p.categories.join(" ").toLowerCase();

        const qOk = q ? hay.includes(q) : true;

        const pool = (p.categories && p.categories.length ? p.categories : p.categories) ?? [];
        const fOk = facet ? pool.includes(facet) : true;

        const sOk = status ? p.status === status : true;

        return qOk && fOk && sOk;
    });

    const allFacets = Array.from(
        new Set(items.flatMap((p) => (p.categories && p.categories.length ? p.categories : p.categories)))
    );

    return (
        <div className="column xl-12 grid-block">
            <div className="grid-full u-add-bottom projects-browser__controls">
                <div className="row">
                    <input
                        type="search"
                        placeholder="Search projects…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="column xl-6 lg-5 md-12 projects-browser__search"
                        aria-label="Search projects"
                    />
                    <select
                        value={facet ?? ""}
                        onChange={(e) => setFacet(e.target.value || null)}
                        className="column xl-3 lg-5 md-12 projects-browser__select"
                        aria-label="Filter by tag or category"
                    >
                        <option value="">All Categories</option>
                        {allFacets.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="column xl-3 lg-5 md-12 projects-browser__select"
                        aria-label="Filter by status"
                    >
                        <option value="">All statuses</option>
                        <option value="in_progress">In progress</option>
                        <option value="shipped">Shipped</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            <div className="grid-full grid-list-items">
                {filtered.map((p) => (
                    <ProjectCard key={p.href} {...p} />
                ))}
            </div>
        </div>
    );
}
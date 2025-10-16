import * as React from "react";
import ProjectCard from "./ProjectCard.tsx";
import DateFilterPopup from "./DateFilterPopup";
import ProjectPreviewModal from "./ProjectPreviewModal";
import type { ProjectCardProps } from "../../types/projects";
import { normalizeToDay, rangesOverlap } from "../../lib/date";

type Props = { items: ProjectCardProps[] };

export default function ProjectsBrowser({ items }: Props) {
    // --- State
    const [query, setQuery] = React.useState("");
    const [pendingQuery, setPendingQuery] = React.useState("");
    const [facet, setFacet] = React.useState<string | null>(null);
    const [dateRange, setDateRange] = React.useState<{ start: string | null; end: string | null }>({
        start: null,
        end: null,
    });
    const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
    const popupRef = React.useRef<HTMLDivElement | null>(null);
    const [preview, setPreview] = React.useState<ProjectCardProps | null>(null);

    // --- Close date popup on outside click / Esc
    React.useEffect(() => {
        if (!menuOpen) return;
        function onDocClick(e: MouseEvent) {
            if (!popupRef.current) return;
            if (popupRef.current.contains(e.target as Node)) return;
            setMenuOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setMenuOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [menuOpen]);

    // --- Init from URL (?q, ?filter, ?start, ?end)
    React.useEffect(() => {
        try {
            const url = new URL(window.location.href);
            const q = url.searchParams.get("q");
            const f = url.searchParams.get("filter");
            const s = url.searchParams.get("start");
            const e = url.searchParams.get("end");

            if (q) {
                setQuery(q);
                setPendingQuery(q);
            }
            if (f) setFacet(f);

            const startNorm = s ? normalizeToDay(s, "start") : null;
            const endNorm = e ? normalizeToDay(e, "end") : null;
            setDateRange({ start: startNorm ?? null, end: endNorm ?? null });
        } catch {
            /* ignore SSR */
        }
    }, []);

    // --- Sync to URL
    React.useEffect(() => {
        try {
            const url = new URL(window.location.href);
            const sp = url.searchParams;

            query ? sp.set("q", query) : sp.delete("q");
            facet ? sp.set("filter", facet) : sp.delete("filter");

            sp.delete("start");
            sp.delete("end");
            if (dateRange.start) sp.set("start", dateRange.start);
            if (dateRange.end) sp.set("end", dateRange.end);

            const out = url.pathname + (sp.toString() ? `?${sp.toString()}` : "");
            window.history.replaceState({}, document.title, out);
        } catch {
            /* ignore SSR */
        }
    }, [query, facet, dateRange]);

    // --- Debounce search typing
    React.useEffect(() => {
        const t = setTimeout(() => setQuery(pendingQuery), 250);
        return () => clearTimeout(t);
    }, [pendingQuery]);

    // --- Facets (categories + tags)
    const allFacets = React.useMemo(() => {
        return Array.from(
            new Set(
                items.flatMap((p) => [
                    ...(p.categories ?? []),
                    ...((p as any).tags ?? []),
                ])
            )
        );
    }, [items]);

    // --- Filtered list
    const filtered = React.useMemo(() => {
        const fStart = normalizeToDay(dateRange.start, "start");
        const fEnd = normalizeToDay(dateRange.end, "end");
        const hasDateFilter = !!(fStart || fEnd);

        const q = query.trim().toLowerCase();

        return items
            .filter((p) => {
                // search
                const haystack = [
                    p.title ?? "",
                    p.excerpt ?? "",
                    ...(p.categories ?? []),
                    ...((p as any).tags ?? []),
                ]
                    .join(" ")
                    .toLowerCase();

                const qOk = q ? haystack.includes(q) : true;

                // facet
                const pool = [
                    ...(p.categories ?? []),
                    ...((p as any).tags ?? []),
                ];
                const fOk = facet ? pool.includes(facet) : true;

                // date ANY-overlap
                const pStart = normalizeToDay((p as any).started ?? null, "start");
                const pEnd = normalizeToDay((p as any).ended ?? (p as any).started ?? null, "end");

                const dOk = hasDateFilter
                    ? pStart
                        ? rangesOverlap(pStart, pEnd, fStart, fEnd)
                        : false
                    : true;

                return qOk && fOk && dOk;
            })
            .sort((a, b) => {
                const aSort = normalizeToDay((a as any).ended ?? (a as any).started ?? null, "end") ?? "0000-01-01";
                const bSort = normalizeToDay((b as any).ended ?? (b as any).started ?? null, "end") ?? "0000-01-01";
                return bSort.localeCompare(aSort);
            });
    }, [items, query, facet, dateRange.start, dateRange.end]);

    const isFiltering =
        query.trim() !== "" ||
        facet !== null ||
        dateRange.start !== null ||
        dateRange.end !== null;

    // --- Render
    return (
        <div className="column xl-12 grid-block">
            {/* Toolbar */}
            <div className="grid-full">
                <div className="row">
                    <div className="column xl-6 lg-5 md-12 filter-bar">
                        <input
                            type="search"
                            placeholder="Search projects…"
                            value={pendingQuery}
                            onChange={(e) => setPendingQuery(e.target.value)}
                            className="u-fullwidth projects-browser__search"
                            aria-label="Search projects"
                        />
                    </div>

                    <div className="column xl-2 lg-2 md-6 filter-bar">
                        <select
                            value={facet ?? ""}
                            onChange={(e) => setFacet(e.target.value || null)}
                            className="u-fullwidth projects-browser__select"
                            aria-label="Filter by tag or category"
                        >
                            <option value="">All Categories</option>
                            {allFacets.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="column xl-2 lg-3 md-6 filter-bar">
                        <div className="projects-browser__date-popup-wrapper" ref={popupRef}>
                            <button
                                type="button"
                                className="u-fullwidth projects-browser__date-button"
                                onClick={() => setMenuOpen((s) => !s)}
                                aria-haspopup="dialog"
                                aria-expanded={menuOpen}
                                title="Filter by date"
                                style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {dateRange.start || dateRange.end
                                    ? `Range ${dateRange.start ?? "…"} → ${dateRange.end ?? "…"}`
                                    : "Filter by date"}
                            </button>

                            {menuOpen && (
                                <div className="projects-browser__date-popup" role="dialog">
                                    <DateFilterPopup
                                        initial={dateRange}
                                        onApply={({ start, end }) => setDateRange({ start, end })}
                                        onClose={() => setMenuOpen(false)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="column xl-2 lg-2 md-12 filter-bar">
                        <button
                            type="button"
                            className={`u-fullwidth projects-browser__clear-btn${isFiltering ? " projects-browser__clear-btn--active" : ""}`}
                            onClick={() => {
                                setQuery("");
                                setPendingQuery("");
                                setFacet(null);
                                setDateRange({ start: null, end: null });
                                setMenuOpen(false);
                                try {
                                    const url = new URL(window.location.href);
                                    url.searchParams.delete("q");
                                    url.searchParams.delete("filter");
                                    url.searchParams.delete("start");
                                    url.searchParams.delete("end");
                                    window.history.replaceState({}, document.title, url.pathname);
                                } catch {
                                    /* ignore */
                                }
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Cards */}
            <div className="grid-full grid-list-items">
                {filtered.map((p) => (
                    <ProjectCard
                        key={p.href}
                        {...p}
                        mode="projects"
                        projectsPath="/portfolio/portfolio"
                        onOpenPreview={(proj) => setPreview(proj)}
                    />
                ))}
            </div>

            {/* Preview modal */}
            {preview && (
                <ProjectPreviewModal
                    project={preview}
                    onClose={() => setPreview(null)}
                />
            )}
        </div>
    );
}

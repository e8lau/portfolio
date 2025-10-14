// src/components/projects/ProjectsBrowser.tsx
import * as React from "react";
import ProjectCard from "./ProjectCard.tsx";
import DateFilterPopup from "./DateFilterPopup";
import type { ProjectCardProps } from "../../types/projects";

// ✅ new: day-precision helpers
import {
    normalizeToDay,
    rangesOverlap,
    isISODate,
} from "../../lib/date"; // adjust the path if your date.ts lives elsewhere

type Props = { items: ProjectCardProps[] };

export default function ProjectsBrowser({ items }: Props) {
    // ----- state
    const [query, setQuery] = React.useState("");
    const [pendingQuery, setPendingQuery] = React.useState("");
    const [facet, setFacet] = React.useState<string | null>(null);

    // ✅ day-precision YYYY-MM-DD (or null)
    const [dateRange, setDateRange] = React.useState<{ start: string | null; end: string | null }>({
        start: null,
        end: null,
    });

    const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
    const popupRef = React.useRef<HTMLDivElement | null>(null);

    // ----- close popup on outside click / Escape
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

    // ----- init from URL (?q, ?filter, ?on, ?start, ?end)
    React.useEffect(() => {
        try {
            const url = new URL(window.location.href);
            const q = url.searchParams.get("q");
            const f = url.searchParams.get("filter");
            const on = url.searchParams.get("on"); // single-day
            const s = url.searchParams.get("start");
            const e = url.searchParams.get("end");

            if (q) {
                setQuery(q);
                setPendingQuery(q);
            }
            if (f) setFacet(f);

            if (on && (isISODate(on) || normalizeToDay(on, "start"))) {
                const d = normalizeToDay(on, "start"); // same for start/end
                setDateRange({ start: d, end: d });
            } else if (s || e) {
                const startNorm = s ? normalizeToDay(s, "start") : null;
                const endNorm = e ? normalizeToDay(e, "end") : null;
                setDateRange({ start: startNorm, end: endNorm });
            }
        } catch {
            // non-browser or malformed URL; ignore
        }
    }, []);

    // ----- sync to URL (shareable)
    React.useEffect(() => {
        try {
            const url = new URL(window.location.href);
            const sp = url.searchParams;

            // q
            query ? sp.set("q", query) : sp.delete("q");

            // facet
            facet ? sp.set("filter", facet) : sp.delete("filter");

            // date: prefer ?on= when start===end
            sp.delete("on");
            sp.delete("start");
            sp.delete("end");
            if (dateRange.start && dateRange.end && dateRange.start === dateRange.end) {
                sp.set("on", dateRange.start);
            } else {
                if (dateRange.start) sp.set("start", dateRange.start);
                if (dateRange.end) sp.set("end", dateRange.end);
            }

            const out = url.pathname + (sp.toString() ? `?${sp.toString()}` : "");
            window.history.replaceState({}, document.title, out);
        } catch {
            // ignore in SSR / restricted envs
        }
    }, [query, facet, dateRange]);

    // ----- debounce search input
    React.useEffect(() => {
        const t = setTimeout(() => setQuery(pendingQuery), 250);
        return () => clearTimeout(t);
    }, [pendingQuery]);

    // ----- computed: facets (categories + tags, unique)
    const allFacets = React.useMemo(() => {
        return Array.from(
            new Set(
                items.flatMap((p) => [
                    ...(p.categories ?? []),
                    // ...((p as any).tags ?? []),
                ])
            )
        );
    }, [items]);

    // ----- computed: filtered list
    const filtered = React.useMemo(() => {
        // normalize filter once
        const fStart = normalizeToDay(dateRange.start, "start");
        const fEnd = normalizeToDay(dateRange.end, "end");
        const hasDateFilter = !!(fStart || fEnd);

        const q = query.trim().toLowerCase();

        return items
            .filter((p) => {
                // search haystack
                const haystack = [
                    p.title ?? "",
                    p.excerpt ?? "",
                    ...(p.categories ?? []),
                    ...((p as any).tags ?? []),
                ]
                    .join(" ")
                    .toLowerCase();

                const qOk = q ? haystack.includes(q) : true;

                // facet check
                const pool = [
                    ...(p.categories ?? []),
                    ...((p as any).tags ?? []),
                ];
                const fOk = facet ? pool.includes(facet) : true;

                // date overlap (day-precision); if no project dates and filter is active -> exclude
                const pStart = normalizeToDay((p as any).started ?? null, "start");
                const pEnd = normalizeToDay((p as any).ended ?? null, "end");

                const dOk = hasDateFilter
                    ? (pStart ? rangesOverlap(pStart, pEnd, fStart, fEnd) : false)
                    : true;

                return qOk && fOk && dOk;
            })
            // sort: most recent end/start first
            .sort((a, b) => {
                const aSort = normalizeToDay((a as any).ended ?? (a as any).started ?? null, "end") ?? "0000-01-01";
                const bSort = normalizeToDay((b as any).ended ?? (b as any).started ?? null, "end") ?? "0000-01-01";
                return bSort.localeCompare(aSort);
            });
    }, [items, query, facet, dateRange.start, dateRange.end]);

    // ----- render
    return (
        <div className="column xl-12 grid-block">
            <div className="grid-full filter-bar">
                <div className="row">
                    <div className="column xl-5 lg-5 md-12">
                        <input
                            type="search"
                            placeholder="Search projects…"
                            value={pendingQuery}
                            onChange={(e) => setPendingQuery(e.target.value)}
                            className="u-fullwidth projects-browser__search"
                            aria-label="Search projects"
                        />
                    </div>

                    <div className="column xl-2 lg-5 md-12">
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

                    <div className="column xl-3 lg-5 md-12">
                        <div className="projects-browser__date-popup-wrapper" ref={popupRef}>
                            <button
                                type="button"
                                className="u-fullwidth projects-browser__date-button"
                                onClick={() => setMenuOpen((s) => !s)}
                                aria-haspopup="dialog"
                                aria-expanded={menuOpen}
                                title="Filter by date"
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

                    <div className="column xl-2 lg-5 md-12">
                        <button
                            type="button"
                            className="u-fullwidth projects-browser__clear-btn"
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
                                    url.searchParams.delete("on");
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

            <div className="grid-full grid-list-items">
                {filtered.map((p) => (
                    <ProjectCard key={p.href} {...p} />
                ))}
            </div>
        </div>
    );
}

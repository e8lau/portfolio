// src/components/projects/ProjectsBrowser.tsx
import * as React from "react";
import ProjectCard from "./ProjectCard.tsx";
import DateFilterPopup from "./DateFilterPopup";
import type { ProjectCardProps } from "../../types/projects";

type Props = { items: ProjectCardProps[] };

export default function ProjectsBrowser({ items }: Props) {
    const [query, setQuery] = React.useState("");
    // pendingQuery is the live input value; query is the debounced value used for filtering and URL
    const [pendingQuery, setPendingQuery] = React.useState("");
    const [facet, setFacet] = React.useState<string | null>(null);
    // date range filter in YYYY-MM format (matches frontmatter 'started' / 'ended')
    const [dateRange, setDateRange] = React.useState<{ start: string | null; end: string | null }>(
        { start: null, end: null }
    );
    const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
    const popupRef = React.useRef<HTMLDivElement | null>(null);

    // close popup on outside click or Escape
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

    // Initialize filters from URL params for shareable links
    React.useEffect(() => {
        try {
            const url = new URL(window.location.href);
            const q = url.searchParams.get("q");
            const f = url.searchParams.get("filter");
            const s = url.searchParams.get("start");
            const e = url.searchParams.get("end");
            if (q) setQuery(q);
            if (f) setFacet(f);
            if (s || e) setDateRange({ start: s, end: e });
        } catch (err) {
            // ignore (non-browser or malformed URL)
        }
    }, []);

    // Sync filter state to URL so the link can be shared. We'll update on changes.
    React.useEffect(() => {
        try {
            const url = new URL(window.location.href);
            const sp = url.searchParams;
            if (query) sp.set("q", query); else sp.delete("q");
            if (facet) sp.set("filter", facet); else sp.delete("filter");
            if (dateRange.start) sp.set("start", dateRange.start); else sp.delete("start");
            if (dateRange.end) sp.set("end", dateRange.end); else sp.delete("end");
            const out = url.pathname + "?" + sp.toString();
            window.history.replaceState({}, document.title, out);
        } catch (err) {
            // ignore in non-browser contexts
        }
    }, [query, facet, dateRange]);

    // menu open/close handled by DateFilterPopup; keep state here for toggling

    // debounce search input
    React.useEffect(() => {
        const t = setTimeout(() => setQuery(pendingQuery), 250);
        return () => clearTimeout(t);
    }, [pendingQuery]);

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

        // date range filtering: include projects whose [started, ended] overlaps
        // the selected dateRange. If no range set, include all. Projects without
        // a `started` are excluded when a range is active.
        const dOk = (() => {
            const rs = dateRange.start;
            const re = dateRange.end;
            if (!rs && !re) return true;

            const ps = p.started ?? null;
            const pe = p.ended ?? null;

            if (!ps) return false; // unknown start -> exclude when filtering

            // Both start and end provided: overlap if ps <= re && (pe ? pe >= rs : true)
            if (rs && re) {
                if (!pe) return ps <= re; // ongoing project
                return ps <= re && pe >= rs;
            }

            // Only start provided: treat end as +inf, include if pe >= rs or ongoing
            if (rs && !re) {
                if (!pe) return true; // ongoing
                return pe >= rs;
            }

            // Only end provided: include if ps <= re
            if (!rs && re) {
                return ps <= re;
            }

            return true;
        })();

        return qOk && fOk && dOk;
    });

    const allFacets = Array.from(
        new Set(items.flatMap((p) => (p.categories && p.categories.length ? p.categories : p.categories)))
    );

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
                                <option key={t} value={t}>{t}</option>
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
                            >
                                {dateRange.start || dateRange.end ? `Range ${dateRange.start ?? "*"} → ${dateRange.end ?? "*"}` : "Filter by date"}
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
                                setFacet(null);
                                setDateRange({ start: null, end: null });
                                setMenuOpen(false);
                                // optionally, reset url filter param
                                try {
                                    const url = new URL(window.location.href);
                                    url.searchParams.delete("filter");
                                    window.history.replaceState({}, document.title, url.toString());
                                } catch (e) {
                                    /* ignore (server side or restricted) */
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
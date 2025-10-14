import React, { useEffect, useMemo, useRef, useState } from "react";

/* ---------------------- TYPE DEFINITIONS ---------------------- */
type Entry = {
    slug: string;
    title: string;
    description?: string;
    categories?: string[];
    tags?: string[];
    links?: { demo?: string; repo?: string; external?: string };
    order?: number | null;
    started?: string | null;
    ended?: string | null;
};

type Props = {
    entries: Entry[];
    categoryHrefBase?: string;
    maxChars?: number;
    maxTitleLen?: number;
};

/* ---------------------- HELPERS ---------------------- */
function hrefFor(e: Entry) {
    if (e.links?.demo) return e.links.demo;
    if (e.links?.repo) return e.links.repo;
    if (e.links?.external) return e.links.external;
    return `/projects/${e.slug}`;
}

function truncatePlain(text: string, max: number) {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.slice(0, max).replace(/\s+$/, "") + "...";
}

function parseDay(d?: string | null) {
    if (!d) return null;
    const dt = new Date(d);
    if (Number.isNaN(+dt)) return null;
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function overlaps(pStart: Date, pEnd: Date, wStart?: Date | null, wEnd?: Date | null) {
    const ws = wStart ?? new Date(-8640000000000000);
    const we = wEnd ?? new Date(8640000000000000);
    return pStart <= we && pEnd >= ws;
}

function fromYMD(s?: string) {
    if (!s) return null;
    const dt = new Date(s);
    if (Number.isNaN(+dt)) return null;
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function toYMDstr(src?: string | null) {
    if (!src) return "";
    const d = new Date(src);
    if (Number.isNaN(+d)) return "";
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function fmtNice(src?: string | null) {
    if (!src) return "Present";
    const d = new Date(src);
    if (Number.isNaN(+d)) return src; // fallback to raw string if custom
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Build an href that preserves current q/cat/from/to and updates the provided keys */
function buildFilterHref(update: Record<string, string | undefined>) {
    const sp = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
    );
    for (const [k, v] of Object.entries(update)) {
        if (!v) sp.delete(k);
        else sp.set(k, v);
    }
    const qs = sp.toString();
    const base = (typeof window !== "undefined" && window.location.pathname) || "/projects";
    return qs ? `${base}?${qs}` : base;
}

/* ---------------------- DATE RANGE MENU ---------------------- */
function DateRangeMenu({
    open,
    onClose,
    onApply,
    initialFrom,
    initialTo,
    anchorRef,
}: {
    open: boolean;
    onClose: () => void;
    onApply: (from: string, to: string) => void;
    initialFrom: string;
    initialTo: string;
    anchorRef: React.RefObject<HTMLElement>;
}) {
    const menuRef = React.useRef<HTMLDivElement | null>(null);
    const [draftFrom, setDraftFrom] = React.useState(initialFrom);
    const [draftTo, setDraftTo] = React.useState(initialTo);
    const [style, setStyle] = React.useState<React.CSSProperties>({});

    function getGutterPx() {
        const cs = getComputedStyle(document.documentElement);
        const v = (cs.getPropertyValue("--gutter") || "").trim() || "16px";
        const root = parseFloat(cs.fontSize) || 16;
        if (v.endsWith("rem")) return parseFloat(v) * root;
        if (v.endsWith("px")) return parseFloat(v);
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : 16;
    }

    function computePosition() {
        if (!open || !menuRef.current || !anchorRef.current) return;

        const gutter = getGutterPx();
        const maxWidthPx = 680;
        const vw = window.innerWidth;
        const widthPx = Math.min(maxWidthPx, vw - 2 * gutter);
        const leftPx = Math.max(gutter, Math.round((vw - widthPx) / 2));
        const btnRect = anchorRef.current.getBoundingClientRect();

        // Default: below button
        let next: React.CSSProperties = {
            position: "fixed",
            left: leftPx,
            width: widthPx,
            top: Math.round(btnRect.bottom + 6),
            zIndex: 50,
        };

        // Measure & flip if needed
        Object.assign(menuRef.current.style, next as any, { visibility: "hidden" });
        const rect = menuRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const enoughAbove = btnRect.top > rect.height + 12;
        if (spaceBelow < 24 && enoughAbove) {
            next.top = Math.round(btnRect.top - rect.height - 6);
        }

        setStyle(next);
        menuRef.current.style.visibility = "";
    }

    React.useEffect(() => {
        if (open) {
            setDraftFrom(initialFrom);
            setDraftTo(initialTo);
            requestAnimationFrame(computePosition);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialFrom, initialTo]);

    React.useEffect(() => {
        if (!open) return;
        const h = () => computePosition();
        window.addEventListener("resize", h);
        window.addEventListener("scroll", h, { passive: true });
        return () => {
            window.removeEventListener("resize", h);
            window.removeEventListener("scroll", h);
        };
    }, [open]);

    // Outside click / Esc
    React.useEffect(() => {
        if (!open) return;
        function onDocClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            ref={menuRef}
            role="dialog"
            aria-label="Filter by date range"
            className="date-menu"
            style={{
                ...style, // 👈 dynamic positioning handled in JS
                background: "var(--color-bg, #fff)",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: "8px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                zIndex: 50,
            }}
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onApply(draftFrom, draftTo);
                    onClose();
                }}
            >
                {/* Date inputs in a vertical column */}
                <label>
                    From
                    <input
                        type="date"
                        className="u-fullwidth"
                        value={draftFrom}
                        onChange={(e) => setDraftFrom(e.target.value)}
                    />
                </label>

                <label>
                    To
                    <input
                        type="date"
                        className="u-fullwidth"
                        value={draftTo}
                        min={draftFrom || undefined}
                        onChange={(e) => setDraftTo(e.target.value)}
                    />
                </label>

                {/* Apply button spans full width */}
                <button className="btn u-fullwidth" type="submit">
                    Apply
                </button>

                {/* Clear + Close buttons side-by-side */}
                <div className="btn-row">
                    <button
                        type="button"
                        className="btn btn--stroke"
                        onClick={() => {
                            setDraftFrom("");
                            setDraftTo("");
                            onApply("", "");
                            onClose();
                        }}
                    >
                        Clear
                    </button>

                    <button
                        type="button"
                        className="btn btn--stroke"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ---------------------- MAIN COMPONENT ---------------------- */
export default function ProjectsBrowser({
    entries,
    categoryHrefBase = "/projects",
    maxChars = 200,
    maxTitleLen = 100,
}: Props) {
    const params =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();

    const initQ = params.get("q") ?? "";
    const initCat = params.get("cat") ?? "All";
    const initFrom = params.get("from") ?? "";
    const initTo = params.get("to") ?? "";

    const [q, setQ] = useState(initQ);
    const [cat, setCat] = useState(initCat);
    const [fromStr, setFromStr] = useState(initFrom);
    const [toStr, setToStr] = useState(initTo);
    const [dateMenuOpen, setDateMenuOpen] = useState(false);
    const dateBtnRef = useRef<HTMLButtonElement>(null);

    const from = useMemo(() => fromYMD(fromStr), [fromStr]);
    const to = useMemo(() => fromYMD(toStr), [toStr]);

    const categories = useMemo(() => {
        const set = new Set<string>();
        entries.forEach((e) => (e.categories || []).forEach((c) => set.add(c)));
        return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
    }, [entries]);

    // Sync URL
    useEffect(() => {
        if (typeof window === "undefined") return;
        const sp = new URLSearchParams();
        if (q.trim()) sp.set("q", q.trim());
        if (cat && cat !== "All") sp.set("cat", cat);
        if (fromStr) sp.set("from", fromStr);
        if (toStr) sp.set("to", toStr);
        const qs = sp.toString();
        const url = qs ? `?${qs}` : window.location.pathname;
        window.history.replaceState({}, "", url);
    }, [q, cat, fromStr, toStr]);

    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase();

        let list = entries.filter((e) => {
            const inCat =
                cat === "All" ||
                (e.categories || []).some((c) => c.toLowerCase() === cat.toLowerCase());
            const inText =
                !ql ||
                e.title.toLowerCase().includes(ql) ||
                (e.description || "").toLowerCase().includes(ql) ||
                (e.tags || []).some((t) => t.toLowerCase().includes(ql));
            return inCat && inText;
        });

        if (from || to) {
            list = list.filter((e) => {
                const pStart = parseDay(e.started) ?? parseDay(e.ended);
                const pEnd = parseDay(e.ended) ?? parseDay(e.started);
                if (!pStart && !pEnd) return false;
                const start = pStart ?? new Date(-8640000000000000);
                const end = pEnd ?? new Date(8640000000000000);
                return overlaps(start, end, from, to);
            });
        }

        return list
            .slice()
            .sort((a, b) => {
                const aEnd = parseDay(a.ended) ?? parseDay(a.started) ?? new Date(-8640000000000000);
                const bEnd = parseDay(b.ended) ?? parseDay(b.started) ?? new Date(-8640000000000000);
                return +bEnd - +aEnd;
            });
    }, [entries, q, cat, from, to]);

    /* ---------------------- RENDER ---------------------- */
    return (
        <>
            <div className="grid-full u-add-bottom filters-bar">
                <div className="row">
                    {/* Search */}
                    <div className="column xl-6 lg-5 md-12">
                        <input
                            type="search"
                            placeholder="Search projects…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="u-fullwidth"
                            aria-label="Search projects"
                        />
                    </div>

                    {/* Category */}
                    <div className="column xl-2 lg-2 md-6">
                        <div className="ss-custom-select u-fullwidth">
                            <select
                                className="sel u-fullwidth"
                                value={cat}
                                onChange={(e) => setCat(e.target.value)}
                                aria-label="Filter by category"
                            >
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date Range Button */}
                    <div className="column xl-2 lg-3 md-6" style={{ position: "relative" }}>
                        <button
                            ref={dateBtnRef}
                            className="btn u-fullwidth"
                            onClick={() => setDateMenuOpen((v) => !v)}
                            aria-haspopup="dialog"
                            aria-expanded={dateMenuOpen}
                        >
                            {fromStr || toStr ? `Date: ${fromStr || "…"} → ${toStr || "…"}` : "Date range"}
                        </button>

                        <DateRangeMenu
                            open={dateMenuOpen}
                            onClose={() => setDateMenuOpen(false)}
                            onApply={(f, t) => {
                                setFromStr(f);
                                setToStr(t);
                            }}
                            initialFrom={fromStr}
                            initialTo={toStr}
                            anchorRef={dateBtnRef}
                        />
                    </div>

                    {/* Reset */}
                    <div className="column xl-2 lg-2 md-12">
                        <button
                            className="btn btn--stroke u-fullwidth"
                            onClick={() => {
                                setQ("");
                                setCat("All");
                                setFromStr("");
                                setToStr("");
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Projects */}
            <div className="grid-full grid-list-items">
                {filtered.map((e) => (
                    <div key={e.slug} className="grid-list-items__item projects-card">
                        <div className="projects-card__header">
                            <div className="projects-card__cat-links">
                                {/* Start date link -> sets only ?from= */}
                                {e.started ? (
                                    <a
                                        href={buildFilterHref({ from: toYMDstr(e.started) })}
                                        title="Filter: From this date"
                                    >
                                        {fmtNice(e.started)}
                                    </a>
                                ) : (
                                    <span>—</span>
                                )}

                                {" "}<span>–</span>{" "}

                                {/* End date: if present, link sets only ?to= ; if missing, show Present (no link) */}
                                {e.ended ? (
                                    <a
                                        href={buildFilterHref({ to: toYMDstr(e.ended) })}
                                        title="Filter: To this date"
                                    >
                                        {fmtNice(e.ended)}
                                    </a>
                                ) : (
                                    <span>Present</span>
                                )}
                            </div>
                            <h3 className="projects-card__title">
                                <a href={hrefFor(e)} rel="noopener noreferrer">
                                    {truncatePlain(e.title, maxTitleLen)}
                                </a>
                            </h3>
                        </div>
                        <div className="projects-card__text">
                            <p>{truncatePlain(e.description ?? "", maxChars)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

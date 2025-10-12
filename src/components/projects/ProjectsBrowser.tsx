import React, { useEffect, useMemo, useState } from "react";

type Entry = {
    slug: string;
    title: string;
    summary?: string;
    categories?: string[];
    tags?: string[];
    links?: { demo?: string; repo?: string; external?: string };
    order?: number | null;
};

type Props = {
    entries: Entry[];         // passed from Astro (getCollection)
    categoryHrefBase?: string; // where category chips point (default: "/projects")
};

function hrefFor(e: Entry) {
    if (e.links?.demo) return e.links.demo;
    if (e.links?.repo) return e.links.repo;
    if (e.links?.external) return e.links.external;
    return `/projects/${e.slug}`;
}

export default function ProjectsBrowser({
    entries,
    categoryHrefBase = "/projects",
}: Props) {
    // initialize from URL
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const initQ = params.get("q") ?? "";
    const initCat = params.get("cat") ?? "All";

    const [q, setQ] = useState(initQ);
    const [cat, setCat] = useState(initCat);

    // unique categories for the select
    const categories = useMemo(() => {
        const set = new Set<string>();
        entries.forEach((e) => (e.categories || []).forEach((c) => set.add(c)));
        return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
    }, [entries]);

    // keep URL in sync (so links can be shared)
    useEffect(() => {
        const sp = new URLSearchParams();
        if (q.trim()) sp.set("q", q.trim());
        if (cat && cat !== "All") sp.set("cat", cat);
        const qs = sp.toString();
        const url = qs ? `?${qs}` : window.location.pathname;
        window.history.replaceState({}, "", url);
    }, [q, cat]);

    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase();
        return entries.filter((e) => {
            const inCat =
                cat === "All" ||
                (e.categories || []).some((c) => c.toLowerCase() === cat.toLowerCase());
            const inText =
                !ql ||
                e.title.toLowerCase().includes(ql) ||
                (e.summary || "").toLowerCase().includes(ql) ||
                (e.tags || []).some((t) => t.toLowerCase().includes(ql));
            return inCat && inText;
        });
    }, [entries, q, cat]);

    return (
        <>
            {/* FILTER BAR (existing utility classes only) */}
            <div className="grid-full u-add-bottom">
                <div className="row">
                    <div className="column xl-8 lg-6 md-12">
                        <input
                            type="search"
                            placeholder="Search projects…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="u-fullwidth"
                            aria-label="Search projects"
                        />
                    </div>
                    <div className="column xl-2 lg-3 md-8">
                        <div className="ss-custom-select u-fullwidth">
                            <select
                                className="u-fullwidth"
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
                    <div className="column xl-2 lg-3 md-4">
                        <button
                            className="btn u-fullwidth"
                            onClick={() => {
                                setQ("");
                                setCat("All");
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* CARDS (exact same markup & classes as template) */}
            <div className="grid-full grid-list-items">
                {filtered.map((e) => (
                    <div key={e.slug} className="grid-list-items__item projects-card">
                        <div className="projects-card__header">
                            <div className="projects-card__cat-links">
                                {(e.categories || []).map((c) => (
                                    <a key={c} href={categoryHrefBase}>
                                        {c}
                                    </a>
                                ))}
                            </div>
                            <h3 className="projects-card__title">
                                <a href={hrefFor(e)} rel="noopener noreferrer">
                                    {e.title}
                                </a>
                            </h3>
                        </div>
                        <div className="projects-card__text">
                            <p>{e.summary || ""}</p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

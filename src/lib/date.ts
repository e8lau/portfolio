// src/lib/date.ts
// Hydration-safe date utilities (month+year display, full-day normalization for filtering).

// -----------------------------------------------------------------------------
// 1) Shape checks (booleans)
// -----------------------------------------------------------------------------
export const isYYYY = (s: string): boolean => /^\d{4}$/.test(s);
export const isYYYYMM = (s: string): boolean => /^\d{4}-\d{2}$/.test(s);
export const isISODate = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s);

// -----------------------------------------------------------------------------
// 2) Normalization: expand YYYY or YYYY-MM -> YYYY-MM-DD for logic/filtering
// -----------------------------------------------------------------------------
export function normalizeToDay(
    s?: string | null,
    mode: "start" | "end" = "start"
): string | undefined {
    if (!s) return undefined;
    const val = s as string;

    if (isISODate(val)) return val;

    if (isYYYYMM(val)) {
        const [y, m] = val.split("-").map(Number);
        const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); // last day of month
        const day = mode === "start" ? "01" : String(last).padStart(2, "0");
        return `${val}-${day}`;
    }

    if (isYYYY(val)) {
        return mode === "start" ? `${val}-01-01` : `${val}-12-31`;
    }

    return undefined;
}

// -----------------------------------------------------------------------------
// 3) Internal: build Date in UTC deterministically
// -----------------------------------------------------------------------------
function toUTCDate(isoLike: string): Date {
    if (isISODate(isoLike)) {
        const [y, m, d] = isoLike.split("-").map(Number);
        return new Date(Date.UTC(y, m - 1, d));
    }
    if (isYYYYMM(isoLike)) {
        const [y, m] = isoLike.split("-").map(Number);
        return new Date(Date.UTC(y, m - 1, 1));
    }
    if (isYYYY(isoLike)) {
        const y = Number(isoLike);
        return new Date(Date.UTC(y, 0, 1));
    }
    return new Date(isoLike); // fallback (shouldn't be hit in normal flow)
}

// -----------------------------------------------------------------------------
// 4) Display helpers (month+year only; UTC-pinned -> hydration-safe)
// -----------------------------------------------------------------------------
export function fmtMonthYearUTC(isoDay: string, locale = "en-US"): string {
    const d = toUTCDate(isoDay);
    return new Intl.DateTimeFormat(locale, {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(d);
}

/** Visual-only range label, e.g., "Mar 2023 – Jun 2024", "Mar 2023 – Present", "Until Jun 2024". */
export function formatRange(
    start?: string | null,
    end?: string | null,
    locale: string = "en-US"
): string {
    const sN = normalizeToDay(start, "start");
    const eN = normalizeToDay(end, "end");
    const fmt = (iso: string) => fmtMonthYearUTC(iso, locale);

    if (sN && !eN) return `${fmt(sN)} – Present`;
    if (!sN && eN) return `Until ${fmt(eN)}`;
    if (!sN && !eN) return "";

    const sDate = toUTCDate(sN!);
    const eDate = toUTCDate(eN!);
    const sameYear = sDate.getUTCFullYear() === eDate.getUTCFullYear();

    if (sameYear) {
        const monthFmt = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
        const sM = monthFmt.format(sDate);
        const eM = monthFmt.format(eDate);
        // If same month, compress to "Mar 2024"; else "Mar – Jun 2024"
        return sM === eM ? `${sM} ${sDate.getUTCFullYear()}` : `${sM} – ${eM} ${sDate.getUTCFullYear()}`;
    }

    // Different years → "Mar 2023 – Feb 2024"
    return `${fmt(sN!)} – ${fmt(eN!)}`;
}

// -----------------------------------------------------------------------------
// 5) Filtering helpers (inclusive) — avoid `&&` unions to keep types as number
// -----------------------------------------------------------------------------
function startMs(s?: string | null): number {
    const n = normalizeToDay(s, "start");
    return n ? toUTCDate(n).getTime() : Number.NEGATIVE_INFINITY;
}
function endMs(s?: string | null): number {
    const n = normalizeToDay(s, "end");
    return n ? toUTCDate(n).getTime() : Number.POSITIVE_INFINITY;
}

export function rangesOverlap(
    aStart?: string | null,
    aEnd?: string | null,
    bStart?: string | null,
    bEnd?: string | null
): boolean {
    const aS = startMs(aStart);
    const aE = endMs(aEnd);
    const bS = startMs(bStart);
    const bE = endMs(bEnd);
    return aS <= bE && bS <= aE;
}

export function isInRange(
    dateLike?: string | null,
    rangeStart?: string | null,
    rangeEnd?: string | null
): boolean {
    if (!dateLike) return false;
    const dN = normalizeToDay(dateLike, "start");
    if (!dN) return false;

    const d = toUTCDate(dN).getTime();
    return startMs(rangeStart) <= d && d <= endMs(rangeEnd);
}

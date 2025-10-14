// src/lib/date.ts

/** True if s is YYYY-MM-DD */
export const isISODate = (s?: string | null): s is string =>
    !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** True if s is YYYY-MM */
export const isYYYYMM = (s?: string | null): s is string =>
    !!s && /^\d{4}-\d{2}$/.test(s);

/** True if s is YYYY */
export const isYYYY = (s?: string | null): s is string =>
    !!s && /^\d{4}$/.test(s);

/** Pad to 2 digits */
const p2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** Last day of YYYY-MM as YYYY-MM-DD */
export const lastDayOfMonth = (ym: string): string => {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m, 0);
    return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
};

/**
 * Normalize YYYY | YYYY-MM | YYYY-MM-DD (or a parseable Date string)
 * to day precision (YYYY-MM-DD). position = 'start' | 'end'
 */
export const normalizeToDay = (
    s: string | null | undefined,
    position: "start" | "end"
): string | null => {
    if (!s) return null;
    if (isISODate(s)) return s;
    if (isYYYYMM(s)) return position === "start" ? `${s}-01` : lastDayOfMonth(s);
    if (isYYYY(s)) return position === "start" ? `${s}-01-01` : `${s}-12-31`;
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
    }
    return null;
};

const gt = (a: string, b: string) => a > b;
const lt = (a: string, b: string) => a < b;

/** Inclusive overlap between two ranges with nullable bounds (all YYYY-MM-DD or null) */
export const rangesOverlap = (
    aStart: string | null,
    aEnd: string | null,
    bStart: string | null,
    bEnd: string | null
): boolean => {
    if (bEnd && aStart && gt(aStart, bEnd)) return false; // A starts after B ends
    if (bStart && aEnd && lt(aEnd, bStart)) return false; // A ends before B starts
    return true;
};

/** Detect raw granularity for nicer labels */
type Granularity = "year" | "month" | "day";
const granOf = (s?: string | null): Granularity => {
    if (!s) return "day";
    if (isISODate(s)) return "day";
    if (isYYYYMM(s)) return "month";
    if (isYYYY(s)) return "year";
    return "day";
};

const fmtMonthYear = (iso: string, locale: string) =>
    new Date(iso).toLocaleDateString(locale, { month: "short", year: "numeric" });

const fmtDayMonthYear = (iso: string, locale: string) =>
    new Date(iso).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

/**
 * Human label for a date range.
 * Accepts the ORIGINAL raw start/end (YYYY, YYYY-MM, or YYYY-MM-DD), chooses a compact label,
 * and is SSR-safe (uses toLocaleDateString).
 *
 * Examples:
 *  - "2024" → "2024"
 *  - "2024-03" → "Mar 2024"
 *  - "2024-03-05" → "Mar 5, 2024"
 *  - ("2024-01", "2024-03") → "Jan 2024 – Mar 2024"
 *  - ("2023", "2024") → "2023 – 2024"
 *  - ("2024-01-10", null) → "Jan 2024 – Present" (uses month granularity for cleaner look)
 */
export const formatRange = (
    startRaw?: string | null,
    endRaw?: string | null,
    opts?: { locale?: string; presentLabel?: string }
): string | undefined => {
    const locale = opts?.locale ?? "en-US";
    const present = opts?.presentLabel ?? "Present";

    const sN = normalizeToDay(startRaw ?? null, "start");
    const eN = normalizeToDay(endRaw ?? null, "end");
    if (!sN && !eN) return undefined;

    const sg = granOf(startRaw);
    const eg = granOf(endRaw);

    // Single bound cases
    if (sN && !eN) {
        // Prefer month-year for ongoing to avoid “long” day labels
        if (sg === "year") return `${startRaw} – ${present}`;
        if (sg === "month") return `${fmtMonthYear(sN, locale)} – ${present}`;
        return `${fmtMonthYear(sN, locale)} – ${present}`;
    }
    if (!sN && eN) {
        // Rare, but if only end exists
        if (eg === "year") return `Until ${endRaw}`;
        if (eg === "month") return `Until ${fmtMonthYear(eN, locale)}`;
        return `Until ${fmtMonthYear(eN, locale)}`;
    }

    // Both bounds exist
    const s = sN!, e = eN!;
    const sameDay = s === e;
    if (sameDay) {
        // Day granularity if explicitly day; otherwise show month-year
        if (sg === "day" || eg === "day") return fmtDayMonthYear(s, locale);
        if (sg === "month" || eg === "month") return fmtMonthYear(s, locale);
        return new Date(s).getFullYear().toString();
    }

    const sYear = s.slice(0, 4);
    const eYear = e.slice(0, 4);
    const sameYear = sYear === eYear;

    // If both were year-only, keep it tight
    if (sg === "year" && eg === "year") return `${startRaw} – ${endRaw}`;

    // If both were month-or-better and same year, tighten label
    if (sameYear) {
        const sMonth = s.slice(5, 7);
        const eMonth = e.slice(5, 7);

        // Same month, different days → "Mar 5 – 12, 2024"
        if ((sg === "day" || eg === "day") && sMonth === eMonth) {
            const sD = new Date(s).toLocaleDateString(locale, { month: "short", day: "numeric" });
            const eD = new Date(e).toLocaleDateString(locale, { day: "numeric" });
            return `${sD} – ${eD}, ${sYear}`;
        }

        // Otherwise month-year on both ends
        return `${fmtMonthYear(s, locale)} – ${fmtMonthYear(e, locale)}`;
    }

    // Different years → month-year on both ends for clarity
    return `${fmtMonthYear(s, locale)} – ${fmtMonthYear(e, locale)}`;
};

// src/lib/date.ts
export const formatRange = (start?: string, end?: string) => {
    if (!start && !end) return undefined;
    const fmt = (ym: string) => {
        // Accepts "YYYY-MM" or full ISO; formats to "Mon YYYY"
        const d = ym.length === 7 ? new Date(`${ym}-01`) : new Date(ym);
        return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    };
    if (start && end) return `${fmt(start)} – ${fmt(end)}`;
    if (start) return `${fmt(start)} – Present`;
    return fmt(end!);
};

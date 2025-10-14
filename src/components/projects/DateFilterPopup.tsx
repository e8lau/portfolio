import * as React from "react";

type Range = { start: string | null; end: string | null };

type Props = {
    initial?: Range;
    onApply: (value: Range) => void;
    onClose: () => void;
};

export default function DateFilterPopup({ initial = { start: null, end: null }, onApply, onClose }: Props) {
    const [start, setStart] = React.useState<string | null>(initial.start ?? null);
    const [end, setEnd] = React.useState<string | null>(initial.end ?? null);

    // The parent controls opening/closing via hover; we simply call onClose when asked.

    return (
        <div className="projects-date-popup" role="dialog" aria-modal="false">
            <div className="projects-date-popup__body">
                <label htmlFor="pf-start">Start month</label>
                <input
                    id="pf-start"
                    type="month"
                    value={start ?? ""}
                    onChange={(e) => setStart(e.target.value || null)}
                />

                <label htmlFor="pf-end">End month</label>
                <input
                    id="pf-end"
                    type="month"
                    value={end ?? ""}
                    onChange={(e) => setEnd(e.target.value || null)}
                />

                <div className="projects-date-popup__actions">
                    <button type="button" onClick={() => { setStart(null); setEnd(null); onApply({ start: null, end: null }); onClose(); }}>
                        Clear
                    </button>
                    <button type="button" onClick={() => { onApply({ start, end }); onClose(); }}>
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}


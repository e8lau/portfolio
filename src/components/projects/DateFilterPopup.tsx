// src/components/projects/DateFilterPopup.tsx
import * as React from "react";

type Range = { start: string | null; end: string | null };

type Props = {
    initial?: Range;
    onApply: (value: Range) => void;
    onClose: () => void;
};

export default function DateFilterPopup({
    initial = { start: null, end: null },
    onApply,
    onClose,
}: Props) {
    const [start, setStart] = React.useState<string | null>(initial.start ?? null);
    const [end, setEnd] = React.useState<string | null>(initial.end ?? null);

    // keep local state in sync if parent changes "initial"
    React.useEffect(() => {
        setStart(initial.start ?? null);
        setEnd(initial.end ?? null);
    }, [initial.start, initial.end]);

    return (
        <div className="projects-date-popup" role="dialog" aria-modal="true">
            <div className="projects-date-popup__inner"><div className="projects-date-popup__fields">
                <h4 style={{ marginTop: 0 }}>Date range</h4>
                <label className="projects-date-popup__field">
                    <span>From </span>
                    <input
                        type="date"
                        style={{ marginBottom: 1 }}
                        value={start ?? ""}
                        onChange={(e) => setStart(e.target.value || null)}
                        placeholder="YYYY-MM-DD"
                    />
                </label>

                <label className="projects-date-popup__field">
                    <span>To </span>
                    <input
                        type="date"
                        style={{ marginBottom: 1 }}
                        value={end ?? ""}
                        onChange={(e) => setEnd(e.target.value || null)}
                        placeholder="YYYY-MM-DD"
                    />
                </label>
            </div>

                <div className="projects-date-popup__actions">
                    <button
                        type="button"
                        className="u-fullwidth"
                        onClick={() => {
                            onApply({ start, end });
                            onClose();
                        }}
                    >
                        Apply
                    </button>
                </div>

                <div className="projects-date-popup__actions">
                    <button
                        type="button"
                        className="u-fullwidth"
                        onClick={() => {
                            setStart(null);
                            setEnd(null);
                            onApply({ start: null, end: null });
                            onClose();
                        }}
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        className="u-fullwidth projects-date-popup__close"
                        aria-label="Close"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}

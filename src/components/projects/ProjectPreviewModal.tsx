// src/components/projects/ProjectPreviewModal.tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import type { ProjectCardProps } from "../../types/projects";
import { formatRange, normalizeToDay } from "../../lib/date";
import { renderMarkdown } from "../../lib/renderMarkdown";

type Props = {
    project: ProjectCardProps;
    onClose: () => void;
};

export default function ProjectPreviewModal({ project, onClose }: Props) {
    const overlayRef = React.useRef<HTMLDivElement | null>(null);
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const lastActive = React.useRef<HTMLElement | null>(null);

    // lock scroll + focus trap
    React.useEffect(() => {
        lastActive.current = (document.activeElement as HTMLElement) ?? null;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Tab") trapFocus(e);
        };
        document.addEventListener("keydown", onKey);

        // initial focus
        const focusable = getFocusable(panelRef.current);
        focusable[0]?.focus();

        return () => {
            document.body.style.overflow = prevOverflow;
            document.removeEventListener("keydown", onKey);
            lastActive.current?.focus?.();
        };
    }, [onClose]);

    const trapFocus = (e: KeyboardEvent) => {
        const nodes = getFocusable(panelRef.current);
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const elem = document.activeElement;
        if (e.shiftKey) {
            if (elem === first || !panelRef.current?.contains(elem)) {
                last.focus();
                e.preventDefault();
            }
        } else {
            if (elem === last) {
                first.focus();
                e.preventDefault();
            }
        }
    };

    const sN = normalizeToDay(project.started ?? null, "start");
    const eN = normalizeToDay(project.ended ?? null, "end");
    const rangeLabel = formatRange(project.started, project.ended) ?? "";

    const modal = (
        <div
            ref={overlayRef}
            role="presentation"
            className="project-preview__overlay"
            onClick={onClose}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="project-preview-title"
                className="project-preview__panel card"   // ← piggyback any “card” styles if present
                onClick={(e) => e.stopPropagation()}
            >
                <div className="project-preview__header row" style={{ alignItems: "center" }}>
                    <h3 id="project-preview-title" className="project-preview__title column">
                        {project.title}
                    </h3>
                    <button
                        type="button"
                        className="project-preview__close btn"
                        onClick={onClose}
                        aria-label="Close preview"
                    >
                        ✕
                    </button>
                </div>

                {(sN || eN) && (
                    <div className="project-preview__meta text-pretitle">
                        <span className="project-preview__date">{rangeLabel}</span>
                    </div>
                )}

                {project.cover && (
                    <a href={project.href} className="project-preview__imageLink" aria-label={project.title}>
                        <img
                            className="project-preview__image"
                            src={project.cover}
                            alt=""
                            loading="lazy"
                            decoding="async"
                        />
                    </a>
                )}

                {/* Use your article/body formatting classes here */}
                {project.excerpt && (
                    <div
                        className="project-preview__body entry__content content flow-text"
                        // ^ add 2–3 likely “body” classes from your theme; whichever exists will apply
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(project.excerpt) }}
                        style={{ paddingTop: 5 }}
                    />
                )}

                <div className="project-preview__actions">
                    <a className="btn btn--primary" href={project.href}>
                        Open full project →
                    </a>
                    <button className="btn" onClick={onClose} type="button">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

    // portal so it sits above everything
    return ReactDOM.createPortal(modal, document.body);
}

function getFocusable(root: HTMLElement | null): HTMLElement[] {
    if (!root) return [];
    const selectors = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
    ].join(",");
    return Array.from(root.querySelectorAll<HTMLElement>(selectors))
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
}

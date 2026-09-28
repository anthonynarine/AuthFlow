import React from "react";
import "./lesson.css";

/*
 * Pieces shared by the docs' step-through lessons (How it works, How a person
 * joins): the coach panel that explains the current step, and Back / step
 * dots / Next. Anything marked lesson-chrome is left out of docs search.
 */

export function LessonCoach({ eyebrow, title, body }) {
    return (
        <div className="lesson-coach" aria-live="polite">
            <p className="lesson-chrome lesson-eyebrow">{eyebrow}</p>
            <p className="lesson-coach-title">{title}</p>
            <p className="lesson-coach-body">{body}</p>
        </div>
    );
}

export function LessonNav({ steps, step, onStep }) {
    return (
        <div className="lesson-chrome lesson-nav">
            <button type="button" onClick={() => onStep(step - 1)} disabled={step === 0}>
                Back
            </button>
            <ol className="lesson-dots" aria-label="Lesson steps">
                {steps.map((entry, index) => (
                    <li key={entry.title}>
                        <button
                            type="button"
                            className="lesson-dot"
                            aria-label={`Step ${index + 1}: ${entry.title}`}
                            aria-current={index === step ? "step" : undefined}
                            onClick={() => onStep(index)}
                        />
                    </li>
                ))}
            </ol>
            <button type="button" onClick={() => onStep(step + 1)} disabled={step === steps.length - 1}>
                Next
            </button>
        </div>
    );
}

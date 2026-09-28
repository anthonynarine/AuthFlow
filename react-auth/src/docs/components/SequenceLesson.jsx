import React, { useState } from "react";
import { LessonCoach, LessonNav } from "./LessonParts";
import "./sequence-lesson.css";

/*
 * A step-through sequence diagram for the docs: labeled lanes, numbered
 * messages drawn as arrows between lane lifelines, and framed groups (an
 * either/or fork, a loop). Each beat lights some messages ("live"), keeps
 * earlier ones readable ("shown") and dims the rest; the lanes the live
 * messages touch stay lit. Content lives with each lesson (PersonJoinsLesson,
 * AppGetsKeyLesson); this file only draws it.
 *
 *   lanes   [{ id, label, tone }]            tone: person | console | gait | software
 *   blocks  [{ kind: "steps", label, tone, messages }
 *           | { kind: "frame", label, branches: [{ id, label, tone, messages }], separator }]
 *   message { n, from, to, text, dashed }
 *   beats   [{ title, body, live: [n], shown: [n] }]
 */

function trackStyle(laneCount) {
    const line = "linear-gradient(var(--seq-lifeline), var(--seq-lifeline))";
    return {
        gridTemplateColumns: `repeat(${laneCount}, minmax(0, 1fr))`,
        backgroundImage: Array(laneCount).fill(line).join(", "),
        backgroundPosition: Array.from(
            { length: laneCount },
            (_, i) => `calc(${(2 * i + 1) * 100}% / ${2 * laneCount}) 0`
        ).join(", "),
    };
}

function Message({ message, beat, tone, lanes, laneIndex, style }) {
    const fromIndex = laneIndex[message.from];
    const toIndex = laneIndex[message.to];
    const first = Math.min(fromIndex, toIndex);
    const span = Math.abs(toIndex - fromIndex) + 1;
    const live = beat.live.includes(message.n);
    const state = live ? "is-live" : beat.shown.includes(message.n) ? "" : "is-dim";
    const direction = toIndex > fromIndex ? "right" : "left";
    return (
        <li className={`seq-message seq-tone--${tone} ${state}`} aria-current={live ? "step" : undefined}>
            <span className="seq-number">{message.n}</span>
            <span className="seq-track seq-track--lines" style={style}>
                <span className="seq-span" style={{ gridColumn: `${first + 1} / span ${span}`, "--seq-span": span }}>
                    <span className="seq-route">
                        {lanes[fromIndex].label} → {lanes[toIndex].label}
                    </span>
                    <span className="seq-text">{message.text}</span>
                    <span
                        className={`seq-arrow seq-arrow--${direction}${message.dashed ? " is-dashed" : ""}`}
                        aria-hidden="true"
                    />
                </span>
            </span>
        </li>
    );
}

export function SequenceLesson({ caption, captionId, lanes, blocks, beats }) {
    const [step, setStep] = useState(0);
    const beat = beats[step];
    const laneIndex = Object.fromEntries(lanes.map((lane, index) => [lane.id, index]));
    const style = trackStyle(lanes.length);

    const allMessages = blocks.flatMap((block) =>
        block.kind === "frame" ? block.branches.flatMap((branch) => branch.messages) : block.messages
    );
    const activeLanes = new Set();
    for (const message of allMessages.filter((m) => beat.live.includes(m.n))) {
        activeLanes.add(message.from);
        activeLanes.add(message.to);
    }
    const laneLit = (id) => activeLanes.size === 0 || activeLanes.has(id);

    const renderMessages = (label, messages, tone) => (
        <ol className="seq-messages" aria-label={label}>
            {messages.map((message) => (
                <Message
                    key={message.n}
                    message={message}
                    beat={beat}
                    tone={tone}
                    lanes={lanes}
                    laneIndex={laneIndex}
                    style={style}
                />
            ))}
        </ol>
    );

    return (
        <figure className="seq" aria-labelledby={captionId}>
            <figcaption id={captionId} className="doc-visually-hidden">
                {caption}
            </figcaption>

            <div className="seq-lanes">
                <span className="seq-number" aria-hidden="true" />
                <ul className="seq-track seq-lane-heads" aria-label="Lanes" style={{ gridTemplateColumns: style.gridTemplateColumns }}>
                    {lanes.map((lane) => (
                        <li key={lane.id} className={`seq-lane seq-lane--${lane.tone}${laneLit(lane.id) ? "" : " is-dim"}`}>
                            {lane.label}
                        </li>
                    ))}
                </ul>
            </div>

            {blocks.map((block) =>
                block.kind === "frame" ? (
                    <div key={block.label} className="seq-frame">
                        <p className="seq-frame-label">{block.label}</p>
                        {block.branches.map((branch, index) => (
                            <div key={branch.id} className={`seq-branch seq-tone--${branch.tone}`}>
                                {index > 0 && block.separator && (
                                    <p className="seq-separator" aria-hidden="true">
                                        {block.separator}
                                    </p>
                                )}
                                {branch.label && <p className="seq-branch-label">{branch.label}</p>}
                                {renderMessages(branch.label || block.label, branch.messages, branch.tone)}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div key={block.label}>{renderMessages(block.label, block.messages, block.tone)}</div>
                )
            )}

            <LessonCoach eyebrow={`Step ${step + 1} of ${beats.length}`} title={beat.title} body={beat.body} />
            <LessonNav steps={beats} step={step} onStep={setStep} />
        </figure>
    );
}

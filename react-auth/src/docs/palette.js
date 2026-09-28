/*
 * Colours for the docs' Mermaid diagrams (theme variables and classDefs).
 * Mermaid can't read CSS custom properties and derives shades from hex, so
 * these stay literal here, in one place. Where a colour is also a CSS token in
 * tokens.css, the value is the same (palette.test.js checks it).
 */
export const DIAGRAM = {
    // Text and lines.
    text: "#e5e5e5",
    textOnRed: "#fecaca",
    line: "#a3a3a3",
    muted: "#525252",
    borderStrong: "rgba(255, 255, 255, 0.16)",

    // Surfaces.
    page: "#0a0a0a",
    surface: "#111111",
    surfaceAlt: "#1c1c1c",
    surfaceDeep: "#0f0f0f",

    // Categorical strokes (same as tokens.css --gd-*). Stage 2 (monochrome):
    // teal is white, purple lavender, orange and amber sand (human-held
    // things: people's decisions, keys; never the status warning amber),
    // cyan and blue mist. Green and red stay the status colours.
    teal: "#fafafa",
    purple: "#b8aee0",
    orange: "#d6b98c",
    cyan: "#a7c7d9",
    blue: "#a7c7d9",
    green: "#4ade80",
    amber: "#d6b98c",
    red: "#f87171",

    // Dark fills behind each stroke.
    fillTeal: "#1c1c1c",
    fillGreen: "#0f2417",
    fillPurple: "#1d1b26",
    fillOrange: "#231e17",
    fillBlue: "#162029",
    fillAmber: "#231e17",
    fillRed: "#2a1215",
};

/** The CSS token each shared diagram colour must match. */
export const DIAGRAM_TOKEN_PAIRS = {
    teal: "--gd-teal",
    purple: "--gd-purple",
    orange: "--gd-orange",
    cyan: "--gd-cyan",
    blue: "--gd-blue",
    green: "--gd-good",
    line: "--gd-grey",
};

/*
 * Colours for the docs' Mermaid diagrams (theme variables and classDefs).
 * Mermaid can't read CSS custom properties and derives shades from hex, so
 * these stay literal here, in one place. Where a colour is also a CSS token in
 * tokens.css, the value is the same (palette.test.js checks it).
 */
export const DIAGRAM = {
    // Text and lines.
    text: "#e8eaed",
    textOnRed: "#ffd6d6",
    line: "#9aa4af",
    muted: "#5b6572",
    borderStrong: "rgba(255, 255, 255, 0.16)",

    // Surfaces.
    page: "#121212",
    surface: "#1b2129",
    surfaceAlt: "#232a34",
    surfaceDeep: "#161b22",

    // Categorical strokes (same as tokens.css --gd-*).
    teal: "#1abc9c",
    purple: "#a78bfa",
    orange: "#fb8a5c",
    cyan: "#38bdf8",
    blue: "#7aa7ff",
    green: "#34d399",
    amber: "#f5b85b",
    red: "#ff6b6b",

    // Dark fills behind each stroke.
    fillTeal: "#123029",
    fillGreen: "#1f3b36",
    fillPurple: "#2a2340",
    fillOrange: "#3a2016",
    fillBlue: "#172440",
    fillAmber: "#3a2e1a",
    fillRed: "#3a1f24",
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

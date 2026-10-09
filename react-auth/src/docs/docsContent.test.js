/**
 * Guard for the customer docs (src/docs): they must stay neutral and must
 * never carry internal material or key-shaped values. To ban another word,
 * add it to FORBIDDEN_TERMS.
 */
import fs from "fs";
import path from "path";

// Matched case-insensitively against every docs source file (tests excluded).
// Lumen is allowed since GAIT-13: it is my own app, the one Gait protects, and
// the docs use it as their example.
export const FORBIDDEN_TERMS = [
    "hospital",
    "physician",
    "technologist",
    "clinical",
    "clinician",
    "clinic",
    "patient",
    "operator_guide",
    "operator guide",
    "herokuapp",
    "auth_integration",
];

// Example names and descriptions that contain a forbidden word; removed before checking.
const ALLOWED_PHRASES = ["example clinic", "a clinical app"];

// Mixed case with digits, 24+ characters: what a real secret tends to look like.
const KEY_SHAPED = /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[a-z])(?=[A-Za-z0-9_-]*[A-Z])[A-Za-z0-9_-]{24,}\b/;

function docsSourceFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return docsSourceFiles(full);
        return /\.test\.[jt]sx?$/.test(entry.name) ? [] : [full];
    });
}

const FILES = docsSourceFiles(__dirname);

test("the guard actually sees the docs pages", () => {
    expect(FILES.some((file) => file.endsWith("Troubleshooting.jsx"))).toBe(true);
    expect(FILES.length).toBeGreaterThanOrEqual(10);
});

describe.each(FILES.map((file) => [path.relative(__dirname, file), file]))("%s", (name, file) => {
    const source = fs.readFileSync(file, "utf8");

    test("uses neutral examples only", () => {
        // Collapse whitespace so a phrase wrapped across JSX lines still matches.
        let text = source.toLowerCase().replace(/\s+/g, " ");
        ALLOWED_PHRASES.forEach((phrase) => {
            text = text.split(phrase).join("");
        });
        const found = FORBIDDEN_TERMS.filter((term) => text.includes(term));
        expect(found).toEqual([]);
    });

    test("contains nothing that looks like a real key", () => {
        expect(source.match(KEY_SHAPED)).toBeNull();
    });
});

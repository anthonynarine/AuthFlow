import fs from "fs";
import path from "path";
import { DIAGRAM, DIAGRAM_TOKEN_PAIRS } from "./palette";

const DOCS = __dirname;
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

function filesUnder(dir, extensions) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return filesUnder(full, extensions);
        return extensions.some((ext) => entry.name.endsWith(ext)) ? [full] : [];
    });
}

function cssTokens() {
    const css = fs.readFileSync(path.join(DOCS, "tokens.css"), "utf8");
    return Object.fromEntries([...css.matchAll(/(--gd-[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
}

// Code comments may name colours; only real values count.
function withoutComments(text) {
    return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("docs palette", () => {
    test("each diagram colour that's also a CSS token has the same value", () => {
        const tokens = cssTokens();
        for (const [key, token] of Object.entries(DIAGRAM_TOKEN_PAIRS)) {
            expect([key, tokens[token]]).toEqual([key, DIAGRAM[key]]);
        }
    });

    test("no docs stylesheet hard-codes a colour: they all use tokens.css", () => {
        const offenders = filesUnder(DOCS, [".css"])
            .filter((file) => path.basename(file) !== "tokens.css")
            .filter((file) => COLOUR.test(withoutComments(fs.readFileSync(file, "utf8"))));
        expect(offenders).toEqual([]);
    });

    test("no docs component or page hard-codes a colour: diagrams use palette.js", () => {
        const offenders = filesUnder(DOCS, [".js", ".jsx"])
            .filter((file) => !/palette\.js$|\.test\.jsx?$/.test(file))
            .filter((file) => COLOUR.test(withoutComments(fs.readFileSync(file, "utf8"))));
        expect(offenders).toEqual([]);
    });
});

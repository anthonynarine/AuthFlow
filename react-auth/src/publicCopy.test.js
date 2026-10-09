/**
 * GAIT-13: Gait is my internal security system (it protects Lumen and Gait
 * itself), not a product for other companies. The public surface must not
 * slip back into selling it.
 */
import fs from "fs";
import path from "path";

export const RETIRED_PHRASES = [
    "your team",
    "your company",
    "your software",
    "every app you ship",
    "acme",
    "request early access",
    "read the quickstart",
];

const ROOT = path.join(__dirname, "..");

const PUBLIC_FILES = [
    "public/index.html",
    "src/components/home/HomePage.jsx",
    "src/app/RouteTitle.jsx",
    "src/docs/manifest.js",
    "src/docs/content/WhatGaitIs.jsx",
];

function retiredIn(file) {
    // Collapse whitespace so a phrase wrapped across JSX lines still matches.
    const text = fs.readFileSync(path.join(ROOT, file), "utf8").toLowerCase().replace(/\s+/g, " ");
    return RETIRED_PHRASES.filter((phrase) => text.includes(phrase));
}

test.each(PUBLIC_FILES)("%s carries none of the retired phrases", (file) => {
    expect(retiredIn(file)).toEqual([]);
});

test("index.html says what Gait is, in the first person", () => {
    const html = fs.readFileSync(path.join(ROOT, "public/index.html"), "utf8");
    expect(html).toContain("<title>Gait: the internal security system behind my apps</title>");
    expect(html).toContain("Gait is the internal security system I built to protect my own applications");
});

test("the guard would catch a retired phrase", () => {
    const text = "See the security of every app you ship".toLowerCase();
    expect(RETIRED_PHRASES.some((phrase) => text.includes(phrase))).toBe(true);
});

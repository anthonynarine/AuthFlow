/**
 * GAIT-13: Gait is my internal security system (in production it protects
 * itself; Lumen, my clinical app, is in development), not a product for other
 * companies. The public surface must not slip back into selling it, claim
 * compliance, or carry clinical/patient wording.
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

// Never claim compliance or certification.
export const COMPLIANCE_TERMS = ["hipaa", "soc 2", "soc2", "certified", "compliant", "compliance"];

// "clinic" also catches "clinical" and "clinician".
export const CLINICAL_TERMS = ["hospital", "physician", "clinician", "clinic", "patient"];

// The only clinical wording allowed: Lumen described as "a clinical app" or
// "my clinical app", and the docs' made-up "Example Clinic" (named in the
// manifest's rules comment). Word boundaries, so "a clinical application" or "a
// clinical appointment" still trips the ban.
export const ALLOWED_PHRASES = [/\b(a|my) clinical app\b/gi, /\bexample clinic\b/gi];

const ROOT = path.join(__dirname, "..");

const PUBLIC_FILES = [
    "public/index.html",
    "src/components/home/HomePage.jsx",
    "src/app/RouteTitle.jsx",
    "src/docs/manifest.js",
    "src/docs/content/WhatGaitIs.jsx",
    "README.md",
    "../README.md",
];

function normalized(text) {
    // Collapse whitespace so a phrase wrapped across JSX lines still matches.
    return text.toLowerCase().replace(/\s+/g, " ");
}

function bannedIn(text) {
    const allowedRemoved = ALLOWED_PHRASES.reduce((acc, phrase) => acc.replace(phrase, " "), normalized(text));
    return [...RETIRED_PHRASES, ...COMPLIANCE_TERMS, ...CLINICAL_TERMS].filter((term) => allowedRemoved.includes(term));
}

test.each(PUBLIC_FILES)("%s carries none of the retired, compliance or clinical terms", (file) => {
    expect(bannedIn(fs.readFileSync(path.join(ROOT, file), "utf8"))).toEqual([]);
});

test("index.html says what Gait is, in the first person", () => {
    const html = fs.readFileSync(path.join(ROOT, "public/index.html"), "utf8");
    expect(html).toContain("<title>Gait: the internal security system behind my apps</title>");
    expect(html).toContain("Gait is the internal security system I built to protect my own applications");
});

test("the guard would catch each kind of banned term", () => {
    expect(bannedIn("See the security of every app you ship")).toEqual(["every app you ship"]);
    expect(bannedIn("HIPAA-compliant")).toEqual(["hipaa", "compliant"]);
    expect(bannedIn("Lumen, my clinical app")).toEqual([]);
    expect(bannedIn("a clinical application")).toEqual(["clinic"]);
    expect(bannedIn("a clinical appointment")).toEqual(["clinic"]);
    expect(bannedIn("for patients")).toEqual(["patient"]);
});

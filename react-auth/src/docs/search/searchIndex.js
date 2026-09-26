import React from "react";
import { MemoryRouter } from "react-router-dom";
import { DOC_PAGES } from "../manifest";
import { DOC_CONTENT } from "../content";

/*
 * Client-side docs search. The index is built from the pages themselves (each
 * rendered to static markup, then split into its h2 sections), so it can never
 * drift from the content. react-dom/server is loaded on demand, the first time
 * someone uses search; nothing is sent anywhere.
 */

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 8;
const SNIPPET_RADIUS = 70;

// Parts of a rendered page that aren't prose.
const NOT_PROSE =
    ".doc-diagram-canvas, .doc-code-head, [role='status'], .doc-visually-hidden, .doc-status, .doc-status-note";
// Block elements whose text would otherwise run together ("it.Revoke").
const BLOCKS = "p, li, td, th, dt, dd, h2, h3, h4, figcaption, pre, .iso-step-note";

function clean(text) {
    return text.replace(/\s+/g, " ").trim();
}

/** Split one page's rendered markup into searchable entries: the intro, then one per section. */
export function entriesForPage(page, html) {
    const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
    const root = doc.getElementById("root");
    root.querySelectorAll(NOT_PROSE).forEach((node) => node.remove());
    root.querySelectorAll(BLOCKS).forEach((node) => node.append(" "));

    // Anything marked data-search-title (e.g. a glossary term) is its own result.
    const items = Array.from(root.querySelectorAll("[data-search-title]")).map((item) => {
        const entry = {
            slug: page.slug,
            pageTitle: page.title,
            sectionId: item.id || null,
            sectionTitle: item.getAttribute("data-search-title"),
            text: clean(item.textContent),
        };
        item.remove();
        return entry;
    });

    const sections = Array.from(root.querySelectorAll("section.doc-section"));
    const entries = sections.map((section) => {
        const heading = section.querySelector("h2");
        return {
            slug: page.slug,
            pageTitle: page.title,
            sectionId: heading ? heading.id : null,
            sectionTitle: heading ? clean(heading.textContent) : null,
            text: clean(section.textContent.slice(heading ? heading.textContent.length : 0)),
        };
    });
    sections.forEach((section) => section.remove());
    entries.unshift({
        slug: page.slug,
        pageTitle: page.title,
        sectionId: null,
        sectionTitle: null,
        text: clean(`${page.summary} ${root.textContent}`),
    });
    return entries.concat(items);
}

export function buildSearchIndex(renderToStaticMarkup) {
    return DOC_PAGES.flatMap((page) => {
        const Content = DOC_CONTENT[page.slug];
        const html = renderToStaticMarkup(
            <MemoryRouter>
                <Content />
            </MemoryRouter>
        );
        return entriesForPage(page, html);
    });
}

let indexPromise = null;

export function loadSearchIndex() {
    if (!indexPromise) {
        indexPromise = import("react-dom/server")
            .then(({ renderToStaticMarkup }) => buildSearchIndex(renderToStaticMarkup))
            .catch((error) => {
                indexPromise = null; // allow a retry
                throw error;
            });
    }
    return indexPromise;
}

// Light stemming so "rotate" finds "rotating" and "keys" finds "key".
function stem(term) {
    if (term.length <= 4) return term;
    return term.replace(/(ing|ed|es|s|e)$/, "");
}

function termsOf(query) {
    return clean(query.toLowerCase())
        .split(" ")
        .filter(Boolean)
        .map(stem);
}

function countOf(haystack, term) {
    let count = 0;
    let at = haystack.indexOf(term);
    while (at !== -1 && count < 5) {
        count += 1;
        at = haystack.indexOf(term, at + term.length);
    }
    return count;
}

/** [{ text, match }] pieces of a snippet around the first matching term. */
function snippetFor(text, terms) {
    const lower = text.toLowerCase();
    const first = Math.min(...terms.map((term) => lower.indexOf(term)).filter((at) => at !== -1));
    const start = Number.isFinite(first) ? Math.max(0, first - SNIPPET_RADIUS) : 0;
    const end = Math.min(text.length, (Number.isFinite(first) ? first : 0) + SNIPPET_RADIUS * 2);
    const excerpt = `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;

    // Highlight the whole word a (stemmed) term starts: "rotat" marks "rotating".
    // Splitting on one capture group alternates text / match / text / match...
    const alternatives = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    return excerpt
        .split(new RegExp(`((?:${alternatives})[a-z0-9]*)`, "gi"))
        .map((part, i) => ({ text: part, match: i % 2 === 1 }))
        .filter((part) => part.text);
}

/** Every term must appear; titles weigh more than headings, headings more than body text. */
export function searchDocs(index, query) {
    if (clean(query).length < MIN_QUERY_LENGTH) {
        return [];
    }
    const terms = termsOf(query);
    return index
        .map((entry) => {
            const title = entry.pageTitle.toLowerCase();
            const section = (entry.sectionTitle || "").toLowerCase();
            const text = entry.text.toLowerCase();
            let score = 0;
            for (const term of terms) {
                const inTitle = title.includes(term);
                const inSection = section.includes(term);
                const inText = countOf(text, term);
                if (!inTitle && !inSection && !inText) {
                    return null;
                }
                score += (inTitle ? 10 : 0) + (inSection ? 6 : 0) + inText;
            }
            return { ...entry, score, snippet: snippetFor(entry.text, terms) };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_RESULTS);
}

export { MIN_QUERY_LENGTH };

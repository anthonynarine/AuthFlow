import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { DocsPage } from "../DocsPage";
import { DOC_PAGES } from "../manifest";
import { buildSearchIndex, searchDocs } from "./searchIndex";

// react-dom/server's browser build expects TextEncoder, which this jsdom lacks.
const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;
const { renderToStaticMarkup } = require("react-dom/server");

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname + location.hash}</div>;
}

function renderDocs(path) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/docs/:slug" element={<DocsPage />} />
            </Routes>
            <LocationProbe />
        </MemoryRouter>
    );
}

let index;

beforeAll(() => {
    index = buildSearchIndex(renderToStaticMarkup);
});

beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
    delete Element.prototype.scrollIntoView;
});

describe("search index", () => {
    test("covers every page, split into its sections, with no diagram chrome", () => {
        expect(new Set(index.map((entry) => entry.slug))).toEqual(new Set(DOC_PAGES.map((page) => page.slug)));
        const rotating = index.find((entry) => entry.sectionId === "rotating-keys");
        expect(rotating).toMatchObject({ slug: "applications-and-connection-keys", sectionTitle: "Rotating keys" });
        expect(index.some((entry) => entry.text.includes("Loading diagram"))).toBe(false);
    });

    test("every term must match; a heading hit ranks above body text", () => {
        const results = searchDocs(index, "rotating keys");
        expect(results[0]).toMatchObject({ slug: "applications-and-connection-keys", sectionId: "rotating-keys" });
        expect(searchDocs(index, "rotating xyzzy")).toEqual([]);
        expect(searchDocs(index, "k")).toEqual([]);
    });

    test("light stemming: 'rotate key' finds the Rotating keys section and highlights whole words", () => {
        const results = searchDocs(index, "rotate key");
        const rotating = results.find((result) => result.sectionId === "rotating-keys");
        expect(rotating).toBeDefined();
        const marked = rotating.snippet.filter((part) => part.match).map((part) => part.text.toLowerCase());
        expect(marked.some((word) => word.startsWith("key"))).toBe(true);
    });

    test("text from separate blocks doesn't run together", () => {
        const leak = index.find((entry) => entry.sectionId === "if-a-key-leaks");
        expect(leak.text).toContain("Issue a new key and deploy it. Revoke the leaked key.");
    });

    test("each glossary term is its own result, and it ranks first for its own name", () => {
        const results = searchDocs(index, "accept risk");
        expect(results[0]).toMatchObject({ slug: "glossary", sectionId: "term-accept-risk", sectionTitle: "Accept risk" });
    });

    test("status badges aren't indexed as prose", () => {
        const journeys = index.find((entry) => entry.sectionId === "the-four-journeys");
        expect(journeys.text).not.toMatch(/Pending|Live[A-Z]/);
        expect(journeys.text).toContain("GAIT_APPLICATION_CREDENTIAL Watch findings");
    });

    test("finds glossary terms and highlights the match", () => {
        const results = searchDocs(index, "fingerprint");
        expect(results.map((result) => result.slug)).toContain("glossary");
        const snippet = results[0].snippet;
        expect(snippet.some((part) => part.match && part.text.toLowerCase() === "fingerprint")).toBe(true);
    });
});

describe("search box", () => {
    let xhrOpen;

    beforeEach(() => {
        xhrOpen = jest.spyOn(XMLHttpRequest.prototype, "open");
    });

    afterEach(() => {
        xhrOpen.mockRestore();
    });

    test("typing shows results; choosing one goes to that section; nothing is sent over the network", async () => {
        renderDocs("/docs/what-gait-is");
        const sidebar = screen.getByRole("navigation", { name: "Documentation" });
        const box = within(sidebar).getByRole("searchbox", { name: "Search the docs" });

        fireEvent.change(box, { target: { value: "rotating keys" } });
        const results = await within(sidebar).findByRole("list", { name: "Search results" });
        const first = within(results).getAllByRole("link")[0];
        expect(first).toHaveTextContent("Applications & connection keys › Rotating keys");
        expect(within(sidebar).getByText(/results?$/)).toBeInTheDocument();

        fireEvent.click(first);
        expect(screen.getByTestId("location")).toHaveTextContent("/docs/applications-and-connection-keys#rotating-keys");
        expect(box).toHaveValue("");
        expect(xhrOpen).not.toHaveBeenCalled();
    });

    test("arrow keys move through results and Escape clears", async () => {
        renderDocs("/docs/what-gait-is");
        const sidebar = screen.getByRole("navigation", { name: "Documentation" });
        const box = within(sidebar).getByRole("searchbox", { name: "Search the docs" });
        box.focus();
        fireEvent.change(box, { target: { value: "connection key" } });
        const results = await within(sidebar).findByRole("list", { name: "Search results" });
        const links = within(results).getAllByRole("link");

        fireEvent.keyDown(box, { key: "ArrowDown" });
        expect(links[0]).toHaveFocus();
        fireEvent.keyDown(links[0], { key: "ArrowDown" });
        expect(links[1]).toHaveFocus();
        fireEvent.keyDown(links[1], { key: "ArrowUp" });
        fireEvent.keyDown(links[0], { key: "ArrowUp" });
        expect(box).toHaveFocus();

        fireEvent.keyDown(box, { key: "Escape" });
        expect(box).toHaveValue("");
        expect(within(sidebar).queryByRole("list", { name: "Search results" })).toBeNull();
    });

    test("says so when nothing matches", async () => {
        renderDocs("/docs/what-gait-is");
        const sidebar = screen.getByRole("navigation", { name: "Documentation" });
        fireEvent.change(within(sidebar).getByRole("searchbox"), { target: { value: "xyzzy" } });
        expect(await within(sidebar).findByText('No results for "xyzzy".')).toBeInTheDocument();
    });

    test("choosing a result from the mobile menu closes the menu", async () => {
        renderDocs("/docs/what-gait-is");
        // eslint-disable-next-line testing-library/no-node-access -- the native <details> element's open state is what this test checks
        const menu = screen.getByText("Contents").closest("details");
        menu.open = true;
        fireEvent(menu, new Event("toggle"));
        const mobileNav = screen.getByRole("navigation", { name: "Documentation contents" });

        fireEvent.change(within(mobileNav).getByRole("searchbox"), { target: { value: "glossary" } });
        const results = await within(mobileNav).findByRole("list", { name: "Search results" });
        fireEvent.click(within(results).getAllByRole("link")[0]);

        await waitFor(() => expect(menu).not.toHaveAttribute("open"));
    });
});

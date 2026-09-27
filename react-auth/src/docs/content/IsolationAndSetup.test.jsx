import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import mermaid from "mermaid";
import { RouteTitle } from "../../app/RouteTitle";
import { DocsPage } from "../DocsPage";
import { DOC_PAGES } from "../manifest";
import { FEATURE_STATUS, statusOf } from "../featureStatus";
import { ACCOUNT_POOL, CONSOLE_ISOLATION } from "../components/IsolationDiagrams";

function renderIsolation() {
    return render(
        <MemoryRouter initialEntries={["/docs/isolation"]}>
            <RouteTitle />
            <Routes>
                <Route path="/docs/:slug" element={<DocsPage />} />
            </Routes>
        </MemoryRouter>
    );
}

// Let the (mocked) mermaid chunk load and both diagrams settle.
async function settleDiagrams() {
    // eslint-disable-next-line testing-library/no-node-access -- diagram load state lives on an aria-hidden canvas
    await waitFor(() => expect(document.querySelector('[data-status="loading"]')).toBeNull());
}

function badgesIn(list) {
    return within(list)
        .getAllByRole("listitem")
        .map((item) => item.querySelector(".doc-status").textContent);
}

beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
    delete Element.prototype.scrollIntoView;
});

test("lives at /docs/isolation, right after the identity-model page", async () => {
    renderIsolation();
    await settleDiagrams();
    expect(screen.getByRole("heading", { level: 1, name: "Isolation and setup" })).toBeInTheDocument();
    expect(document.title).toBe("Isolation and setup · Gait Docs");

    const slugs = DOC_PAGES.map((page) => page.slug);
    expect(slugs.indexOf("isolation")).toBe(slugs.indexOf("people-and-applications") + 1);
    const sidebar = screen.getByRole("navigation", { name: "Documentation" });
    expect(within(sidebar).getByRole("link", { name: "Isolation and setup" })).toHaveAttribute("aria-current", "page");
});

test("both isolation diagrams use the shared mermaid Diagram, walls included, App One on the left", async () => {
    const renderSpy = jest.spyOn(mermaid, "render");
    renderIsolation();
    await settleDiagrams();

    const sources = renderSpy.mock.calls.map(([, source]) => source);
    expect(sources).toEqual([CONSOLE_ISOLATION, ACCOUNT_POOL]);
    renderSpy.mockRestore();

    // Declaration orders that put App One on the left (verified in a browser;
    // see the comments in IsolationDiagrams.jsx).
    expect(CONSOLE_ISOLATION.indexOf("app-one")).toBeLessThan(CONSOLE_ISOLATION.indexOf("app-two"));
    expect(CONSOLE_ISOLATION).toContain("404 both ways<br/>no shared rows");
    expect(ACCOUNT_POOL.indexOf("App Two's database")).toBeLessThan(ACCOUNT_POOL.indexOf("App One's database"));
    expect(ACCOUNT_POOL.match(/who is this\?/g)).toHaveLength(2);
    expect(ACCOUNT_POOL).toContain("separate<br/>databases");
    [CONSOLE_ISOLATION, ACCOUNT_POOL].forEach((source) => expect(source).toContain(":::wall"));

    expect(screen.getByText(/A wall between them reads: 404 both ways, no shared rows/)).toBeInTheDocument();
    expect(screen.getByText(/A wall between the two reads: separate databases/)).toBeInTheDocument();
});

test("the wrong-door flow ends in a 404, and a key decides the company", async () => {
    renderIsolation();
    await settleDiagrams();
    const wrongDoor = screen.getByRole("list", { name: "An app-one Admin asks for app-two's findings" });
    const steps = within(wrongDoor).getAllByRole("listitem");
    expect(steps[steps.length - 1]).toHaveTextContent("404, exactly like a company that doesn't exist.");
    expect(wrongDoor).toHaveTextContent("GET /api/organizations/app-two/security/findings/");

    expect(screen.getByText("Nothing in the request can point it at app-one.")).toBeInTheDocument();
});

test("journey badges: Live only if a customer can do it in the console today", async () => {
    renderIsolation();
    await settleDiagrams();
    const journey1 = screen.getByRole("list", { name: "Journey 1 steps" });
    expect(badgesIn(journey1)).toEqual(Array(6).fill("Live")); // E1 and F3 are live
    // The findings screen shipped (F3), so its "API only" note is gone.
    expect(within(journey1).getAllByRole("listitem")[5]).not.toHaveTextContent("Findings screen (F3)");
    expect(badgesIn(screen.getByRole("list", { name: "Journey 2 steps" }))).toEqual(["Live", "Live"]);
    expect(badgesIn(screen.getByRole("list", { name: "Journey 3 steps" }))).toEqual(Array(4).fill("Live"));
    expect(screen.queryByText(/through Gait's API/)).toBeNull();
    // Acting on a finding (journey 2's FAIL path) is live with the same screen.
    expect(within(screen.getByText(/acknowledges it or accepts the risk/)).getByText("Live")).toBeInTheDocument();
    expect(screen.getByText(/All of this is/)).toHaveTextContent("All of this is Live.");
    const journey4 = badgesIn(screen.getByRole("list", { name: "Journey 4 steps" }));
    expect(journey4).toHaveLength(7);
    expect(new Set(journey4)).toEqual(new Set(["Live"]));
    expect(screen.getByText(/Status as of 26 September 2026/)).toBeInTheDocument();
});

test("updating the status object is all it takes to flip a badge", async () => {
    const original = FEATURE_STATUS.emailVerification;
    FEATURE_STATUS.emailVerification = "pending";
    try {
        renderIsolation();
        await settleDiagrams();
        expect(badgesIn(screen.getByRole("list", { name: "Journey 1 steps" }))).toEqual([
            "Live",
            "Pending",
            "Live",
            "Live",
            "Live",
            "Live",
        ]);
        // The legend is fixed, not tied to a feature.
        expect(screen.getByText(/means you can do it today/)).toHaveTextContent("Pending means it isn't available");
    } finally {
        FEATURE_STATUS.emailVerification = original;
    }
});

test("an unknown feature key fails loudly instead of showing a wrong badge", () => {
    expect(() => statusOf("noSuchFeature")).toThrow("Unknown feature status");
});

test("the planned line has no link to internal material", async () => {
    renderIsolation();
    await settleDiagrams();
    const planned = screen.getByRole("region", { name: "Planned" });
    expect(planned).toHaveTextContent("Planned: sign-in hosted by Gait, and tokens tied to the app they were issued for.");
    expect(within(planned).queryByRole("link")).toBeNull();
});

test("while the findings screen is pending, journey 1 says the API is available and journey 2 says so too", async () => {
    const original = FEATURE_STATUS.findingsScreen;
    FEATURE_STATUS.findingsScreen = "pending";
    try {
        renderIsolation();
        await settleDiagrams();
        const journey1 = screen.getByRole("list", { name: "Journey 1 steps" });
        expect(badgesIn(journey1)[5]).toBe("Pending");
        expect(within(journey1).getAllByRole("listitem")[5]).toHaveTextContent("The findings API is available now.");
        expect(screen.getByText(/waits for the findings screen/)).toBeInTheDocument();
    } finally {
        FEATURE_STATUS.findingsScreen = original;
    }
});

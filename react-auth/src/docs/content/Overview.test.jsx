import "@testing-library/jest-dom";
import React from "react";
import fs from "fs";
import path from "path";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DocsPage } from "../DocsPage";
import { DOC_GROUPS, DOC_PAGES, findDocPage } from "../manifest";
import { FEATURE_STATUS, STATUS_LABELS } from "../featureStatus";
import { GLOSSARY } from "./Glossary";
import { ENV_VARS, INSTALL, REPORT } from "./snippets";

function renderDoc(slug) {
    return render(
        <MemoryRouter initialEntries={[`/docs/${slug}`]}>
            <Routes>
                <Route path="/docs/:slug" element={<DocsPage />} />
            </Routes>
        </MemoryRouter>
    );
}

async function settleDiagrams() {
    // eslint-disable-next-line testing-library/no-node-access -- diagram load state lives on an aria-hidden canvas
    await waitFor(() => expect(document.querySelector('[data-status="loading"]')).toBeNull());
}

// The badge and its note, read as separate words (jsdom has no innerText).
function statusText(node) {
    return Array.from(node.querySelectorAll(".doc-status, .doc-status-note"))
        .map((part) => part.textContent)
        .join(" ");
}

function statusCells(table, column) {
    return within(table)
        .getAllByRole("row")
        .slice(1)
        .map((row) => statusText(row.querySelectorAll("td, th")[column]));
}

beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
    delete Element.prototype.scrollIntoView;
});

describe("navigation groups", () => {
    test("the sidebar shows each group in order, with its pages, and previous/next follows the same order", async () => {
        renderDoc("what-gait-is");
        const sidebar = screen.getByRole("navigation", { name: "Documentation" });
        for (const group of DOC_GROUPS) {
            const list = within(sidebar).getByRole("list", { name: group.title });
            expect(within(list).getAllByRole("link").map((link) => link.textContent)).toEqual(
                group.pages.map((page) => page.title)
            );
        }
        expect(DOC_GROUPS.map((group) => group.title)).toEqual([
            "Start here",
            "Concepts",
            "Guides",
            "Reference",
            "Gait's platform",
        ]);
        expect(DOC_PAGES.map((page) => page.slug).slice(0, 5)).toEqual([
            "what-gait-is",
            "how-it-works",
            "quickstart",
            "people-and-applications",
            "isolation",
        ]);
        const pager = screen.getByRole("navigation", { name: "Previous and next page" });
        expect(within(pager).getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/docs/how-it-works");
    });
});

describe("What Gait is", () => {
    test("statuses map to the shared keys, with what a Pending item waits on", () => {
        renderDoc("what-gait-is");
        expect(statusCells(screen.getByRole("table", { name: "What you get" }), 2)).toEqual([
            "Live",
            "Live",
            "Live",
            "Live",
            "Pending Members screen",
            "Early access",
        ]);
        expect(screen.getByText(/Status as of 26 September 2026/)).toBeInTheDocument();
    });

    test("the status object drives the badge and the waiting note", () => {
        const original = FEATURE_STATUS.findingsScreen;
        FEATURE_STATUS.findingsScreen = "pending";
        try {
            renderDoc("what-gait-is");
            expect(statusCells(screen.getByRole("table", { name: "What you get" }), 2)[3]).toBe("Pending Findings screen");
        } finally {
            FEATURE_STATUS.findingsScreen = original;
        }
    });

    test("early access is its own status", () => {
        expect(STATUS_LABELS.earlyAccess).toBe("Early access");
        expect(FEATURE_STATUS.productSignIn).toBe("earlyAccess");
    });
});

describe("How it works", () => {
    test("renders the big picture and marks acting on findings as Live (F3)", async () => {
        renderDoc("how-it-works");
        expect(screen.getByText(/Your team \(Owner, Admin, Member\) signs in to the console/)).toBeInTheDocument();
        // The innermost list item holding the text (items come in document order).
        const teamActs = screen.getAllByRole("listitem").filter((item) => within(item).queryByText(/Your team acts\./));
        expect(statusText(teamActs[teamActs.length - 1])).toBe("Live");
        await settleDiagrams();
    });
});

describe("Quickstart", () => {
    test("eight steps with their statuses and detail links", () => {
        renderDoc("quickstart");
        const table = screen.getByRole("table", { name: "Quickstart checklist" });
        expect(statusCells(table, 2)).toEqual([
            "Live",
            "Live",
            "Live",
            "Live",
            "Live",
            "Live",
            "Live",
            "Live",
        ]);
        expect(within(table).getAllByRole("link")[6]).toHaveAttribute(
            "href",
            "/docs/connecting-your-software#report-a-security-check"
        );
    });

    test("shows exactly the same snippets as Connecting your software", () => {
        const { unmount } = renderDoc("quickstart");
        // eslint-disable-next-line testing-library/no-node-access -- code blocks have no role; their exact text is what this test checks
        const quickstartCode = Array.from(document.querySelectorAll(".doc-code-pre")).map((pre) => pre.textContent);
        unmount();
        renderDoc("connecting-your-software");
        // eslint-disable-next-line testing-library/no-node-access -- code blocks have no role; their exact text is what this test checks
        const connectingCode = Array.from(document.querySelectorAll(".doc-code-pre")).map((pre) => pre.textContent);

        expect(quickstartCode).toEqual([INSTALL, ENV_VARS, REPORT]);
        expect(connectingCode).toEqual([INSTALL, ENV_VARS, REPORT]);
    });

    test("the snippets are defined once, in snippets.js", () => {
        const contentDir = __dirname;
        const definers = fs
            .readdirSync(contentDir)
            .filter((name) => !name.includes(".test."))
            .filter((name) => fs.readFileSync(path.join(contentDir, name), "utf8").includes('pip install "gait-sdk'));
        expect(definers).toEqual(["snippets.js"]);
    });
});

describe("Glossary", () => {
    test("is alphabetical", () => {
        const terms = GLOSSARY.map(([term]) => term);
        expect(terms).toEqual([...terms].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));
    });

    test.each(GLOSSARY.map(([term, , target]) => [term, target]))("%s links to a real page (and section): %s", async (term, target) => {
        const [slug, section] = target.split("#");
        expect(findDocPage(slug)).not.toBeNull();
        if (!section) return;
        renderDoc(slug);
        // eslint-disable-next-line testing-library/no-node-access -- a link's #fragment targets an element id
        expect(document.getElementById(section)).not.toBeNull();
        await settleDiagrams();
    });

    test("each term links with the page's title", () => {
        renderDoc("glossary");
        // eslint-disable-next-line testing-library/no-node-access -- glossary links target an element id
        const entry = document.getElementById("term-site-facility");
        expect(within(entry).getByRole("link", { name: "Teams, roles & invites" })).toHaveAttribute(
            "href",
            "/docs/teams-roles-and-invites#sites-inside-an-org"
        );
    });
});

describe("Automated security response", () => {
    // Internal vocabulary that must never appear on this page.
    const INTERNAL_TERMS = [
        "agent0",
        "b-agent",
        "commander",
        "investigator",
        "red team",
        "validator",
        "deployer",
        "principal",
        "capability",
        "openai",
        "heroku",
        "/api/",
    ];

    test("has no status badges and no internal names", async () => {
        renderDoc("automated-security-response");
        // eslint-disable-next-line testing-library/no-node-access -- no status badge element may exist on this page
        expect(document.querySelector(".doc-status")).toBeNull();
        const text = screen.getByRole("article").textContent.toLowerCase();
        expect(INTERNAL_TERMS.filter((term) => text.includes(term))).toEqual([]);
        expect(screen.getByText(/They don't investigate, change or deploy your software\./)).toBeInTheDocument();
        await settleDiagrams();
    });
});

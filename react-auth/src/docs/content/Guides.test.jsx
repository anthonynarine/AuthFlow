import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DocsPage } from "../DocsPage";
import { DOC_GROUPS } from "../manifest";

function renderDoc(slug) {
    return render(
        <MemoryRouter initialEntries={[`/docs/${slug}`]}>
            <Routes>
                <Route path="/docs/:slug" element={<DocsPage />} />
            </Routes>
        </MemoryRouter>
    );
}

// Let the (mocked) mermaid chunk load and every diagram settle.
async function settleDiagrams() {
    // eslint-disable-next-line testing-library/no-node-access -- diagram load state lives on an aria-hidden canvas
    await waitFor(() => expect(document.querySelector('[data-status="loading"]')).toBeNull());
}

function section(name) {
    return screen.getByRole("heading", { level: 2, name }).closest("section");
}

beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
    delete Element.prototype.scrollIntoView;
});

test("each guide sits next to the page it builds on", () => {
    const guides = DOC_GROUPS.find((group) => group.title === "Guides").pages.map((page) => page.slug);
    expect(guides).toEqual([
        "getting-started",
        "local-to-production",
        "security-checks-and-findings",
        "handle-a-finding",
        "teams-roles-and-invites",
        "applications-and-connection-keys",
        "rotate-a-connection-key",
        "product-organizations-and-invites",
    ]);
});

describe("Handle a finding", () => {
    test("states the note rule, the two actions, and what a repeat FAIL does to each state", () => {
        renderDoc("handle-a-finding");
        expect(screen.getByText("Live", { selector: ".doc-status" })).toBeInTheDocument();
        const actions = within(screen.getByRole("table", { name: "Actions on a finding" }));
        expect(actions.getByRole("rowheader", { name: "Acknowledge" })).toBeInTheDocument();
        expect(actions.getByText("Open or Acknowledged")).toBeInTheDocument();
        expect(within(section("Decide what to do")).getByText(/10 to 2,000 characters/)).toBeInTheDocument();

        const repeat = within(screen.getByRole("table", { name: "A new FAIL, by the finding's state" }));
        expect(repeat.getByText(/Stays accepted/)).toBeInTheDocument();
        expect(repeat.getByText(/Opens again/)).toBeInTheDocument();
    });
});

describe("Rotate a connection key", () => {
    test("four steps in order, and a restart after changing the key", () => {
        renderDoc("rotate-a-connection-key");
        const steps = screen
            .getAllByRole("heading", { level: 2 })
            .map((heading) => heading.textContent)
            .filter((text) => /^\d\./.test(text));
        expect(steps).toEqual([
            "1. Issue the new key",
            "2. Deploy it",
            "3. Check Last used",
            "4. Revoke the old key",
        ]);
        expect(section("2. Deploy it")).toHaveTextContent(/reads GAIT_APPLICATION_CREDENTIAL once, when your process starts/);
    });
});

describe("Go from local to production", () => {
    test("only the key differs between environments", () => {
        renderDoc("local-to-production");
        const table = within(screen.getByRole("table", { name: "Settings per environment" }));
        expect(table.getByText(/the same everywhere/)).toBeInTheDocument();
        expect(table.getByText("the key of acme-api · production")).toBeInTheDocument();
    });
});

describe("Your product's organizations & invites", () => {
    test("is early access, and never implies the product can see email confirmation", () => {
        renderDoc("product-organizations-and-invites");
        expect(screen.getByText("Early access", { selector: ".doc-status" })).toBeInTheDocument();
        expect(within(section("What Gait gives your product")).getByText(/whether the email is confirmed/)).toBeInTheDocument();
        expect(within(section("Joining: the link, and the email")).getByText(/only safe/)).toBeInTheDocument();
    });
});

describe("corrections to existing pages", () => {
    test("a leaked key is revoked first; new keys need an active application", () => {
        renderDoc("applications-and-connection-keys");
        const leak = within(section("If a key leaks"));
        expect(leak.getAllByRole("listitem")[0]).toHaveTextContent("Revoke the leaked key.");
        expect(leak.getByText(/New keys can only be issued while the\s+application is active/)).toBeInTheDocument();
    });

    test("a PASS that didn't close a finding points at real causes", () => {
        renderDoc("troubleshooting");
        const row = screen.getByRole("row", { name: /A PASS didn't close a finding/ });
        expect(row).toHaveTextContent(/another application's key or another environment/);
        expect(row).not.toHaveTextContent(/Gait-verified/);
    });

    test("the findings page describes only what customers see", async () => {
        renderDoc("security-checks-and-findings");
        expect(screen.queryByText(/cases/)).not.toBeInTheDocument();
        expect(screen.getByText(/the same finding\s+opens again/, { selector: "li" })).toBeInTheDocument();
        await settleDiagrams();
    });
});

import "@testing-library/jest-dom";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DocsPage } from "../DocsPage";
import { DOC_GROUPS, findDocPage } from "../manifest";
import { FEATURE_INFO, FEATURE_STATUS, STATUS_LABELS } from "../featureStatus";
import { CHANGELOG } from "../changelog";
import { SECURITY_CONTACT } from "./ReportAVulnerability";

function renderDoc(slug) {
    return render(
        <MemoryRouter initialEntries={[`/docs/${slug}`]}>
            <Routes>
                <Route path="/docs/:slug" element={<DocsPage />} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
    delete Element.prototype.scrollIntoView;
});

test("Security & trust and Help groups hold the new pages", () => {
    const slugsOf = (title) => DOC_GROUPS.find((group) => group.title === title).pages.map((page) => page.slug);
    expect(slugsOf("Security & trust")).toEqual([
        "how-gait-protects-your-data",
        "report-a-vulnerability",
        "automated-security-response",
    ]);
    expect(slugsOf("Help")).toEqual(["faq", "whats-live"]);
});

describe("What's live & changelog", () => {
    test("every status key has a description, and every description has a status", () => {
        expect(Object.keys(FEATURE_INFO).sort()).toEqual(Object.keys(FEATURE_STATUS).sort());
        for (const info of Object.values(FEATURE_INFO)) {
            expect(findDocPage(info.doc.split("#")[0])).not.toBeNull();
        }
    });

    test("the status table is read from featureStatus.js, so flipping a key flips the page", () => {
        const original = FEATURE_STATUS.productSignIn;
        try {
            FEATURE_STATUS.productSignIn = "live";
            renderDoc("whats-live");
            const table = screen.getByRole("table", { name: "What's live" });
            const row = within(table).getByRole("row", { name: new RegExp(FEATURE_INFO.productSignIn.name) });
            expect(row).toHaveTextContent(STATUS_LABELS.live);
            expect(within(table).getAllByRole("row")).toHaveLength(Object.keys(FEATURE_STATUS).length + 1);
        } finally {
            FEATURE_STATUS.productSignIn = original;
        }
    });

    test("changelog entries are newest first, use real status keys and link to real pages", () => {
        const dates = CHANGELOG.map((entry) => entry.date);
        expect([...dates].sort().reverse()).toEqual(dates);
        CHANGELOG.flatMap((entry) => entry.features).forEach((key) => expect(FEATURE_STATUS).toHaveProperty(key));
        CHANGELOG.filter((entry) => entry.doc).forEach((entry) =>
            expect(findDocPage(entry.doc.split("#")[0])).not.toBeNull()
        );
        renderDoc("whats-live");
        expect(within(screen.getByRole("table", { name: "Changelog" })).getAllByRole("row")).toHaveLength(
            CHANGELOG.length + 1
        );
    });
});

describe("Report a vulnerability", () => {
    test("the Gait contact is exactly the confirmed address, as a mailto link", () => {
        expect(SECURITY_CONTACT).toBe("security@gaitobservatory.com");
        renderDoc("report-a-vulnerability");
        expect(screen.getByRole("link", { name: "security@gaitobservatory.com" })).toHaveAttribute(
            "href",
            "mailto:security@gaitobservatory.com"
        );
        expect(screen.queryByTestId("security-contact-pending")).not.toBeInTheDocument();
        expect(screen.queryByText(/isn't published yet/)).not.toBeInTheDocument();
        // It's the only address on the page.
        const mailtos = screen
            .getAllByRole("link")
            .map((link) => link.getAttribute("href"))
            .filter((href) => href.startsWith("mailto:"));
        expect(mailtos).toEqual(["mailto:security@gaitobservatory.com"]);
        expect(screen.getByRole("link", { name: "gait-sdk security policy" })).toHaveAttribute(
            "href",
            "https://github.com/anthonynarine/gait-sdk/blob/main/docs/SECURITY.md"
        );
    });
});

describe("How Gait protects your data", () => {
    test("claims only what's true today", () => {
        renderDoc("how-gait-protects-your-data");
        const text = document.body.textContent;
        // Not every secret is hashed. SEC1 (live): only the two-step secret is
        // claimed as encrypted, HTTPS is enforced; no HSTS name or duration, no
        // key-management detail, no compliance names. See D-TRUST, D-2FA, D-SEC1.
        expect(text).not.toMatch(/every (secret|token)|all (secrets|tokens)|HSTS|HIPAA|SOC ?2|Fernet|AES|key rotation/i);
        expect(text.match(/encrypt/gi)).toHaveLength(1);
        expect(text).toMatch(/Two-step verification secrets are encrypted in Gait's database\./);
        expect(text).toMatch(/only work over HTTPS/);
        expect(text).not.toMatch(/\b\d+\s*(minutes?|hours?|days?|attempts?)\b/i);
        expect(text).toMatch(/signs you out everywhere/);
        expect(text).toMatch(/password-reset link/);
    });
});

describe("FAQ", () => {
    test("every answer links to the page that explains it", () => {
        renderDoc("faq");
        // eslint-disable-next-line testing-library/no-node-access -- each dd's own link is what's checked
        const answers = Array.from(document.querySelectorAll(".docs-article dd"));
        expect(answers.length).toBeGreaterThan(10);
        answers.forEach((answer) => expect(within(answer).getAllByRole("link").length).toBeGreaterThan(0));
    });
});

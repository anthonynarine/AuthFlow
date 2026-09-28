import "@testing-library/jest-dom";
import React from "react";
import fs from "fs";
import path from "path";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DocsPage } from "../DocsPage";
import { DOC_GROUPS } from "../manifest";
import { SDK_VERSION, VERIFY_USER_SETTINGS } from "./snippets";

function renderSdkPage() {
    return render(
        <MemoryRouter initialEntries={["/docs/gait-sdk"]}>
            <Routes>
                <Route path="/docs/:slug" element={<DocsPage />} />
            </Routes>
        </MemoryRouter>
    );
}

// jsdom has no innerText; read a section's text by its heading.
function section(name) {
    return screen.getByRole("heading", { level: 2, name }).closest("section");
}

beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
    delete Element.prototype.scrollIntoView;
});

describe("gait-sdk page", () => {
    test("opens the For developers group, with Connecting your software after it", () => {
        const group = DOC_GROUPS.find((entry) => entry.title === "For developers");
        expect(group.pages.map((page) => page.slug)).toEqual(["gait-sdk", "connecting-your-software"]);
        expect(DOC_GROUPS.find((entry) => entry.title === "Guides").pages.map((page) => page.slug)).not.toContain(
            "connecting-your-software"
        );
    });

    test("every install line is pinned to the current version", () => {
        renderSdkPage();
        const install = section("Install").textContent;
        const lines = install.match(/pip install [^#\n]+/g);
        expect(lines).toHaveLength(3);
        lines.forEach((line) => expect(line).toContain(`==${SDK_VERSION}"`));
        expect(install).toContain(`gait-sdk[fastapi]==${SDK_VERSION}`);
    });

    test("reporting checks is Live, verifying users is Early access", () => {
        renderSdkPage();
        const badge = { selector: ".doc-status" };
        expect(within(section("Report a security check")).getByText("Live", badge)).toBeInTheDocument();
        expect(within(section("Verify a user")).getByText("Early access", badge)).toBeInTheDocument();
        expect(within(section("Verify a user")).queryByText("Live", badge)).not.toBeInTheDocument();
        expect(within(section("Verify a user")).getByRole("link", { name: "Request early access" })).toHaveAttribute(
            "href",
            "/early-access"
        );
    });

    test("the verify snippet uses the SDK's default mode, which needs only GAIT_AUTH_URL", () => {
        // Production Gait publishes no signing keys yet, so jwks mode can't verify its tokens.
        expect(VERIFY_USER_SETTINGS).toContain('GAIT_AUTH_URL = "https://api.gaitobservatory.com/api"');
        expect(VERIFY_USER_SETTINGS).not.toMatch(/GAIT_TOKEN_VERIFIER|jwks|GAIT_AUDIENCE|GAIT_ISSUER/i);
    });

    test("the full reference links out to the package, not a copy", () => {
        renderSdkPage();
        const links = within(section("Full reference"))
            .getAllByRole("link")
            .map((link) => link.getAttribute("href"));
        expect(links).toEqual([
            "https://github.com/anthonynarine/gait-sdk#readme",
            "https://github.com/anthonynarine/gait-sdk/blob/main/docs/CHANGELOG.md",
            "https://github.com/anthonynarine/gait-sdk/blob/main/docs/SECURITY.md",
            "https://github.com/anthonynarine/gait-sdk/tree/main/examples",
        ]);
    });
});

describe("Netlify redirects for retired pages", () => {
    const rules = fs
        .readFileSync(path.join(__dirname, "..", "..", "..", "public", "_redirects"), "utf8")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => line.split(/\s+/));

    test.each([
        ["/developers", "/docs/gait-sdk"],
        ["/architecture", "/docs/automated-security-response"],
    ])("%s is a 301 to %s, ahead of the SPA fallback", (from, to) => {
        const index = rules.findIndex(([source]) => source === from);
        expect(rules[index]).toEqual([from, to, "301"]);
        expect(index).toBeLessThan(rules.findIndex(([source]) => source === "/*"));
    });
});

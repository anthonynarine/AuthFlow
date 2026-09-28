import "@testing-library/jest-dom";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DocsPage } from "../DocsPage";
import { FEATURE_STATUS } from "../featureStatus";
import { GLOSSARY } from "./Glossary";

function renderDoc(slug) {
    return render(
        <MemoryRouter initialEntries={[`/docs/${slug}`]}>
            <Routes>
                <Route path="/docs/:slug" element={<DocsPage />} />
            </Routes>
        </MemoryRouter>
    );
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

describe("Two-step verification guide", () => {
    test("is Live, from featureStatus.js", () => {
        expect(FEATURE_STATUS.twoStepVerification).toBe("live");
        renderDoc("two-step-verification");
        expect(screen.getByText("Live", { selector: ".doc-status" })).toBeInTheDocument();
    });

    test("turning it on is four steps, ending with 10 recovery codes shown once", () => {
        renderDoc("two-step-verification");
        const steps = within(section("Turn it on")).getAllByRole("listitem");
        expect(steps).toHaveLength(4);
        ["Before you start.", "Scan the code.", "Confirm a code.", "Save your recovery codes."].forEach((title, i) =>
            expect(steps[i].textContent.startsWith(title)).toBe(true)
        );
        expect(steps[3]).toHaveTextContent(/You get 10\..*only time Gait shows them/);
    });

    test("uses the sign-in screen's own words for a lost phone and a timed-out sign-in", () => {
        renderDoc("two-step-verification");
        expect(section("Lost your phone?")).toHaveTextContent("Lost your phone? Use a recovery code");
        expect(section("Signing in with a code")).toHaveTextContent("That sign-in timed out");
        expect(within(section("Lost your phone?")).getByRole("link", { name: "contact us" })).toHaveAttribute(
            "href",
            "/send-email"
        );
    });

    test("doesn't promise more than today's behaviour", () => {
        renderDoc("two-step-verification");
        const text = document.body.textContent;
        // Confirm-it's-you only asks when your sign-in isn't recent (until backend H6), and
        // there's no staff recovery service or encrypted-secret claim to make.
        expect(text).toMatch(/if you haven't signed in recently/);
        expect(text).not.toMatch(/always asks|encrypt|within \d+ (hours?|days?)/i);
    });
});

describe("pages updated for two-step verification", () => {
    test("Troubleshooting covers codes, a lost phone, a timed-out sign-in and reset links", () => {
        renderDoc("troubleshooting");
        for (const problem of [
            /two-step code isn't accepted/,
            /lost your phone/,
            /That sign-in timed out/,
            /This reset link can't be used/,
            /new password isn't accepted/,
        ]) {
            expect(screen.getByRole("row", { name: problem })).toBeInTheDocument();
        }
    });

    test("the glossary defines two-step verification and recovery codes", () => {
        const terms = GLOSSARY.map(([term]) => term);
        expect(terms).toEqual(expect.arrayContaining(["Two-step verification", "Recovery code"]));
    });

    test("People and applications mentions the code and Sign out everywhere", () => {
        renderDoc("people-and-applications");
        expect(screen.getByRole("row", { name: /Credential/ })).toHaveTextContent(/a code, if two-step verification is on/);
        expect(screen.getByRole("row", { name: /If compromised/ })).toHaveTextContent(/Sign out everywhere/);
    });
});

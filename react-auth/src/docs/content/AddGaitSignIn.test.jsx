import "@testing-library/jest-dom";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DocsPage } from "../DocsPage";
import { FEATURE_INFO, FEATURE_STATUS } from "../featureStatus";
import { GLOSSARY } from "./Glossary";
import { SERVER_REFRESH_SIGN_OUT, SERVER_SIGN_IN, VERIFY_USER_SETTINGS } from "./snippets";

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

describe("Add Gait sign-in to an app", () => {
    test("is Early access, from featureStatus.js, and is where productSignIn points", () => {
        expect(FEATURE_STATUS.productSignIn).toBe("earlyAccess");
        expect(FEATURE_INFO.productSignIn.doc).toBe("add-gait-sign-in");
        renderDoc("add-gait-sign-in");
        expect(screen.getAllByText("Early access", { selector: ".doc-status" }).length).toBeGreaterThan(0);
        expect(screen.queryByText("Live", { selector: ".doc-status" })).not.toBeInTheDocument();
        // GAIT-13: no buyer call to action.
        expect(screen.queryByRole("link", { name: /early access/i })).not.toBeInTheDocument();
    });

    test("frames the gaps as what Gait sets up, including server sign-in limits", () => {
        renderDoc("add-gait-sign-in");
        const setUp = section("What gets set up on Gait's side");
        expect(setUp).toHaveTextContent("Early access: these are set up on Gait's side for each app:");
        expect(setUp).toHaveTextContent(/Sign-in limits for the app's server/);
        expect(setUp).toHaveTextContent(/Signing in from the browser/);
        expect(setUp).toHaveTextContent(/links open Gait's pages/);
    });

    test("documents server-side sign-in, with the 2FA temp_token kept on the server", () => {
        expect(SERVER_SIGN_IN).toContain('"https://api.gaitobservatory.com/api"');
        expect(SERVER_SIGN_IN).toMatch(/login\/.*two-factor-login\//s);
        expect(SERVER_SIGN_IN).toContain('cookies={"temp_token": temp_token}');
        expect(SERVER_REFRESH_SIGN_OUT).toContain("token-refresh/");
        expect(SERVER_REFRESH_SIGN_OUT).toContain("logout/");
        renderDoc("add-gait-sign-in");
        expect(section("Two-step verification")).toHaveTextContent(/10 minutes and works once/);
        expect(section("Stay signed in, and sign out")).toHaveTextContent(/Save both tokens/);
    });

    test("the API half: default verifier, 401 vs 503, the 45 s cache and require_live_session", () => {
        expect(VERIFY_USER_SETTINGS).not.toMatch(/GAIT_TOKEN_VERIFIER|jwks/i);
        renderDoc("add-gait-sign-in");
        const api = section("The app's API checks every request");
        expect(api).toHaveTextContent(/401/);
        expect(api).toHaveTextContent(/503/);
        expect(api).toHaveTextContent(/up to 45 seconds/);
        expect(api).toHaveTextContent(/require_live_session/);
        expect(within(api).getByRole("complementary", { name: "The connection key isn't part of sign-in" })).toBeInTheDocument();
    });

    test("shows both ways to link people, and says to use the app's own roles", () => {
        renderDoc("add-gait-sign-in");
        const link = section("Link Gait people to the app's users");
        expect(link).toHaveTextContent(/Create on first sign-in/);
        expect(link).toHaveTextContent(/get_or_create/);
        expect(link).toHaveTextContent(/Invite only/);
        expect(within(link).getByRole("complementary", { name: "Use the app's own roles" })).toHaveTextContent(
            /Don't grant access from Gait's role field/
        );
    });

    test("has a sequence diagram with a text description", () => {
        renderDoc("add-gait-sign-in");
        expect(section("How it fits together")).toHaveTextContent(/remembering the answer for up to 45 seconds/);
    });

    test("doesn't claim what isn't true yet", () => {
        renderDoc("add-gait-sign-in");
        const text = document.body.textContent;
        expect(text).not.toMatch(/hosted sign-in|sign-in page hosted|audience|jwks|email_verified|your own brand/i);
        expect(text).not.toMatch(/confirmed email|email is confirmed/i);
    });
});

describe("pages that point to it", () => {
    test("gait-sdk's Verify a user links here instead of repeating the setup", () => {
        renderDoc("gait-sdk");
        const verify = section("Verify a user");
        expect(within(verify).getByRole("link", { name: "Add Gait sign-in to an app" })).toHaveAttribute(
            "href",
            "/docs/add-gait-sign-in"
        );
        expect(verify).not.toHaveTextContent(/INSTALLED_APPS|verified_identity/);
    });

    test("Product organizations links here", () => {
        renderDoc("product-organizations-and-invites");
        expect(
            within(section("What Gait gives the app")).getByRole("link", { name: "Add Gait sign-in to an app" })
        ).toHaveAttribute("href", "/docs/add-gait-sign-in");
    });

    test("the FAQ links here", () => {
        renderDoc("faq");
        expect(
            within(section("Lumen's users")).getByRole("link", { name: "Add Gait sign-in to an app" })
        ).toHaveAttribute("href", "/docs/add-gait-sign-in");
    });

    test("the glossary defines Subject", () => {
        expect(GLOSSARY.map(([term]) => term)).toContain("Subject");
    });
});

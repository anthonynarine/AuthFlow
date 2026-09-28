import "@testing-library/jest-dom";
import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "../App";
import { RouteTitle } from "../app/RouteTitle";
import { DocsPage } from "./DocsPage";
import { DOC_PAGES, docTitle } from "./manifest";

// Record every HTTP call the app's axios clients would make (real axios is ESM,
// which this Jest setup can't load). Docs pages must never make one.
const mockAxiosCalls = [];
jest.mock("axios", () => {
    const record = (method) => (...args) => {
        mockAxiosCalls.push([method, ...args]);
        return Promise.reject(new Error("no network in tests"));
    };
    const makeInstance = () => {
        const instance = record("request");
        ["request", "get", "post", "put", "patch", "delete", "head", "options"].forEach((method) => {
            instance[method] = record(method);
        });
        instance.defaults = { headers: { common: {} } };
        instance.interceptors = { request: { use: () => 0 }, response: { use: () => 0 } };
        return instance;
    };
    const axios = makeInstance();
    axios.create = () => makeInstance();
    axios.isAxiosError = () => false;
    return { __esModule: true, default: axios };
});

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname + location.hash}</div>;
}

function renderDocs(path) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <RouteTitle />
            <Routes>
                <Route path="/docs/:slug" element={<DocsPage />} />
            </Routes>
            <LocationProbe />
        </MemoryRouter>
    );
}

// Let the (mocked) mermaid chunk load and every diagram settle.
async function settleDiagrams() {
    // eslint-disable-next-line testing-library/no-node-access -- diagram load state lives on an aria-hidden canvas
    await waitFor(() => expect(document.querySelector('[data-status="loading"]')).toBeNull());
}

let scrollIntoView;

beforeEach(() => {
    scrollIntoView = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
    delete Element.prototype.scrollIntoView;
});

describe("docs pages", () => {
    test.each(DOC_PAGES.map((page) => [page.slug, page]))("/docs/%s renders with its own title", async (slug, page) => {
        renderDocs(`/docs/${slug}`);
        expect(screen.getByRole("heading", { level: 1, name: page.title })).toBeInTheDocument();
        expect(document.title).toBe(docTitle(page));
        await settleDiagrams();
    });

    test("an unknown page says so, without an error or redirect", () => {
        renderDocs("/docs/no-such-page");
        expect(screen.getByRole("heading", { level: 1, name: "This page doesn't exist" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Start from the beginning" })).toHaveAttribute("href", "/docs");
        expect(document.title).toBe("Gait Docs");
        expect(screen.getByTestId("location")).toHaveTextContent("/docs/no-such-page");
    });

    test("'On this page' lists every section and each link targets a real heading", async () => {
        renderDocs("/docs/teams-roles-and-invites");
        const toc = await screen.findByRole("navigation", { name: "On this page" });
        const links = within(toc).getAllByRole("link");
        const sectionHeadings = screen.getAllByRole("heading", { level: 2 });
        expect(links).toHaveLength(sectionHeadings.length);
        const headingIds = sectionHeadings.map((heading) => heading.id);
        links.forEach((link) => {
            expect(headingIds).toContain(link.getAttribute("href").slice(1));
        });
        await settleDiagrams();
    });

    test("a #section link scrolls to that section", async () => {
        renderDocs("/docs/troubleshooting#joining-and-access");
        const heading = screen.getByRole("heading", { level: 2, name: "Joining and access" });
        await waitFor(() => expect(scrollIntoView.mock.instances).toContain(heading));
    });

    test.each([
        ["getting-started", "step-2-create-your-workspace", "step-2-create-your-company", "Step 2: Create your workspace"],
        ["troubleshooting", "signing-in-and-your-workspace", "signing-in-and-your-company", "Signing in and your workspace"],
    ])("renamed section on %s: the new #%s and the old #%s both land on it", async (slug, newId, oldId, title) => {
        const heading = () => screen.getByRole("heading", { level: 2, name: title });

        const { unmount } = renderDocs(`/docs/${slug}#${newId}`);
        expect(heading()).toHaveAttribute("id", newId);
        await waitFor(() => expect(scrollIntoView.mock.instances).toContain(heading()));
        unmount();
        scrollIntoView.mockClear();

        renderDocs(`/docs/${slug}#${oldId}`);
        // The old id sits on an empty anchor immediately before the heading, inside the same section.
        await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
        const [target] = scrollIntoView.mock.instances;
        expect(target).toHaveAttribute("id", oldId);
        // eslint-disable-next-line testing-library/no-node-access -- the alias's position next to the heading is what's under test
        expect(target.nextElementSibling).toBe(heading());
        await settleDiagrams();
    });

    test("the sidebar marks the current page, and next/previous move through the docs in order", async () => {
        const first = DOC_PAGES[0];
        renderDocs(`/docs/${first.slug}`);
        const sidebar = screen.getByRole("navigation", { name: "Documentation" });
        expect(within(sidebar).getByRole("link", { name: first.title })).toHaveAttribute("aria-current", "page");

        const pager = screen.getByRole("navigation", { name: "Previous and next page" });
        expect(within(pager).queryByText("Previous")).toBeNull();
        const second = DOC_PAGES[1];
        fireEvent.click(within(pager).getByRole("link", { name: new RegExp(`Next.*${second.title}`) }));

        expect(screen.getByTestId("location")).toHaveTextContent(`/docs/${second.slug}`);
        const title = screen.getByRole("heading", { level: 1, name: second.title });
        expect(title).toHaveFocus();
        expect(within(sidebar).getByRole("link", { name: second.title })).toHaveAttribute("aria-current", "page");
        await settleDiagrams();
    });

    test("the mobile contents menu opens, and closes after choosing a page", async () => {
        renderDocs("/docs/getting-started");
        // eslint-disable-next-line testing-library/no-node-access -- the native <details> element's open state is what this test checks
        const menu = screen.getByText("Contents").closest("details");
        expect(menu).not.toHaveAttribute("open");

        menu.open = true;
        fireEvent(menu, new Event("toggle"));
        expect(menu).toHaveAttribute("open");

        const mobileNav = screen.getByRole("navigation", { name: "Documentation contents" });
        fireEvent.click(within(mobileNav).getByRole("link", { name: "Troubleshooting" }));

        expect(screen.getByTestId("location")).toHaveTextContent("/docs/troubleshooting");
        expect(menu).not.toHaveAttribute("open");
    });
});

describe("code blocks", () => {
    const originalClipboard = navigator.clipboard;

    afterEach(() => {
        Object.defineProperty(navigator, "clipboard", { value: originalClipboard, configurable: true });
    });

    test("copy puts the code on the clipboard and says so", async () => {
        const writeText = jest.fn(() => Promise.resolve());
        Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
        renderDocs("/docs/connecting-your-software");

        fireEvent.click(screen.getByRole("button", { name: "Copy shell" }));

        await waitFor(() => expect(screen.getByRole("button", { name: "Copy shell" })).toHaveTextContent("Copied"));
        expect(writeText).toHaveBeenCalledWith(expect.stringContaining('pip install "gait-sdk'));
        expect(screen.getByText("Copied to clipboard")).toBeInTheDocument();
    });

    test("when the clipboard is unavailable it says how to copy manually", async () => {
        Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
        renderDocs("/docs/connecting-your-software");

        fireEvent.click(screen.getByRole("button", { name: "Copy python" }));

        expect(await screen.findByText(/Couldn't copy/)).toBeInTheDocument();
    });

    test("a clipboard that never answers is treated as a failure", async () => {
        jest.useFakeTimers();
        try {
            const writeText = jest.fn(() => new Promise(() => {}));
            Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
            renderDocs("/docs/connecting-your-software");

            fireEvent.click(screen.getByRole("button", { name: "Copy shell" }));
            expect(screen.queryByText(/Couldn't copy/)).toBeNull();
            await act(async () => {
                jest.advanceTimersByTime(2000);
            });

            expect(screen.getByText(/Couldn't copy/)).toBeInTheDocument();
        } finally {
            jest.useRealTimers();
        }
    });

    test("example keys are placeholders, never key-shaped values", () => {
        renderDocs("/docs/applications-and-connection-keys");
        expect(document.body.textContent).toContain("GAIT_APPLICATION_CREDENTIAL=<your connection key>");
    });
});

describe("diagrams", () => {
    test("render once mermaid loads, with the description always visible", async () => {
        renderDocs("/docs/people-and-applications");
        expect(
            screen.getByText(/Two people sign in to Gait and belong to the workspace acme/, { selector: "figcaption" })
        ).toBeInTheDocument();
        await settleDiagrams();
        expect(screen.getAllByTestId("mermaid-svg").length).toBeGreaterThan(0);
    });

    test("a diagram that can't render falls back to its description", async () => {
        const mermaid = require("mermaid");
        const spy = jest.spyOn(mermaid, "render").mockRejectedValue(new Error("boom"));
        renderDocs("/docs/security-checks-and-findings");
        expect(await screen.findByText(/The diagram couldn't load/)).toBeInTheDocument();
        expect(screen.getByText(/When your application reports FAIL, Gait opens a finding/)).toBeInTheDocument();
        spy.mockRestore();
    });
});

describe("docs are public", () => {
    let xhrOpen;
    let fetchSpy;

    beforeEach(() => {
        mockAxiosCalls.length = 0;
        xhrOpen = jest.spyOn(XMLHttpRequest.prototype, "open");
        fetchSpy = jest.fn(() => Promise.reject(new Error("no network in docs")));
        window.fetch = fetchSpy;
    });

    afterEach(() => {
        xhrOpen.mockRestore();
        delete window.fetch;
    });

    function renderApp(path) {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        return render(
            <QueryClientProvider client={client}>
                <MemoryRouter initialEntries={[path]}>
                    <App />
                    <LocationProbe />
                </MemoryRouter>
            </QueryClientProvider>
        );
    }

    test("signed out: no session restore, no API call, no redirect to sign-in, on any page", async () => {
        renderApp("/docs/troubleshooting");
        expect(screen.getByRole("heading", { level: 1, name: "Troubleshooting" })).toBeInTheDocument();

        for (const page of DOC_PAGES) {
            const sidebar = screen.getByRole("navigation", { name: "Documentation" });
            fireEvent.click(within(sidebar).getByRole("link", { name: page.title }));
            expect(screen.getByRole("heading", { level: 1, name: page.title })).toBeInTheDocument();
            expect(screen.getByTestId("location")).toHaveTextContent(`/docs/${page.slug}`);
        }
        await settleDiagrams();
        await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

        expect(mockAxiosCalls).toEqual([]);
        expect(xhrOpen).not.toHaveBeenCalled();
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(screen.getByTestId("location")).toHaveTextContent(`/docs/${DOC_PAGES[DOC_PAGES.length - 1].slug}`);
    });

    test.each([
        ["/developers", "gait-sdk", "gait-sdk"],
        ["/architecture", "automated-security-response", "Automated security response"],
    ])("retired page %s redirects to /docs/%s", async (path, slug, title) => {
        renderApp(path);
        expect(screen.getByTestId("location")).toHaveTextContent(`/docs/${slug}`);
        expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
        await settleDiagrams();
    });

    test("/docs opens the first page", async () => {
        renderApp("/docs");
        expect(screen.getByTestId("location")).toHaveTextContent(`/docs/${DOC_PAGES[0].slug}`);
        expect(screen.getByRole("heading", { level: 1, name: DOC_PAGES[0].title })).toBeInTheDocument();
        await settleDiagrams();
        expect(mockAxiosCalls).toEqual([]);
        expect(xhrOpen).not.toHaveBeenCalled();
    });
});

import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DocsPage } from "../DocsPage";

function renderTeams(hash = "") {
    return render(
        <MemoryRouter initialEntries={[`/docs/teams-roles-and-invites${hash}`]}>
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

test("the umbrellas and sites sections exist at the anchors other pages link to", async () => {
    renderTeams("#sites-inside-an-org");

    const umbrellas = screen.getByRole("heading", { level: 2, name: "Who can be under your umbrella" });
    const sites = screen.getByRole("heading", { level: 2, name: "Sites inside an org" });
    expect(umbrellas).toHaveAttribute("id", "two-umbrellas");
    expect(sites).toHaveAttribute("id", "sites-inside-an-org");
    await waitFor(() => expect(Element.prototype.scrollIntoView.mock.instances).toContain(sites));

    expect(screen.getByText(/A connection key can't invite and never makes anyone a member/)).toBeInTheDocument();
    expect(screen.getByText(/Gait knows nothing about sites; the product enforces all of it/)).toBeInTheDocument();
    expect(screen.getByText(/Finished work from both sites is visible across the whole organization/)).toBeInTheDocument();

    // eslint-disable-next-line testing-library/no-node-access -- diagram load state lives on an aria-hidden canvas
    await waitFor(() => expect(document.querySelector('[data-status="loading"]')).toBeNull());
});

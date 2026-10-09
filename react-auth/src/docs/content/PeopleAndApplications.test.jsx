import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DocsPage } from "../DocsPage";

function renderPeople() {
    return render(
        <MemoryRouter initialEntries={["/docs/people-and-applications"]}>
            <Routes>
                <Route path="/docs/:slug" element={<DocsPage />} />
            </Routes>
        </MemoryRouter>
    );
}

// Let the (mocked) mermaid chunk load and the page's other diagrams settle.
async function settleDiagrams() {
    // eslint-disable-next-line testing-library/no-node-access -- diagram load state lives on an aria-hidden canvas
    await waitFor(() => expect(document.querySelector('[data-status="loading"]')).toBeNull());
}

function joinLesson() {
    return screen.getByRole("figure", { name: /A person creates an account and confirms their email/ });
}

beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
    delete Element.prototype.scrollIntoView;
});

describe("How a person joins", () => {
    test("labels every lane, every message and both branches of the fork", async () => {
        renderPeople();
        const lesson = joinLesson();
        const lanes = within(lesson).getByRole("list", { name: "Lanes" });
        expect(within(lanes).getAllByRole("listitem").map((lane) => lane.textContent)).toEqual([
            "Person",
            "Gait console",
            "Gait",
        ]);

        const spine = within(lesson).getByRole("list", { name: "Every account: steps 1 to 5" });
        expect(within(spine).getAllByRole("listitem")).toHaveLength(5);
        expect(within(spine).getByText("Create an account (email + password)")).toBeInTheDocument();
        expect(within(spine).getAllByText("Person → Gait console")).toHaveLength(2);
        expect(within(spine).getByText("Gait → Person")).toBeInTheDocument();

        const newCompany = within(lesson).getByRole("list", { name: "A · Start a new workspace" });
        expect(within(newCompany).getByText("You are its Owner")).toBeInTheDocument();
        const invited = within(lesson).getByRole("list", { name: "B · Invited to an existing workspace" });
        expect(
            within(invited).getByText("Open the invite link, signed in as the invited email, and choose Join")
        ).toBeInTheDocument();
        await settleDiagrams();
    });

    test("steps through the spine, then one branch of the fork at a time", async () => {
        renderPeople();
        const lesson = joinLesson();
        const next = within(lesson).getByRole("button", { name: "Next" });
        expect(within(lesson).getByText("Step 1 of 7")).toBeInTheDocument();
        expect(within(lesson).getByRole("button", { name: "Back" })).toBeDisabled();

        fireEvent.click(next);
        const live = () => within(lesson).getAllByRole("listitem").filter((item) => item.getAttribute("aria-current") === "step");
        expect(live().map((item) => within(item).getByText(/^\d$/).textContent)).toEqual(["1", "2"]);

        fireEvent.click(within(lesson).getByRole("button", { name: "Step 5: Fork A · Start a new workspace" }));
        expect(live().map((item) => within(item).getByText(/^\d$/).textContent)).toEqual(["6", "7"]);

        fireEvent.click(next);
        expect(within(lesson).getByText("Fork B · Invited to an existing workspace")).toBeInTheDocument();
        expect(live().map((item) => within(item).getByText(/^\d$/).textContent)).toEqual(["8", "9"]);

        fireEvent.click(next);
        expect(within(lesson).getByText(/An account is not membership\./)).toBeInTheDocument();
        expect(next).toBeDisabled();
        await settleDiagrams();
    });
});

describe("How an application gets its key", () => {
    function keyLesson() {
        return screen.getByRole("figure", { name: /An Owner or Admin adds an application/ });
    }

    function liveNumbers(lesson) {
        return within(lesson)
            .getAllByRole("listitem")
            .filter((item) => item.getAttribute("aria-current") === "step")
            .map((item) => within(item).getByText(/^\d$/).textContent);
    }

    test("labels all four lanes, the set-up steps and the loop", async () => {
        renderPeople();
        const lesson = keyLesson();
        const lanes = within(lesson).getByRole("list", { name: "Lanes" });
        expect(within(lanes).getAllByRole("listitem").map((lane) => lane.textContent)).toEqual([
            "Owner or Admin",
            "Gait console",
            "Gait",
            "The app's backend",
        ]);

        const setUp = within(lesson).getByRole("list", { name: "Set up once: steps 1 to 4" });
        expect(within(setUp).getAllByRole("listitem")).toHaveLength(4);
        expect(within(setUp).getByText("Key shown once (Gait keeps only a fingerprint)")).toBeInTheDocument();
        expect(within(setUp).getByText("Owner or Admin → The app's backend")).toBeInTheDocument();

        const loop = within(lesson).getByRole("list", { name: "Loop · whenever the app's backend runs its checks" });
        expect(within(loop).getByText("The app's backend → Gait")).toBeInTheDocument();
        expect(within(loop).getByText("Recorded for lumen / lumen-api / production")).toBeInTheDocument();
        await settleDiagrams();
    });

    test("steps through set-up one message at a time, then plays the loop", async () => {
        renderPeople();
        const lesson = keyLesson();
        const next = within(lesson).getByRole("button", { name: "Next" });
        expect(within(lesson).getByText("Step 1 of 7")).toBeInTheDocument();

        fireEvent.click(next);
        expect(liveNumbers(lesson)).toEqual(["1"]);

        fireEvent.click(within(lesson).getByRole("button", { name: "Step 4: Shown exactly once" }));
        expect(liveNumbers(lesson)).toEqual(["3"]);
        expect(within(lesson).getByText(/nobody, including Gait, can show it again/)).toBeInTheDocument();

        fireEvent.click(within(lesson).getByRole("button", { name: "Step 6: Whenever the app's backend runs its checks" }));
        expect(liveNumbers(lesson)).toEqual(["5", "6"]);

        fireEvent.click(next);
        expect(within(lesson).getByText(/People set up; software reports\./)).toBeInTheDocument();
        expect(next).toBeDisabled();
        await settleDiagrams();
    });
});

import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SendEmail } from "./SendEmail";
import { publicAxios } from "../../interceptors/axios";

jest.mock("../../interceptors/axios", () => ({
    publicAxios: { post: jest.fn() },
}));

function renderPage() {
    return render(
        <MemoryRouter>
            <SendEmail />
        </MemoryRouter>
    );
}

function fill({ email = "sam@example.com", subject = "Hello", message = "A question about Gait." } = {}) {
    fireEvent.change(screen.getByLabelText("Your email"), { target: { value: email } });
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: subject } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: message } });
}

beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
});

test("every field is labelled, required and capped at the server's limit", () => {
    renderPage();
    expect(screen.getByLabelText("Your email")).toHaveAttribute("maxLength", "254");
    expect(screen.getByLabelText("Subject")).toHaveAttribute("maxLength", "200");
    expect(screen.getByLabelText("Message")).toHaveAttribute("maxLength", "5000");
    ["Your email", "Subject", "Message"].forEach((label) => expect(screen.getByLabelText(label)).toBeRequired());
});

test("a field of only spaces isn't sent", () => {
    renderPage();
    fill({ subject: "   " });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please fill in: Subject.");
    expect(publicAxios.post).not.toHaveBeenCalled();
});

test("sends trimmed values and confirms on the page, not in a browser dialog", async () => {
    publicAxios.post.mockResolvedValueOnce({ data: { message: "Email sent successfully" } });
    renderPage();
    fill({ subject: "  Hello  " });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("status")).toHaveTextContent("your message was sent");
    expect(publicAxios.post).toHaveBeenCalledWith("/mail/send-email/", {
        reply_to: "sam@example.com",
        subject: "Hello",
        content: "A question about Gait.",
    });
    expect(window.alert).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Subject")).toHaveValue("");
});

test("shows the server's error instead of failing silently", async () => {
    publicAxios.post.mockRejectedValueOnce({
        response: {
            status: 400,
            data: { error: "subject must be at most 200 characters", field: "subject", max_length: 200 },
        },
    });
    renderPage();
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Subject is too long: keep it to 200 characters.");
});

test("the page's email link is Gait's own inbox", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "security@gaitobservatory.com" })).toHaveAttribute(
        "href",
        "mailto:security@gaitobservatory.com"
    );
    expect(document.body.textContent).not.toMatch(/anjin/i);
});

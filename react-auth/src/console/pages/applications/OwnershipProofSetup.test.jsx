import React, { useState } from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HostingChoices, OwnershipProofSetup, buildProofHandoff, frontendOriginFeedback } from "./OwnershipProofSetup";

const challenge = { method: "https-well-known", url: "https://moneta.example.test/.well-known/gait-domain-verification", content: 'public-proof\n"quoted"', expires_at: "2099-01-01T00:00:00Z" };
const registration = { status: "pending", login_origin: "https://moneta.example.test", ownership_challenge: challenge };
const originalClipboard = navigator.clipboard;
function Harness({ data = registration, onVerify = jest.fn(), onChallenge = jest.fn(), dirty = false }) {
    const [layout, setLayout] = useState("separate");
    const [awsType, setAwsType] = useState("static");
    const [hosting, setHosting] = useState("netlify");
    return <><HostingChoices {...{ layout, setLayout, hosting, setHosting, awsType, setAwsType }} /><OwnershipProofSetup {...{ data, layout, hosting, awsType, onVerify, onChallenge, dirty }} pending={false} active /></>;
}
beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: jest.fn().mockResolvedValue() } });
});
afterEach(() => {
    jest.useRealTimers();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: originalClipboard });
    jest.restoreAllMocks();
});

test("manual Netlify proof copies exact body and uses the server's frontend destination", async () => {
    render(<Harness />);
    expect(screen.getByText(challenge.url)).toBeInTheDocument();
    expect(screen.getByText("public/.well-known/gait-domain-verification")).toBeInTheDocument();
    expect(screen.getByText(/Publish proof on the frontend login host/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy proof content" }));
    await screen.findByText("Copied public ownership-proof instructions.");
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(challenge.content);
    fireEvent.change(screen.getByLabelText("Where is the frontend hosted?"), { target: { value: "vercel" } });
    expect(screen.getByRole("button", { name: "Download static proof file" })).toBeEnabled();
});

test("AI handoff quotes URL and multiline proof safely and does not invent deployment or verification", async () => {
    const onVerify = jest.fn();
    render(<Harness onVerify={onVerify} />);
    fireEvent.change(screen.getByLabelText("How will you publish the proof?"), { target: { value: "assisted" } });
    const handoff = screen.getByRole("textbox", { name: "Developer or AI proof handoff" });
    expect(handoff).toHaveValue(buildProofHandoff({ challenge, hosting: "netlify", layout: "separate" }));
    expect(handoff.value).toContain(`Exact destination URL: ${JSON.stringify(challenge.url)}`);
    expect(handoff.value).toContain(`Exact UTF-8 response body: ${JSON.stringify(challenge.content)}`);
    expect(handoff.value).toContain("only Gait can activate");
    expect(handoff.value).not.toMatch(/raw_secret|GAIT_APPLICATION_CREDENTIAL/);
    fireEvent.click(screen.getByRole("button", { name: "Copy complete proof handoff" }));
    await screen.findByText("Copied public ownership-proof instructions.");
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(handoff.value);
    expect(onVerify).not.toHaveBeenCalled();
    expect(screen.queryByText(/Gait reports this registration active/)).not.toBeInTheDocument();
});

test("same-host backend route guidance switches Django/FastAPI without changing authority", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Frontend and backend hosting"), { target: { value: "same" } });
    fireEvent.change(screen.getByLabelText("Where is the frontend hosted?"), { target: { value: "backend" } });
    expect(screen.getByText(/both URLs may use the same origin/)).toBeInTheDocument();
    expect(screen.getByText(/from django.http import HttpResponse/)).toHaveTextContent('path(".well-known/gait-domain-verification"');
    fireEvent.change(screen.getByLabelText("Backend framework for route example"), { target: { value: "fastapi" } });
    expect(screen.getByText(/from fastapi.responses import PlainTextResponse/)).toHaveTextContent('@app.get("/.well-known/gait-domain-verification"');
    expect(screen.getByText(challenge.url)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download static proof file" })).not.toBeInTheDocument();
});

test("expiry disables verification and publishing until a new server challenge arrives", () => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date("2098-12-31T23:59:58Z"));
    const onChallenge = jest.fn();
    render(<Harness onChallenge={onChallenge} />);
    expect(screen.getByText(/Proof expires in 0m 2s/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify ownership with Gait" })).toBeEnabled();
    act(() => jest.advanceTimersByTime(2000));
    expect(screen.getByText(/This ownership challenge expired/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify ownership with Gait" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Copy proof content" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Generate new ownership challenge" }));
    expect(onChallenge).toHaveBeenCalledTimes(1);
});

test("only an authoritative server update activates ownership", () => {
    const onVerify = jest.fn();
    const { rerender } = render(<Harness onVerify={onVerify} />);
    fireEvent.click(screen.getByRole("button", { name: "Verify ownership with Gait" }));
    expect(onVerify).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Gait reports this registration active/)).not.toBeInTheDocument();
    rerender(<Harness data={{ ...registration, status: "active", ownership_challenge: null }} />);
    expect(screen.getByText(/Gait reports this registration active/)).toBeInTheDocument();
});

test.each([
    "https://other.example.test/.well-known/gait-domain-verification",
    "https://moneta.example.test/.well-known/gait-domain-verification?redirect=1",
    "https://moneta.example.test/not-the-proof",
])("unexpected proof destination is never copied, downloaded or verified: %s", (url) => {
    render(<Harness data={{ ...registration, ownership_challenge: { ...challenge, url } }} />);
    expect(screen.getByRole("button", { name: "Verify ownership with Gait" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Copy proof content" })).not.toBeInTheDocument();
});

test("download creates the exact static filename and unmodified body", () => {
    URL.createObjectURL = jest.fn().mockReturnValue("blob:dummy-proof");
    URL.revokeObjectURL = jest.fn();
    const OriginalBlob = window.Blob;
    const blob = jest.spyOn(window, "Blob").mockImplementation((...args) => new OriginalBlob(...args));
    const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
        expect(this.download).toBe("gait-domain-verification");
        expect(this.href).toBe("blob:dummy-proof");
    });
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Download static proof file" }));
    expect(blob).toHaveBeenCalledWith([challenge.content], { type: "text/plain;charset=utf-8" });
    expect(click).toHaveBeenCalledTimes(1);
});

test("clipboard refusal preserves selectable public proof; dirty URLs disable authority actions", async () => {
    navigator.clipboard.writeText.mockRejectedValue(new Error("blocked"));
    const { rerender } = render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Copy proof content" }));
    await screen.findByText(/Clipboard unavailable/);
    const proof = screen.getByRole("textbox", { name: "Exact proof response body" });
    expect(proof.selectionEnd - proof.selectionStart).toBe(challenge.content.length);
    rerender(<Harness dirty />);
    expect(screen.getByRole("button", { name: "Verify ownership with Gait" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Copy proof content" })).toBeDisabled();
});

test("frontend URL suggestions preserve input until explicit user action", () => {
    expect(frontendOriginFeedback("https://moneta.example.test/login?next=home")).toEqual(expect.objectContaining({ suggestion: "https://moneta.example.test" }));
    expect(frontendOriginFeedback("https://user:pass@moneta.example.test")).not.toHaveProperty("suggestion");
    expect(frontendOriginFeedback("https://moneta.example.test")).toBeNull();
});

test("AWS distinguishes static hosting from app routes without requiring account access", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Where is the frontend hosted?"), { target: { value: "aws" } });
    expect(screen.getByLabelText("AWS frontend deployment")).toHaveValue("static");
    expect(screen.getByText(/No AWS account connection to Gait is needed/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download static proof file" })).toBeEnabled();
    fireEvent.change(screen.getByLabelText("AWS frontend deployment"), { target: { value: "app" } });
    expect(screen.queryByRole("button", { name: "Download static proof file" })).not.toBeInTheDocument();
    expect(screen.getByText(/from django.http import HttpResponse/)).toBeInTheDocument();
    expect(screen.getByText(challenge.url)).toBeInTheDocument();
});

test("Heroku optional existing-route configuration uses server expiry in epoch seconds", async () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Where is the frontend hosted?"), { target: { value: "heroku" } });
    expect(screen.getByText(/Environment variables do not create an endpoint/)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Existing route expiry epoch seconds" })).toHaveValue(String(Date.parse(challenge.expires_at) / 1000));
    fireEvent.click(screen.getByRole("button", { name: "Copy expiry epoch seconds" }));
    await screen.findByText("Copied public ownership-proof instructions.");
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(String(Date.parse(challenge.expires_at) / 1000));
    fireEvent.click(screen.getByRole("button", { name: "Copy existing-route variable handoff" }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2));
    expect(JSON.parse(navigator.clipboard.writeText.mock.calls[1][0])).toEqual({ GAIT_DOMAIN_VERIFICATION_CONTENT: challenge.content, GAIT_DOMAIN_VERIFICATION_EXPIRES_AT: String(Date.parse(challenge.expires_at) / 1000) });
    expect(screen.getByText(/Remove temporary GAIT_DOMAIN_VERIFICATION_CONTENT and GAIT_DOMAIN_VERIFICATION_EXPIRES_AT settings/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("How will you publish the proof?"), { target: { value: "assisted" } });
    expect(screen.getByRole("textbox", { name: "Developer or AI proof handoff" }).value).toContain(`GAIT_DOMAIN_VERIFICATION_EXPIRES_AT is ${Date.parse(challenge.expires_at) / 1000}`);
});

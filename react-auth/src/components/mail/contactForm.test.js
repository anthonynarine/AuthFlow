import { CONTACT_LIMITS, blankFields, contactErrorMessage } from "./contactForm";

describe("contact form helpers", () => {
    test("limits match the server (counted after trimming)", () => {
        expect(CONTACT_LIMITS).toEqual({ reply_to: 254, subject: 200, content: 5000 });
    });

    test("a too-long field is named the way the page names it", () => {
        const error = {
            response: {
                status: 400,
                data: { error: "content must be at most 5000 characters", field: "content", max_length: 5000 },
            },
        };
        expect(contactErrorMessage(error, { content: "Message" })).toBe(
            "Message is too long: keep it to 5000 characters."
        );
    });

    test("too many requests, the server's own message, and a fallback", () => {
        expect(contactErrorMessage({ response: { status: 429, data: {} } })).toMatch(/wait a minute/);
        expect(contactErrorMessage({ response: { status: 400, data: { error: "Invalid email format" } } })).toBe(
            "Invalid email format"
        );
        expect(contactErrorMessage(new Error("offline"))).toMatch(/Something went wrong/);
    });

    test("blank means empty or only spaces", () => {
        expect(blankFields({ a: "  ", b: "x", c: "" }, ["a", "b", "c"])).toEqual(["a", "c"]);
    });
});

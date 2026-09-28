import { fieldErrors, readableMessages } from "./authPagesApi";

jest.mock("../interceptors/axios", () => ({ publicAxios: { post: jest.fn() } }));

const reply = (status, data) => ({ response: { status, data } });
const MAP = { password: "password", email: "email" };

describe("readableMessages", () => {
    test.each([
        ["a plain string", "This password is too short.", "This password is too short."],
        ["a list", ["This password is too short.", "This password is too common."], "This password is too short. This password is too common."],
        ["Django's stringified list", "['This password is too short.', 'This password is too common.']", "This password is too short. This password is too common."],
        ["a stringified list with an apostrophe (Python switches to double quotes)", "[\"This password can't be entirely numeric.\"]", "This password can't be entirely numeric."],
        ["a stringified list mixing quote styles", "['This password is too common.', \"This password can't be entirely numeric.\"]", "This password is too common. This password can't be entirely numeric."],
        ["a list holding a stringified list", ["['This password is too common.']"], "This password is too common."],
        ["text that merely has brackets inside", "Use [letters] and numbers.", "Use [letters] and numbers."],
    ])("%s", (_, input, expected) => {
        expect(readableMessages(input)).toBe(expected);
    });

    test("nothing usable gives an empty string", () => {
        expect(readableMessages(null)).toBe("");
        expect(readableMessages([])).toBe("");
    });
});

describe("fieldErrors", () => {
    test("Gait's register answer today: a stringified list on the password field reads as sentences", () => {
        const error = reply(400, { error: { password: "['This password is too common.', \"This password can't be entirely numeric.\"]" } });
        expect(fieldErrors(error, MAP, "fallback")).toEqual({
            password: "This password is too common. This password can't be entirely numeric.",
        });
    });

    test("a proper list (Gait sending e.messages) reads the same way", () => {
        const error = reply(400, { error: { password: ["This password is too common."] } });
        expect(fieldErrors(error, MAP, "fallback")).toEqual({ password: "This password is too common." });
    });

    test("a top-level stringified list or list becomes the general message", () => {
        expect(fieldErrors(reply(400, { error: "['Something is off.']" }), MAP, "fallback")).toEqual({ general: "Something is off." });
        expect(fieldErrors(reply(400, { error: ["Something is off."] }), MAP, "fallback")).toEqual({ general: "Something is off." });
    });

    test("unknown keys go to the general message; empty answers fall back", () => {
        const error = reply(400, { error: { non_field_errors: ["['Try again later.']"] } });
        expect(fieldErrors(error, MAP, "fallback")).toEqual({ general: "Try again later." });
        expect(fieldErrors(reply(400, { error: [] }), MAP, "fallback")).toEqual({ general: "fallback" });
    });

    test("no response at all says Gait couldn't be reached", () => {
        expect(fieldErrors(new Error("Network Error"), MAP, "fallback").general).toMatch(/couldn't reach Gait/);
    });
});

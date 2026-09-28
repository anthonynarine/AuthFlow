import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Badge } from "./primitives";

describe("Badge tones", () => {
    test.each(["OWNER", "ADMIN", "MEMBER"])("a role (%s) is neutral: roles aren't statuses", (role) => {
        render(<Badge value={role} />);
        expect(screen.getByText(/owner|admin|member/i)).toHaveClass("gc-badge", "gc-badge--role");
    });

    test.each([
        ["ACTIVE", "gc-badge--good"],
        ["SELF_REPORTED", "gc-badge--warn"],
        ["CRITICAL", "gc-badge--bad"],
        ["PENDING", "gc-badge--info"],
    ])("status keeps its colour (%s)", (value, tone) => {
        render(<Badge value={value} label="the badge" />);
        expect(screen.getByText("the badge")).toHaveClass(tone);
    });
});

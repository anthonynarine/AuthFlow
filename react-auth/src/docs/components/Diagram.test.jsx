import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import mermaid from "mermaid";
import { Diagram } from "./Diagram";

test("mermaid loads on demand in strict mode, one render at a time", async () => {
    const initialize = jest.spyOn(mermaid, "initialize");
    let active = 0;
    let maxActive = 0;
    const renderSpy = jest.spyOn(mermaid, "render").mockImplementation(async (id) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return { svg: `<svg data-testid="diagram-${id}"></svg>` };
    });

    render(
        <>
            <Diagram source="flowchart LR; A-->B" description="A leads to B." />
            <Diagram source="flowchart LR; C-->D" description="C leads to D." />
        </>
    );

    expect(screen.getByText("A leads to B.", { selector: "figcaption" })).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access -- the rendered SVGs are what this test checks
    await waitFor(() => expect(document.querySelectorAll("svg")).toHaveLength(2));

    expect(initialize).toHaveBeenCalledTimes(1);
    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ securityLevel: "strict", startOnLoad: false }));
    expect(renderSpy).toHaveBeenCalledTimes(2);
    expect(maxActive).toBe(1);
});

test("records the drawing's natural width so phones never stretch a small diagram", async () => {
    const spy = jest
        .spyOn(mermaid, "render")
        .mockResolvedValue({ svg: '<svg viewBox="0 0 259.5 966" data-testid="narrow"></svg>' });
    render(<Diagram source="flowchart TB; A-->B" description="A narrow one." />);
    // eslint-disable-next-line testing-library/no-node-access -- the diagram's SVG wrapper is what this test checks
    await waitFor(() => expect(document.querySelector(".doc-diagram-svg")).not.toBeNull());
    // eslint-disable-next-line testing-library/no-node-access -- the diagram's SVG wrapper is what this test checks
    expect(document.querySelector(".doc-diagram-svg").style.getPropertyValue("--diagram-natural-width")).toBe("260px");
    spy.mockRestore();
});

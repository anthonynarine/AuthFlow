import { getHelpSections, getRelatedViewLabel, getStatusExplanationEntries } from "./securityHelpPresentation";

describe("securityHelpPresentation", () => {
  test("getHelpSections skips missing fields and preserves reading order", () => {
    const sections = getHelpSections({
      failure_means: "Bad.",
      what_it_is: "A thing.",
      why_it_matters: "It matters.",
    });

    expect(sections.map((section) => section.key)).toEqual(["what_it_is", "why_it_matters", "failure_means"]);
    expect(sections[0]).toEqual({ key: "what_it_is", heading: "What is this?", body: "A thing." });
  });

  test("getHelpSections returns an empty list for null/empty help", () => {
    expect(getHelpSections(null)).toEqual([]);
    expect(getHelpSections({})).toEqual([]);
  });

  test("getStatusExplanationEntries formats the status key without rewriting the value", () => {
    const entries = getStatusExplanationEntries({
      status_explanations: { NEEDS_ATTENTION: "Not fully healthy." },
    });
    expect(entries).toEqual([{ statusKey: "NEEDS_ATTENTION", statusLabel: "NEEDS ATTENTION", text: "Not fully healthy." }]);
  });

  test("getStatusExplanationEntries returns an empty list when absent", () => {
    expect(getStatusExplanationEntries({})).toEqual([]);
  });

  test("getRelatedViewLabel formats a topic key into a readable label without inventing a route", () => {
    expect(getRelatedViewLabel("specialist_workflow")).toBe("Specialist Workflow");
    expect(getRelatedViewLabel(null)).toBe(null);
  });
});

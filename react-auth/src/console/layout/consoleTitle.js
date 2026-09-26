// Browser-tab titles for console pages: "<Section> · <Company> · Gait".
// RouteTitle leaves /console/<company>/... to the console layout, which
// knows the company's name.

const SECTIONS = [
    [/^\/console\/[^/]+\/overview\/?$/, "Overview"],
    [/^\/console\/[^/]+\/applications\/[^/]+\/?$/, "Application"],
    [/^\/console\/[^/]+\/applications\/?$/, "Applications"],
    [/^\/console\/[^/]+\/security\/findings\/[^/]+\/?$/, "Finding"],
    [/^\/console\/[^/]+\/security\/?$/, "Findings"],
    [/^\/console\/[^/]+\/members\/?$/, "Members"],
    [/^\/console\/[^/]+\/settings\/?$/, "Settings"],
];

export function isCompanyConsolePath(pathname) {
    return /^\/console\/[^/]+(\/|$)/.test(pathname);
}

export function consoleTitle(pathname, companyName) {
    const match = SECTIONS.find(([pattern]) => pattern.test(pathname));
    return [match ? match[1] : null, companyName, "Gait"].filter(Boolean).join(" · ");
}

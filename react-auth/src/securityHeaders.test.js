/**
 * GAIT-SEC-039: the console's security headers, for both ways the build can
 * be served -- Netlify (public/_headers) and the Procfile's `serve`
 * (public/serve.json; CRA copies public/ into build/, where serve reads it).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

/** Netlify _headers: `/*` block of `Name: value` lines (comments ignored). */
function parseNetlifyHeaders(text) {
    const rules = {};
    let current = null;
    for (const raw of text.split("\n")) {
        if (!raw.trim() || raw.trim().startsWith("#")) continue;
        if (!/^\s/.test(raw)) {
            current = raw.trim();
            rules[current] = {};
        } else {
            const index = raw.indexOf(":");
            rules[current][raw.slice(0, index).trim()] = raw.slice(index + 1).trim();
        }
    }
    return rules;
}

function parseServeHeaders(text) {
    const config = JSON.parse(text);
    const rules = {};
    for (const rule of config.headers) {
        rules[rule.source] = Object.fromEntries(rule.headers.map(({ key, value }) => [key, value]));
    }
    return rules;
}

function parseCsp(value) {
    return Object.fromEntries(
        value.split(";").map((d) => d.trim()).filter(Boolean).map((d) => {
            const [name, ...sources] = d.split(/\s+/);
            return [name, sources];
        }),
    );
}

const CONFIGS = {
    "public/_headers (Netlify)": parseNetlifyHeaders(read("public/_headers"))["/*"],
    "public/serve.json (serve)": parseServeHeaders(read("public/serve.json"))["**"],
};

const EXACT = {
    "Strict-Transport-Security": "max-age=31536000",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
};

describe.each(Object.entries(CONFIGS))("%s", (_name, headers) => {
    test("applies to every path", () => {
        expect(headers).toBeDefined();
    });

    test.each(Object.entries(EXACT))("sets %s", (header, value) => {
        expect(headers[header]).toBe(value);
    });

    test("sets a restrictive Permissions-Policy", () => {
        const policy = headers["Permissions-Policy"];
        for (const feature of ["camera", "microphone", "geolocation", "payment", "usb"]) {
            expect(policy).toContain(`${feature}=()`);
        }
    });

    test("sets a report-only CSP with the required directives", () => {
        expect(headers["Content-Security-Policy"]).toBeUndefined();
        const csp = parseCsp(headers["Content-Security-Policy-Report-Only"]);
        expect(csp["default-src"]).toEqual(["'self'"]);
        expect(csp["script-src"]).toEqual(["'self'"]);
        expect(csp["frame-ancestors"]).toEqual(["'none'"]);
        expect(csp["object-src"]).toEqual(["'none'"]);
        expect(csp["base-uri"]).toEqual(["'self'"]);
        expect(csp["connect-src"]).toContain("'self'");
        expect(csp["connect-src"]).toContain("https://api.gaitobservatory.com");
    });

    test("the CSP never allows inline or eval'd script, and has no report endpoint", () => {
        const csp = parseCsp(headers["Content-Security-Policy-Report-Only"]);
        const scriptSources = csp["script-src"] || csp["default-src"];
        expect(scriptSources).not.toContain("'unsafe-inline'");
        expect(scriptSources).not.toContain("'unsafe-eval'");
        expect(csp["report-uri"]).toBeUndefined();
        expect(csp["report-to"]).toBeUndefined();
    });
});

test("Netlify and serve send the same headers", () => {
    const [netlify, serve] = Object.values(CONFIGS);
    expect(serve).toEqual(netlify);
});

test("the build keeps the runtime chunk out of index.html (no inline script for the CSP)", () => {
    const { scripts } = JSON.parse(read("package.json"));
    expect(scripts.build).toMatch(/(^|\s)INLINE_RUNTIME_CHUNK=false\s/);
});

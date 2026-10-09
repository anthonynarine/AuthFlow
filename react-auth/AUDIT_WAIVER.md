# Dependency audit waiver (AuthFlow)

- **Date:** 2026-10-08
- **Review by:** 2026-11-08
- **Scope:** `npm audit --omit=dev --audit-level=high` in `react-auth/` (the CI `dependency audit` job, GAIT-SEC-041)
- **Status:** the CI job still fails on high. Whether it gates merges is for the owner to decide.

## What was fixed in G0

- Direct dependencies, same major: `axios` 1.20.0, `react-router-dom` / `react-router` 6.30.6, `js-cookie` 3.0.8.
- `npm audit fix` (no `--force`) for transitive dependencies, lockfile only. This cleared all four critical advisories (`form-data`, `proxy-addr`, `shell-quote`, `websocket-driver`).
- Same-major `overrides` in `package.json`: `compression` 1.8.2 (used by `serve`, which runs the production server) and `underscore` 1.13.8.

Result: no critical advisories and 9 distinct high advisories remaining, down from 4 critical and 74 high.

## Remaining high advisories

Every remaining package is reached only through `react-scripts` 5.0.1 (Create React App), which is no longer maintained and pins these versions. CRA puts its whole build and test toolchain under `dependencies`, so `--omit=dev` does not exclude it. Fixing these means leaving CRA (for example, moving to Vite), or taking a major version that CRA cannot use. Both are out of G0 scope.

| Package | Advisory | Reached through | Why not fixed in G0 |
|---|---|---|---|
| `braces` 3.0.3 | GHSA-vfj7-8cjw-p6xm | `micromatch` (webpack, jest, eslint, tailwind tooling) | No patched release exists. |
| `node-forge` 1.4.0 | GHSA-86w9-cpqp-85rv | `selfsigned`, from `webpack-dev-server` (dev server only) | No patched release exists. The fix route is a `react-scripts` major. |
| `nth-check` 1.x | GHSA-rp65-9cf3-cjxr | `svgo` 1, from `@svgr/webpack` 5 (build time) | Fixed only in 2.x (major). |
| `postcss` 7.x | GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849 | `resolve-url-loader` 4 (build time) | Fixed only in 8.x (major). The top-level `postcss` is already 8.5.29. |
| `serialize-javascript` 4.x / 6.x | GHSA-5c6j-r48x-rmvq | `rollup-plugin-terser` (workbox), `css-minimizer-webpack-plugin` (build time) | Fixed only in 7.x (major). |
| `svgo` 1.3.2 | GHSA-2p49-hgcm-8545, GHSA-w27v-7q3p-w38r | `@svgr/plugin-svgo` 5 (build time) | Fixed only in 2.8.4 (major). The `postcss-svgo` copy is already 2.8.4. |
| `webpack-dev-middleware` 5.3.4 | GHSA-g84c-rxfj-3j2c | `webpack-dev-server` 4 (dev server only) | Fixed only in 7.4.5 (major). |

npm also lists many parent packages as "high" only because they depend on a package above, for example the jest, `@typescript-eslint` and workbox chains, `react-scripts`, `react-dev-utils` and `tailwindcss`. They carry no advisory of their own.

None of the high rows above ships in the browser bundle. They are build, test or local dev-server tooling. The production runtime is the static build served by Netlify or `serve`, and `serve`'s own advisory (via `compression`) is fixed.

## Runtime dependencies (in the browser bundle), below high, noted for planning

| Package | Advisory | Why not fixed in G0 |
|---|---|---|
| `react-router` / `react-router-dom` 6.30.6 | GHSA-wrjc-x8rr-h8h6, GHSA-337j-9hxr-rhxg (moderate) | Fixed only in 7.18 (major; a router migration). 6.30.6 is the newest 6.x and clears every high advisory. |
| `katex` 0.16.47 (via `mermaid` 11.17.2, docs diagrams) | GHSA-238p-pmpm-9mq7 (low) | Fixed in katex 0.18.2, outside the 0.16 range mermaid 11 requires. npm's only offered "fix" is downgrading mermaid to 10.8.0 (a major step back), which is not taken. Revisit when a mermaid 11.x release allows the fixed katex. |

## To clear the waiver

- Move the app off `react-scripts` (CRA) to a maintained toolchain. That removes every high row; the react-router row needs the 7.x migration, and the katex row a mermaid release that allows the fixed katex.
- Until then, re-run `npm audit --omit=dev` at each review date. Apply any same-major fix that appears, and update this file.

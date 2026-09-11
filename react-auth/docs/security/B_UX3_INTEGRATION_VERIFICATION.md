# B-UX3.1 — Sage Integration Verification & Repository Hygiene

**Date:** 2026-09-11
**Backend verified:** `3159cf7` (branch `b-know3/sage-grounded-copilot`)
**Frontend verified:** `1aa9150` (branch `main`, commit "feat(security-ui): add Sage mastery learning experience to Security Copilot (B-UX3)")
**Verification worktree:** `AuthFlow-bux3-1-verify` / branch `verify/bux3-1-integration`
**Backup ref:** `backup/before-bux3-integration-cleanup` → `1aa9150`

## Repo-hygiene conclusion: SAFE AS-IS

Audited every file in `dc02b06` (parent `9ea9196`, 100 files) against `git show`,
`git diff`, real test runs, and route/import wiring. No file was left
orphaned, unfinished, or debug-only (no `TODO`/`FIXME`/stray `console.log`
found in any new source file). Classification:

- **B-UX3 prerequisite** (this session's own earlier work): Security
  Exercises/Minato/Trunks/Itachi (`security-exercises/*`,
  `useExerciseRun*`, `usePlaybookCatalog`, `useSchedule*`), favicon.
- **Concurrent-session work, verified complete and tested**: the B-UX1→B-UX2
  learning ladder (`SecurityLearnPage`, `SecurityLearningDrawer`,
  `SecurityLearningView`, `SecurityLearningDiagram`, `useSecurityLearning`,
  and the `SecurityInfoButton`/`PostureOverview`/`CurrentSessionSummary`/
  `HumanAttentionBanner`/`SecurityControlDetailModal` wiring that passes
  `currentStatus` into it) — 13 suites / 123 tests, all passing, and this is
  exactly the B-UX2 code B-UX3 was built on top of.
- **Concurrent-session work, unrelated but complete**: `GaitArchitecturePage`
  + its diagrams (public marketing/explainer page, wired into `App.js` and
  linked three times from `HomePage.jsx`), a favicon/manifest/branding pass,
  and a Security Command "operational refresh" trigger
  (`SecurityCopilotPanel`'s `onOperationalResponse`, its own dedicated test
  file) that B-UX3 extended rather than replaced.

No accidental or unfinished work was found. No git history rewrite was
needed or performed.

## Backend contract re-verification

Re-read `security/copilot.py::SecurityCopilotService._sage_response`,
`security_knowledge/sage/contracts.py`, `service.py`, `routing.py`,
`synthesis.py`, and `learning_sources.py` directly from the committed
`3159cf7` worktree (not from milestone reports). The B-UX3 frontend's
normalization layer (`sageResponse.js`) matches the real response shape
field-for-field: `information_need`, `basis`, `learning_mode`, `citations`,
`limitations`, `next_reading` at the top level; `context.sage.answer` /
`context.sage.knowledge_excerpts` for the pure knowledge text; top-level
`facts`/`interpretation`/`sources` as the MIXED current-truth section. No
mismatch found; no frontend changes were required.

## Live authenticated verification

Backend run from the committed `b-know3/sage-grounded-copilot` worktree
(`3159cf7`) on `localhost:8010`, `DEBUG=True`, `AGENT_EXECUTION_ENABLED`
left at its safe default (`False`), against the project's real shared
local Postgres dev database (no schema/migration changes — zero unapplied
migrations). Frontend run from the isolated `verify/bux3-1-integration`
worktree on `localhost:3001`, pointed at that backend via `.env`. Logged in
as a dedicated, newly created dev-only verification account
(`is_staff=True`, `role=admin`, no elevated privilege beyond what any real
staff operator has) — the pre-existing guest-login demo account was
checked and found insufficient (not staff), so it could not be used for
this Security Command flow.

| Flow | Result |
|---|---|
| 1 — KNOWLEDGE/EXPLAIN ("Teach me the Gateway") | **Pass.** `KNOWLEDGE` badge, `EXPLAIN` mode chip, real grounded excerpts, `Sources (5)` drawer opened with real titles/headings/repo-relative origins (plain text, not links), technical details (hash/chunk id) collapsed by default. No Current Truth section. No action created. |
| 2 — QUIZ ("Quiz me on Security Truth") | **Pass.** `QUIZ` mode chip, question/excerpts visible, no answer-guide content in the initial response, `Reveal Answer` button present. Clicking it sent exactly one follow-up request and surfaced materially different (answer-guide) content. |
| 3 — CODE_WALK | **Pass, with a discovered backend routing gap.** The milestone's own example phrasing, "Give me a code walk for the Gateway," does not match any backend `_KNOWLEDGE_PATTERNS`/`_MODE_PATTERNS` regex and fell through to the plain CURRENT_TRUTH path — correct frontend behavior (it never reimplements routing), but worth a backend follow-up. Triggering CODE_WALK properly via the mode button (`Code Walk` + "the Gateway") produced a real numbered excerpt sequence with repo-relative paths, exactly as designed. |
| 4 — MIXED Current Truth + Knowledge | **Pass.** `MIXED` badge; a visually distinct green "Current Truth" card with a real finding/control reference (`GAIT.AUTH.REFRESH_REPLAY_PROTECTION`); a separate "Why This Matters" knowledge section with real grounded excerpts and its own citations. The live status was never inferred from the knowledge text. |
| 5 — ACTION ("Ask Blue Team to investigate") | **Pass.** Rendered entirely through the existing `CommanderDecision` UI (Incident Commander / FAILED / denial reason), no basis badge, no Sage rendering at all — Sage did not swallow it. The result was a real governed denial; execution was never force-enabled to produce a different outcome. |
| 6 — B-UX1 → B-UX2 → Sage | **Pass.** Opened a B-UX1 popup, "Learn more" → B-UX2 drawer, "Ask Gait about this →" → navigated to Security Command and auto-sent exactly one prompt ("Explain Refresh Token Family"), which returned real, on-topic grounded content. |
| 7 — SecurityControl "Teach this" | **Pass.** Opened a real control (`GAIT.AUTH.REFRESH_REPLAY_PROTECTION`, HEALTHY), clicked "Teach this," and got a real, grounded, on-topic response with no action implied. |
| 8 — HISTORY_UNAVAILABLE | **Pass.** `HISTORY UNAVAILABLE` badge, the exact canonical fallback message, rendered as a normal answer (no error styling, no `role="alert"`), no fabricated historical data. |
| 9 — Failure/fallback isolation | **Partially observed, not synthetically simulated.** A real auth/token issue (below) caused Security Observatory's GET endpoints to start failing mid-session; Security Command's Copilot (`POST /copilot/query/`) kept succeeding throughout, evidence that a knowledge/API failure in one area does not take down the rest of the app. A deliberate mocked-failure test of `SecuritySageResponse` itself was not additionally run live (already covered by the `SageErrorBoundary` unit tests in the B-UX3 test suite). |
| 10 — Mobile/narrow width | **Not reliably verified live.** `resize_window` reported success but the captured screenshots continued to render at the original desktop width, so no narrow-viewport screenshot evidence exists. Reporting this honestly rather than claiming it was checked; the responsive CSS added in B-UX3 (media query on `.copilot-mode-controls`, reuse of the already-responsive `.security-modal` for the source drawer) was reviewed at the code level only. |

### Network/request verification

Every Sage-handled exchange went through exactly one
`POST /api/security/copilot/query/` call; no direct calls to
`/knowledge/search/` or any Vault endpoint were made by the frontend at any
point. `Reveal Answer` and "Ask Gait about this" each produced exactly one
additional request, confirmed via the browser's own network log.

### Security-boundary verification

Confirmed via source review and live behavior: the frontend never chooses
KNOWLEDGE vs. CURRENT_TRUTH vs. ACTION itself (mode buttons only template
message *text*, matched against the backend's own classifier — there is no
`learning_mode` request parameter in the real contract); it never calls
Gateway or deployment APIs; repo-relative citation origins render as plain
text, never as `file://`/local-path/fetch links; no JWTs, approval tokens,
or absolute filesystem paths appeared anywhere in the rendered UI.

## Known limitations / discovered issues (not fixed — out of this milestone's scope)

1. **Backend CODE_WALK/KNOWLEDGE routing pattern gap.** Natural phrasings
   like "give me a code walk for X" aren't recognized by
   `security_knowledge/sage/routing.py`'s regex sets and silently fall back
   to CURRENT_TRUTH. The frontend's own mode buttons route around this by
   construction (they send backend-recognized phrasing), but a
   free-typed request in that exact shape will not trigger Sage. Backend
   scope; not touched here.
2. **Token refresh 403-vs-401 gap encountered live.** After roughly 15–20
   minutes, Security Observatory's GET endpoints started returning 403
   instead of 401 on an expired access token, which the frontend's
   axios interceptor only auto-refreshes on 401 — so the user was
   silently locked out of Observatory until a fresh login. Consistent
   with a previously-known `auth_integration` 401-vs-403 defect
   (see `Lumen/CLAUDE.md`'s "shared-package auth bug", fixed and released
   as `v0.3.12`) that this backend branch's dependency pin may predate.
   Backend/shared-package scope; not touched here.
3. **Backend test suite hit shared `--keepdb` contamination**, exactly as
   `CLAUDE.md` warns it can: `security.test_security_copilot` and
   `security_knowledge.sage.tests` both fail in `setUp()`/fixture helpers
   with `IntegrityError: null value in column "attack_surface_key"` /
   `SecurityFinding.DoesNotExist` against the shared local test database
   (20/25 and 23/93 respectively). A non-`--keepdb` run could not be used
   to get a clean database either, since the shared `test_django_auth`
   database already exists and recreating it is destructive to whatever
   concurrent session owns it. The embedded B-KNOW3 evaluation suites
   (which don't depend on this fixture) ran cleanly inside the same
   process and reproduced the milestone's own reported numbers exactly:
   grounding recall 90.32% (n=31), routing accuracy 86.36% (n=44). Not
   fixed, per this milestone's explicit instruction not to touch shared
   test infrastructure.

## Frontend changes made this milestone

None. Live verification found zero B-UX3-specific defects requiring a
code fix; the three items above are backend/infrastructure-scoped and are
reported rather than patched, per this milestone's explicit boundaries.

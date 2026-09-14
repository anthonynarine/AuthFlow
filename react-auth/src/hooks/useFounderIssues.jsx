import { useCallback, useEffect, useState } from "react";
import { cachedGet } from "./requestCache";
import { platformFindingAdapter } from "../components/workspace/adapters/founderIssueAdapter";

const SNAPSHOT_TTL_MS = 15000;

/**
 * UI1 Founder Workspace — the Issues list (and Home's issue feed) built
 * entirely from existing PLATFORM read endpoints:
 *
 *   GET /security/findings/          (existing useSecurityFindings source)
 *   GET /security/cases/active/      (existing useActiveSecurityCases source)
 *   GET /security/cases/<id>/workflow/snapshot/  (one-shot, not polled, per
 *       active case — bounded by how many cases are active at once)
 *
 * No new backend endpoint (re-checked read-only for UI1.1 — no bulk
 * snapshot endpoint exists; see BACKEND_UI_CONTRACT_GAP:
 * BULK_WORKFLOW_SNAPSHOT in the UI1.1 report). This hook only joins data
 * that already exists across three calls the app already makes
 * elsewhere, and hands the result through the same
 * `platformFindingAdapter` the Issue Workspace uses, so list and detail
 * never disagree about what a field means.
 *
 * UI1.1: every request goes through `cachedGet`, which de-dupes identical
 * concurrent calls (Home and Security Team both mounting around the same
 * time no longer double the per-case snapshot traffic) and holds each
 * response for a short TTL so quick repeat navigation doesn't re-fetch
 * unchanged data. `refetch(true)` bypasses the cache entirely for an
 * explicit, deliberate refresh.
 */
export function useFounderIssues() {
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async (bypassCache = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const [findingsRes, casesRes] = await Promise.all([
        cachedGet("/security/findings/", { params: { page_size: 100 }, bypassCache }),
        cachedGet("/security/cases/active/", { bypassCache }),
      ]);

      const findingsData = findingsRes.data;
      const findings = Array.isArray(findingsData) ? findingsData : findingsData?.results || [];
      const cases = Array.isArray(casesRes.data) ? casesRes.data : [];
      const casesByFindingId = new Map(cases.map((item) => [item.finding_id, item]));

      // Bounded, concurrent, de-duped/short-cached — one failed snapshot
      // never blanks the rest of the list, it just leaves that one issue
      // without lifecycle/Needs-You detail.
      const snapshots = await Promise.all(
        cases.map((item) =>
          cachedGet(`/security/cases/${item.id}/workflow/snapshot/`, { ttlMs: SNAPSHOT_TTL_MS, bypassCache })
            .then((res) => [item.id, res.data?.snapshot || null])
            .catch(() => [item.id, null])
        )
      );
      const snapshotByCaseId = new Map(snapshots);

      const adapted = findings.map((finding) => {
        const matchingCase = casesByFindingId.get(finding.id) || null;
        const snapshot = matchingCase ? snapshotByCaseId.get(matchingCase.id) : null;
        return platformFindingAdapter({ finding, matchingCase, snapshot });
      });

      setIssues(adapted);
      setLastUpdated(new Date());
      return adapted;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  return { issues, isLoading, error, lastUpdated, refetch: load };
}

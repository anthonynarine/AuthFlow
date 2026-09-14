import { useCallback, useEffect, useState } from "react";
import { authAxios } from "../interceptors/axios";
import { platformFindingAdapter } from "../components/workspace/adapters/founderIssueAdapter";

/**
 * UI1 Founder Workspace — the Issues list (and Home's issue feed) built
 * entirely from existing PLATFORM read endpoints:
 *
 *   GET /security/findings/          (existing useSecurityFindings source)
 *   GET /security/cases/active/      (existing useActiveSecurityCases source)
 *   GET /security/cases/<id>/workflow/snapshot/  (one-shot, not polled, per
 *       active case — bounded by how many cases are active at once)
 *
 * No new backend endpoint. This hook only joins data that already exists
 * across three calls the app already makes elsewhere, and hands the
 * result through the same `platformFindingAdapter` the Issue Workspace
 * uses, so list and detail never disagree about what a field means.
 */
export function useFounderIssues() {
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [findingsRes, casesRes] = await Promise.all([
        authAxios.get("/security/findings/", { params: { page_size: 100 } }),
        authAxios.get("/security/cases/active/"),
      ]);

      const findingsData = findingsRes.data;
      const findings = Array.isArray(findingsData) ? findingsData : findingsData?.results || [];
      const cases = Array.isArray(casesRes.data) ? casesRes.data : [];
      const casesByFindingId = new Map(cases.map((item) => [item.finding_id, item]));

      const snapshots = await Promise.all(
        cases.map((item) =>
          authAxios
            .get(`/security/cases/${item.id}/workflow/snapshot/`)
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

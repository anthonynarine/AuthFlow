import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authAxios } from "../interceptors/axios";

const POLL_INTERVAL_MS = 4000;

function matchesFinding(recommendation, findingId) {
  if (!findingId) {
    return false;
  }
  if (recommendation.scope_reference === findingId) {
    return true;
  }
  return Array.isArray(recommendation.finding_ids) && recommendation.finding_ids.includes(findingId);
}

function pickLatestForFinding(recommendations, findingId) {
  const matches = recommendations.filter((recommendation) => matchesFinding(recommendation, findingId));
  if (matches.length === 0) {
    return null;
  }
  return matches.reduce((latest, current) => {
    if (!latest) {
      return current;
    }
    return new Date(current.generated_at) > new Date(latest.generated_at) ? current : latest;
  }, null);
}

function isHandoffPending(recommendation) {
  return recommendation?.status === "ACCEPTED" && recommendation?.commander_handoff?.status === "REQUESTED";
}

/**
 * GET /security/strategy/recommendations/ has no per-finding filter (last
 * 100, unfiltered) -- this fetches that list and derives the most recent
 * recommendation scoped to one finding, matching by scope_reference or
 * finding_ids. Polls only while the derived recommendation is ACCEPTED with
 * a still-REQUESTED commander handoff (mirrors useExerciseRunDetail.jsx's
 * active-while-non-terminal pattern), since it's unconfirmed whether
 * Commander dispatch completes synchronously within accept().
 */
export function useSecurityFindingRecommendation(findingId) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const latestRef = useRef(null);
  const pollTimerRef = useRef(null);

  const clearPoll = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const fetchRecommendations = useCallback(
    async ({ initial = false } = {}) => {
      if (initial) {
        setIsLoading(true);
      }
      try {
        const { data } = await authAxios.get("/security/strategy/recommendations/");
        const list = Array.isArray(data) ? data : data?.results || [];
        setRecommendations(list);
        setError(null);
        latestRef.current = pickLatestForFinding(list, findingId);
        if (!isHandoffPending(latestRef.current)) {
          clearPoll();
        }
        return list;
      } catch (requestError) {
        setError(requestError);
        throw requestError;
      } finally {
        if (initial) {
          setIsLoading(false);
        }
      }
    },
    [findingId, clearPoll]
  );

  useEffect(() => {
    latestRef.current = null;
    setRecommendations([]);
    setError(null);
    clearPoll();

    if (!findingId) {
      return undefined;
    }

    fetchRecommendations({ initial: true })
      .then(() => {
        if (isHandoffPending(latestRef.current)) {
          pollTimerRef.current = window.setInterval(() => {
            fetchRecommendations().catch(() => {});
          }, POLL_INTERVAL_MS);
        }
      })
      .catch(() => {});

    return clearPoll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findingId]);

  const recommendation = useMemo(
    () => pickLatestForFinding(recommendations, findingId),
    [recommendations, findingId]
  );

  return { recommendation, isLoading, error, refetch: () => fetchRecommendations({ initial: true }) };
}

import { useCallback, useEffect, useState } from "react";
import { authAxios } from "../interceptors/axios";

// Module-level caches shared by every component that reads the B-UX2A
// canonical learning-topic catalog (security/learning_content.py). The
// index (GET /security/learning/) is bounded summary data, fetched once
// per page/session lifecycle -- mirrors useSecurityHelp's own registry
// cache. Full topic detail (GET /security/learning/<key>/) is fetched
// lazily, on first "Learn more"/related-topic navigation to that key, and
// cached by key so reopening or revisiting a topic never refetches.
let indexCache = null;
let indexError = null;
let indexInFlight = null;
const indexSubscribers = new Set();

const detailCache = new Map();
const detailInFlight = new Map();

function notifyIndexSubscribers() {
  indexSubscribers.forEach((listener) => listener());
}

function loadLearningIndex() {
  if (indexCache) {
    return Promise.resolve(indexCache);
  }

  if (!indexInFlight) {
    indexInFlight = authAxios
      .get("/security/learning/")
      .then(({ data }) => {
        indexCache = Array.isArray(data) ? data : [];
        indexError = null;
        return indexCache;
      })
      .catch((error) => {
        // Never reject to callers: a learning-catalog failure must never
        // block or break Observatory, Security Command, or B-UX1 help.
        indexError = error;
        indexCache = null;
        return null;
      })
      .finally(() => {
        indexInFlight = null;
        notifyIndexSubscribers();
      });
  }

  return indexInFlight;
}

/**
 * Fetches one full LearningTopic by key (GET /security/learning/<key>/),
 * cached by key for the life of the page/session and deduped across
 * concurrent callers. Rejects on failure (unknown topic, network error,
 * etc.) so callers can show a restrained, local error without fabricating
 * lesson content of their own.
 */
export function fetchLearningTopic(topicKey) {
  if (!topicKey) {
    return Promise.reject(new Error("MISSING_LEARNING_TOPIC_KEY"));
  }

  if (detailCache.has(topicKey)) {
    return Promise.resolve(detailCache.get(topicKey));
  }

  if (detailInFlight.has(topicKey)) {
    return detailInFlight.get(topicKey);
  }

  const promise = authAxios
    .get(`/security/learning/${encodeURIComponent(topicKey)}/`)
    .then(({ data }) => {
      detailCache.set(topicKey, data);
      return data;
    })
    .finally(() => {
      detailInFlight.delete(topicKey);
    });

  detailInFlight.set(topicKey, promise);
  return promise;
}

/**
 * Shared access to the bounded B-UX2A learning-topic index. Used by the
 * "Learn Gait" catalog browser. Individual "Learn more" / related-topic
 * navigation doesn't need this -- it fetches one topic's detail directly
 * via fetchLearningTopic().
 */
export function useSecurityLearningIndex() {
  const [isLoading, setIsLoading] = useState(!indexCache && !indexError);
  const [, forceRerender] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const rerender = () => {
      if (isMounted) {
        forceRerender((count) => count + 1);
      }
    };
    indexSubscribers.add(rerender);

    if (!indexCache && !indexError) {
      setIsLoading(true);
      loadLearningIndex().finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      indexSubscribers.delete(rerender);
    };
  }, []);

  const retry = useCallback(() => {
    indexError = null;
    setIsLoading(true);
    return loadLearningIndex().finally(() => setIsLoading(false));
  }, []);

  return { topics: indexCache || [], isLoading, error: indexError, retry };
}

// Test-only escape hatch: nothing in app code should call this.
export function __resetSecurityLearningCacheForTests() {
  indexCache = null;
  indexError = null;
  indexInFlight = null;
  indexSubscribers.clear();
  detailCache.clear();
  detailInFlight.clear();
}

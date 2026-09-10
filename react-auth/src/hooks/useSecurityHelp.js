import { useCallback, useEffect, useState } from "react";
import { authAxios } from "../interceptors/axios";

// Module-level cache shared by every component that calls useSecurityHelp().
// The B-UX1 help registry is authored, version-controlled content -- it is
// fetched once per page/session lifecycle, not polled and not re-fetched
// per SecurityInfoButton. See security/help_content.py (backend) for the
// canonical source of these topics.
let cachedTopics = null;
let inFlightPromise = null;
let cachedError = null;
const subscribers = new Set();

function notifySubscribers() {
  subscribers.forEach((listener) => listener());
}

function indexTopics(data) {
  const list = Array.isArray(data) ? data : [];
  const byKey = {};
  list.forEach((topic) => {
    const key = topic?.key;
    if (key) {
      byKey[key] = topic;
    }
  });
  return byKey;
}

function loadHelpRegistry() {
  if (cachedTopics) {
    return Promise.resolve(cachedTopics);
  }

  if (!inFlightPromise) {
    inFlightPromise = authAxios
      .get("/security/help/")
      .then(({ data }) => {
        cachedTopics = indexTopics(data);
        cachedError = null;
        return cachedTopics;
      })
      .catch((error) => {
        // Never reject to callers: a help-registry failure must not surface
        // as an unhandled rejection or block unrelated security data. The
        // error is exposed via the hook's `error` return value instead.
        cachedError = error;
        cachedTopics = null;
        return null;
      })
      .finally(() => {
        inFlightPromise = null;
        notifySubscribers();
      });
  }

  return inFlightPromise;
}

/**
 * Shared access to the B-UX1 security help registry (GET /security/help/).
 * Fetches the full registry once (cached across every caller for the life
 * of the page/session) and exposes topic lookup by key. Backend content is
 * the canonical source of security meaning -- this hook only fetches and
 * caches it; it never fabricates or edits topic text.
 *
 * A failed help fetch never throws into the caller and never blocks
 * unrelated security data: it just leaves getTopic() returning null so
 * callers can omit the info affordance (see SecurityInfoButton usage).
 */
export function useSecurityHelp() {
  const [isLoading, setIsLoading] = useState(!cachedTopics && !cachedError);
  const [, forceRerender] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const rerender = () => {
      if (isMounted) {
        forceRerender((count) => count + 1);
      }
    };
    subscribers.add(rerender);

    if (!cachedTopics && !cachedError) {
      setIsLoading(true);
      loadHelpRegistry().finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      subscribers.delete(rerender);
    };
  }, []);

  const getTopic = useCallback((topicKey) => {
    if (!topicKey || !cachedTopics) {
      return null;
    }
    return cachedTopics[topicKey] || null;
  }, []);

  const retry = useCallback(() => {
    cachedError = null;
    setIsLoading(true);
    return loadHelpRegistry().finally(() => setIsLoading(false));
  }, []);

  return { isLoading, error: cachedError, getTopic, retry };
}

// Test-only escape hatch: nothing in app code should call this.
export function __resetSecurityHelpCacheForTests() {
  cachedTopics = null;
  inFlightPromise = null;
  cachedError = null;
  subscribers.clear();
}

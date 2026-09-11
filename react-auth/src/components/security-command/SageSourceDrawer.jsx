import React, { useEffect, useRef } from "react";

/**
 * Renders one citation's provenance. `origin` is a `Provenance.as_dict()`
 * from the backend (`origin_kind` "FILE" or "REGISTRY"). A repo-relative
 * path is shown as plain text only -- never turned into a `file://` link,
 * a local-machine path, or a fetch URL (B-UX3 section 29).
 */
function CitationOrigin({ origin }) {
  if (!origin) {
    return null;
  }
  if (origin.origin_kind === "FILE" && origin.path) {
    return <code className="sage-citation-origin">{origin.path}</code>;
  }
  if (origin.origin_kind === "REGISTRY") {
    const parts = [origin.registry_module, origin.registry_name, origin.registry_key].filter(Boolean);
    if (parts.length === 0) {
      return null;
    }
    return <code className="sage-citation-origin">{parts.join(" · ")}</code>;
  }
  return null;
}

function CitationRow({ citation, excerpt }) {
  const heading = Array.isArray(citation.heading_path) ? citation.heading_path.join(" / ") : "";

  return (
    <li className="sage-citation-row">
      <div className="sage-citation-head">
        <strong>{citation.title || citation.source_key}</strong>
        {excerpt?.domain && <span className="sage-citation-domain">{excerpt.domain}</span>}
      </div>
      {heading && <p className="sage-citation-heading">{heading}</p>}
      <CitationOrigin origin={citation.origin} />
      {excerpt?.text && <p className="sage-citation-excerpt">{excerpt.text}</p>}
      <details className="sage-citation-details">
        <summary>Technical details</summary>
        <dl className="detail-grid sage-citation-detail-grid">
          <div className="detail-row">
            <dt>Source key</dt>
            <dd>{citation.source_key || "—"}</dd>
          </div>
          <div className="detail-row">
            <dt>Chunk ID</dt>
            <dd>{citation.chunk_id || "—"}</dd>
          </div>
          <div className="detail-row">
            <dt>Content hash</dt>
            <dd>{citation.content_hash || "—"}</dd>
          </div>
        </dl>
      </details>
    </li>
  );
}

/**
 * Compact source viewer opened from a Sage response's "Sources (N)"
 * button. Renders only citation metadata the backend actually returned
 * (B-KNOW3's `SageCitation` plus, where a matching `source_key` exists,
 * the richer `knowledge_excerpts` entry from the same response) -- never
 * fetches an arbitrary file to show fuller content.
 */
export function SageSourceDrawer({ citations, knowledgeExcerpts, onClose }) {
  const closeRef = useRef(null);
  const excerptsByKey = new Map((knowledgeExcerpts || []).map((excerpt) => [excerpt.source_key, excerpt]));

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="security-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="security-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sage-sources-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="security-modal-header">
          <div>
            <p className="security-eyebrow">Grounded in canonical knowledge</p>
            <h2 id="sage-sources-heading">Sources ({citations.length})</h2>
          </div>
          <button ref={closeRef} type="button" className="icon-button" onClick={onClose} aria-label="Close sources">
            ×
          </button>
        </div>
        <ul className="sage-citation-list">
          {citations.map((citation) => (
            <CitationRow key={citation.chunk_id || citation.source_key} citation={citation} excerpt={excerptsByKey.get(citation.source_key)} />
          ))}
        </ul>
      </section>
    </div>
  );
}

export default SageSourceDrawer;

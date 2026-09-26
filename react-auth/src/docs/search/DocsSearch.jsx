import React, { useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { docPath } from "../manifest";
import { MIN_QUERY_LENGTH, loadSearchIndex, searchDocs } from "./searchIndex";

function statusText({ query, index, error, results }) {
    if (query.trim().length < MIN_QUERY_LENGTH) return "";
    if (error) return "Search couldn't load. Try again.";
    if (!index) return "Searching…";
    if (results.length === 0) return `No results for "${query.trim()}".`;
    return results.length === 1 ? "1 result" : `${results.length} results`;
}

/**
 * Search box for the docs sidebar and the mobile contents menu. Results are
 * links; arrow keys move between the box and the results, Escape clears.
 */
export function DocsSearch({ onNavigate }) {
    const inputId = useId();
    const statusId = useId();
    const [query, setQuery] = useState("");
    const [index, setIndex] = useState(null);
    const [error, setError] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const ensureIndex = () => {
        if (index) return;
        setError(false);
        loadSearchIndex()
            .then(setIndex)
            .catch(() => setError(true));
    };

    const results = useMemo(() => (index ? searchDocs(index, query) : []), [index, query]);
    const status = statusText({ query, index, error, results });

    const onKeyDown = (event) => {
        if (event.key === "Escape") {
            setQuery("");
            inputRef.current?.focus();
            return;
        }
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        const links = Array.from(containerRef.current.querySelectorAll(".docs-search-result"));
        if (links.length === 0) return;
        event.preventDefault();
        const current = links.indexOf(document.activeElement);
        if (event.key === "ArrowDown") {
            links[Math.min(current + 1, links.length - 1)].focus();
        } else if (current <= 0) {
            inputRef.current?.focus();
        } else {
            links[current - 1].focus();
        }
    };

    const onChoose = () => {
        setQuery("");
        onNavigate?.();
    };

    return (
        <div className="docs-search" role="search" ref={containerRef} onKeyDown={onKeyDown}>
            <label htmlFor={inputId} className="doc-visually-hidden">
                Search the docs
            </label>
            <input
                id={inputId}
                ref={inputRef}
                type="search"
                className="docs-search-input"
                placeholder="Search docs"
                autoComplete="off"
                spellCheck="false"
                value={query}
                onFocus={ensureIndex}
                onChange={(event) => {
                    setQuery(event.target.value);
                    ensureIndex();
                }}
                aria-describedby={statusId}
            />
            <p
                id={statusId}
                role="status"
                aria-live="polite"
                className={results.length === 0 && status ? "docs-search-status" : "doc-visually-hidden"}
            >
                {status}
            </p>
            {results.length > 0 && (
                <ul className="docs-search-results" aria-label="Search results">
                    {results.map((result) => (
                        <li key={`${result.slug}#${result.sectionId || ""}`}>
                            <Link
                                className="docs-search-result"
                                to={`${docPath(result.slug)}${result.sectionId ? `#${result.sectionId}` : ""}`}
                                onClick={onChoose}
                            >
                                <span className="docs-search-result-title">
                                    {result.pageTitle}
                                    {result.sectionTitle && <span className="docs-search-result-section"> › {result.sectionTitle}</span>}
                                </span>
                                <span className="docs-search-result-snippet">
                                    {result.snippet.map((part, i) =>
                                        part.match ? <mark key={i}>{part.text}</mark> : <React.Fragment key={i}>{part.text}</React.Fragment>
                                    )}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default DocsSearch;

import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import { DOC_GROUPS, DOC_PAGES, DOCS_BASE, docPath, findDocPage } from "./manifest";
import { DOC_CONTENT } from "./content";
import { DocsSearch } from "./search/DocsSearch";
import "./docs.css";

/*
 * Public documentation at /docs/:slug (see manifest.js for the page list and
 * the source-of-truth note). Deliberately reads no auth state and makes no
 * API calls: it must render the same for anyone, signed in or not, and must
 * never trigger a session restore.
 */

function DocsNavList({ onNavigate }) {
    return (
        <div className="docs-nav-groups">
            {DOC_GROUPS.map((group) => (
                <div key={group.title} className="docs-nav-group">
                    <p className="docs-nav-group-title">{group.title}</p>
                    <ul className="docs-nav-list" aria-label={group.title}>
                        {group.pages.map((page) => (
                            <li key={page.slug}>
                                <NavLink
                                    to={docPath(page.slug)}
                                    className={({ isActive }) => `docs-nav-link${isActive ? " is-active" : ""}`}
                                    onClick={onNavigate}
                                >
                                    {page.title}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

function OnThisPage({ headings }) {
    if (headings.length === 0) {
        return null;
    }
    return (
        <nav className="docs-toc" aria-label="On this page">
            <p className="docs-toc-title">On this page</p>
            <ul>
                {headings.map((heading) => (
                    <li key={heading.id}>
                        <a href={`#${heading.id}`}>{heading.text}</a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

function Pager({ slug }) {
    const index = DOC_PAGES.findIndex((page) => page.slug === slug);
    const previous = DOC_PAGES[index - 1];
    const next = DOC_PAGES[index + 1];
    return (
        <nav className="docs-pager" aria-label="Previous and next page">
            {previous ? (
                <Link className="docs-pager-link" to={docPath(previous.slug)} rel="prev">
                    <span className="docs-pager-label">Previous</span>
                    <span>{previous.title}</span>
                </Link>
            ) : <span />}
            {next ? (
                <Link className="docs-pager-link docs-pager-link--next" to={docPath(next.slug)} rel="next">
                    <span className="docs-pager-label">Next</span>
                    <span>{next.title}</span>
                </Link>
            ) : <span />}
        </nav>
    );
}

export function DocsPage() {
    const { slug } = useParams();
    const { hash } = useLocation();
    const page = findDocPage(slug);
    const Content = page ? DOC_CONTENT[page.slug] : null;

    const [mobileOpen, setMobileOpen] = useState(false);
    const [headings, setHeadings] = useState([]);
    const articleRef = useRef(null);
    const titleRef = useRef(null);
    const hasMounted = useRef(false);

    // "On this page" comes from the rendered h2s, so it can't drift from the content.
    useEffect(() => {
        const nodes = articleRef.current ? articleRef.current.querySelectorAll("h2[id]") : [];
        setHeadings(Array.from(nodes, (node) => ({ id: node.id, text: node.textContent })));
    }, [slug]);

    // React Router doesn't scroll on navigation: go to the #section if there is
    // one, otherwise to the top of the new page (and move focus to its title).
    // "instant" overrides the site-wide smooth scrolling: a new page should
    // open in place, not animate from wherever the last one was scrolled.
    useEffect(() => {
        const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
        if (target) {
            target.scrollIntoView?.({ behavior: "instant" });
        } else if (hasMounted.current) {
            articleRef.current?.scrollIntoView?.({ behavior: "instant" });
            titleRef.current?.focus({ preventScroll: true });
        }
        hasMounted.current = true;
    }, [slug, hash]);

    return (
        <div className="docs-shell">
            <header className="docs-header">
                <Link to="/" className="docs-brand" aria-label="Gait home">
                    <span className="docs-brand-mark" aria-hidden="true">◆</span>
                    <span>Gait</span>
                    <span className="docs-brand-section">Docs</span>
                </Link>
                <nav className="docs-header-nav" aria-label="Site">
                    <Link to="/console" className="docs-header-cta">Console</Link>
                </nav>
            </header>

            <div className="docs-body">
                <nav className="docs-sidebar" aria-label="Documentation">
                    <DocsSearch />
                    <DocsNavList />
                </nav>

                <details
                    className="docs-mobile-nav"
                    open={mobileOpen}
                    onToggle={(event) => setMobileOpen(event.currentTarget.open)}
                >
                    <summary>
                        <span className="docs-mobile-nav-label">Contents</span>
                        <span className="docs-mobile-nav-current">{page ? page.title : "Documentation"}</span>
                    </summary>
                    <nav aria-label="Documentation contents">
                        <DocsSearch onNavigate={() => setMobileOpen(false)} />
                        <DocsNavList onNavigate={() => setMobileOpen(false)} />
                    </nav>
                </details>

                <main className="docs-main">
                    <article className="docs-article" ref={articleRef}>
                        <p className="docs-eyebrow">Gait Docs</p>
                        {page ? (
                            <>
                                <h1 className="docs-title" tabIndex={-1} ref={titleRef}>{page.title}</h1>
                                <Content />
                                <Pager slug={page.slug} />
                            </>
                        ) : (
                            <>
                                <h1 className="docs-title" tabIndex={-1} ref={titleRef}>This page doesn't exist</h1>
                                <p className="doc-lede">
                                    There's no documentation page at this address.{" "}
                                    <Link to={DOCS_BASE}>Start from the beginning</Link> or pick a page from the contents.
                                </p>
                            </>
                        )}
                    </article>
                    <OnThisPage headings={headings} />
                </main>
            </div>
        </div>
    );
}

export default DocsPage;

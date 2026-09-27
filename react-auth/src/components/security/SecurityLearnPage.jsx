import React, { useState } from "react";
import { RiShieldKeyholeLine } from "react-icons/ri";
import { useSecurityLearningIndex } from "../../hooks/useSecurityLearning";
import { SecurityLoadingState } from "./SecurityLoadingState";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityLearningDrawer } from "./SecurityLearningDrawer";
import "./SecurityObservatory.css";
import "./SecurityLearning.css";

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Groups topics by category in the order the backend index already returns
// them (security/learning_content.py authors topics grouped by category) --
// this never invents its own category ordering or mapping.
function groupByCategory(topics) {
  const order = [];
  const groups = new Map();
  topics.forEach((topic) => {
    const category = topic.category || "Other";
    if (!groups.has(category)) {
      groups.set(category, []);
      order.push(category);
    }
    groups.get(category).push(topic);
  });
  return order.map((category) => ({ category, topics: groups.get(category) }));
}

/**
 * "Learn Gait" -- a simple, authenticated catalog browser over the B-UX2A
 * learning-topic index. Deliberately thin: it lists categories/topics from
 * the backend index and opens the same SecurityLearningDrawer used by every
 * "Learn more" action elsewhere, rather than building a second content
 * renderer.
 */
export function SecurityLearnPage() {
  const { topics, isLoading, error, retry } = useSecurityLearningIndex();
  const [openTopicKey, setOpenTopicKey] = useState(null);
  const grouped = groupByCategory(topics);

  return (
    <main className="security-page">
      <section className="security-shell">
        <header className="security-header">
          <div>
            <p className="security-kicker">
              <RiShieldKeyholeLine /> Gait Security
            </p>
            <h1>Learn Gait</h1>
            <p>Canonical, deep-dive explanations of how Gait's security actually works.</p>
          </div>
        </header>

        {isLoading && <SecurityLoadingState label="Loading learning catalog" />}
        {error && !isLoading && <SecurityErrorState error={error} onRetry={retry} />}

        {!isLoading && !error && (
          <div className="learning-catalog">
            {grouped.map(({ category, topics: categoryTopics }) => (
              <section
                className="learning-catalog-group"
                key={category}
                aria-labelledby={`learning-category-${slugify(category)}`}
              >
                <h2 id={`learning-category-${slugify(category)}`}>{category}</h2>
                <ul className="learning-catalog-list">
                  {categoryTopics.map((topic) => (
                    <li key={topic.key}>
                      <button
                        type="button"
                        className="learning-catalog-item"
                        onClick={() => setOpenTopicKey(topic.key)}
                      >
                        <strong>{topic.title}</strong>
                        {topic.short_summary && <span>{topic.short_summary}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>

      {openTopicKey && <SecurityLearningDrawer topicKey={openTopicKey} onClose={() => setOpenTopicKey(null)} />}
    </main>
  );
}

export default SecurityLearnPage;

import React, { useEffect, useRef, useState } from "react";
import "./diagrams.css";

/**
 * Shared building blocks for every Gait architecture diagram on the
 * homepage. One node shape, one connector shape, one frame shape, one
 * status-tag shape — reused across all nine diagrams instead of each
 * diagram inventing its own visual language.
 */

export function Reveal({ children, className = "", as: Tag = "div" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`diagram-reveal ${visible ? "is-visible" : ""} ${className}`}>
      {children}
    </Tag>
  );
}

export function DiagramFrame({ eyebrow, title, subtitle, statusLabel, children, className = "", footnote }) {
  return (
    <Reveal as="div" className={`diagram-frame ${className}`}>
      <div className="diagram-frame-header">
        <div>
          {eyebrow && <p className="diagram-frame-eyebrow">{eyebrow}</p>}
          {title && <h3 className="diagram-frame-title">{title}</h3>}
        </div>
        {statusLabel}
      </div>
      {subtitle && <p className="diagram-frame-subtitle">{subtitle}</p>}
      <div className="diagram-frame-body">{children}</div>
      {footnote && <p className="diagram-frame-footnote">{footnote}</p>}
    </Reveal>
  );
}

export function DiagramNode({
  variant = "neutral",
  icon: Icon,
  eyebrow,
  title,
  description,
  tag,
  size = "md",
  className = "",
  onClick,
  isActive,
}) {
  const interactive = typeof onClick === "function";
  const Tag = interactive ? "button" : "div";

  return (
    <Tag
      type={interactive ? "button" : undefined}
      aria-pressed={interactive ? Boolean(isActive) : undefined}
      onClick={onClick}
      className={`diagram-node diagram-node--${variant} diagram-node--${size} ${interactive ? "diagram-node--clickable" : ""} ${className}`}
    >
      <div className="diagram-node-top">
        {Icon && <Icon className="diagram-node-icon" aria-hidden="true" />}
        {eyebrow && <span className="diagram-node-eyebrow">{eyebrow}</span>}
        {tag}
      </div>
      {title && <h4 className="diagram-node-title">{title}</h4>}
      {description && <p className="diagram-node-desc">{description}</p>}
    </Tag>
  );
}

export function FlowConnector({ direction = "down", animated = true, label, className = "" }) {
  return (
    <div
      className={`flow-connector flow-connector--${direction} ${animated ? "is-animated" : ""} ${className}`}
      aria-hidden="true"
    >
      <span className="flow-connector-line" />
      <span className="flow-connector-arrow" />
      {label && <span className="flow-connector-label">{label}</span>}
    </div>
  );
}

export function LoopBackConnector({ label = "Security is continuous" }) {
  return (
    <div className="loop-back" role="img" aria-label={`Verify reconnects to Observe. ${label}.`}>
      <svg viewBox="0 0 300 90" className="loop-back-svg" aria-hidden="true">
        <path
          className="loop-back-path"
          d="M270 10 C 300 60, 220 84, 150 84 C 70 84, 10 60, 18 18"
          fill="none"
        />
        <polygon className="loop-back-arrowhead" points="18,18 8,30 28,28" />
      </svg>
      <span className="loop-back-label">{label}</span>
    </div>
  );
}

export function CapabilityTag({ status }) {
  const config = {
    built: { label: "Built", tone: "healthy" },
    next: { label: "Next", tone: "warning" },
    future: { label: "Future", tone: "neutral" },
    gated: { label: "Built, gated", tone: "warning" },
    "not-enabled": { label: "Not enabled", tone: "neutral" },
  }[status] || { label: status, tone: "neutral" };

  return <span className={`capability-tag capability-tag--${config.tone}`}>{config.label}</span>;
}

export function DiagramLegend({ items, className = "" }) {
  return (
    <ul className={`diagram-legend ${className}`}>
      {items.map((item) => (
        <li key={item.label}>
          <span className={`legend-dot legend-dot--${item.variant}`} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

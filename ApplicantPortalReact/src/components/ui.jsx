import React from "react";

// PUBLIC_INTERFACE
export function Card({ title, subtitle, actions, children }) {
  /** Standard card component for consistent layout. */
  return (
    <div className="card">
      {(title || subtitle || actions) && (
        <div className="row" style={{ marginBottom: 12 }}>
          <div>
            {title && <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>}
            {subtitle && <div className="small">{subtitle}</div>}
          </div>
          <div className="rowRight">{actions}</div>
        </div>
      )}
      {children}
    </div>
  );
}

// PUBLIC_INTERFACE
export function Toast({ kind = "info", children }) {
  /** Inline toast (info|ok|err). */
  const cls = kind === "ok" ? "toast toastOk" : kind === "err" ? "toast toastErr" : "toast";
  return <div className={cls}>{children}</div>;
}

// PUBLIC_INTERFACE
export function Pill({ color = "default", children }) {
  /** Small status pill. */
  const style =
    color === "ok"
      ? { borderColor: "rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.10)", color: "var(--success)" }
      : color === "warn"
        ? { borderColor: "rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.12)", color: "#92400e" }
        : color === "bad"
          ? { borderColor: "rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.10)", color: "var(--danger)" }
          : { borderColor: "var(--border)", background: "var(--panel)", color: "var(--muted)" };

  return (
    <span style={{ ...style, borderRadius: 999, padding: "4px 10px", border: "1px solid", fontSize: 12, fontWeight: 800 }}>
      {children}
    </span>
  );
}

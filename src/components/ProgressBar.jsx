import React from "react";

export default function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: pct + '%', background: color,
        borderRadius: 99, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
      }} />
    </div>
  );
}

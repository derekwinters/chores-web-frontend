import React from "react";

export default function Avatar({ name, size = 44, style: extraStyle }) {
  const initial = name ? name[0].toUpperCase() : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: 'var(--accent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 600, fontSize: size * 0.38, flexShrink: 0,
      letterSpacing: '-0.5px', ...extraStyle,
    }}>
      {initial}
    </div>
  );
}

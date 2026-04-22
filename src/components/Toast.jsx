import React, { useEffect } from "react";

export default function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--surface)', color: 'var(--text)',
      border: '1px solid var(--border)',
      padding: '12px 24px', borderRadius: 99,
      fontSize: 14, fontWeight: 500,
      boxShadow: 'var(--shadow-lg)', zIndex: 1000,
      animation: 'slideUp 0.3s ease',
      whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  );
}

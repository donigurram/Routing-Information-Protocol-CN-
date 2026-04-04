import React from 'react';

export default function ThemeToggle({ dark, onToggle, T }) {
    return (
        <button
            onClick={onToggle}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
                width: 40, height: 40, borderRadius: 9, border: `1.5px solid ${T.border}`,
                background: T.surfaceAlt, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 20,
                transition: "all .2s", flexShrink: 0,
                color: T.textMuted,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
        >
            {dark ? "☀" : "☽"}
        </button>
    );
}
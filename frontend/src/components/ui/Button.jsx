import React from 'react';

export default function Button({ children, onClick, variant = "default", disabled, style, T }) {
    const variants = {
        default: { background: T.accentBg, color: T.accent, border: `1.5px solid ${T.accentBdr}` },
        success: { background: T.successBg, color: T.success, border: `1.5px solid ${T.success}44` },
        danger: { background: T.dangerBg, color: T.danger, border: `1.5px solid ${T.danger}44` },
        warn: { background: T.warnBg, color: T.warn, border: `1.5px solid ${T.warn}44` },
        sim: { background: T.accentBg, color: T.accent, border: `1.5px solid ${T.accentBdr}` },
        pause: { background: T.warnBg, color: T.warn, border: `1.5px solid ${T.warn}44` },
    };
    const v = variants[variant] || variants.default;
    return (
        <button onClick={onClick} disabled={disabled} style={{
            width: "100%", padding: "9px 12px", borderRadius: 9,
            cursor: disabled ? "not-allowed" : "pointer",
            fontWeight: 700, fontSize: 15,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            opacity: disabled ? .45 : 1, transition: "all .15s", ...v, ...style
        }}>
            {children}
        </button>
    );
}
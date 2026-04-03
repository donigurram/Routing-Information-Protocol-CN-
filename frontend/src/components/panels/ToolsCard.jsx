import { useState, useRef } from "react";

function ToolsCard({ mode, setMode, connectFrom, pendingCost, setPendingCost, T }) {
    const modes = [
        { k: "add", icon: "⊕", label: "Add", color: T.accent },
        { k: "connect", icon: "⟵⟶", label: "Link", color: "#7B2FBE" },
        { k: "delete", icon: "✕", label: "Delete", color: T.danger },
        { k: "move", icon: "✥", label: "Move", color: T.warn },
        { k: "fail", icon: "⚡", label: "Fail", color: "#9B5DE5" },
        { k: "select", icon: "◉", label: "Inspect", color: T.success },
    ];

    const [pos, setPos] = useState({ x: 14, y: 62 });
    const draggingCard = useRef(false);
    const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

    const onPointerDown = e => {
        if (e.target.closest("button") || e.target.closest("input")) return;
        draggingCard.current = true;
        dragStart.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };
        e.currentTarget.setPointerCapture(e.pointerId);
        e.preventDefault();
    };

    const onPointerMove = e => {
        if (!draggingCard.current) return;
        const dx = e.clientX - dragStart.current.mx;
        const dy = e.clientY - dragStart.current.my;
        setPos({
            x: Math.max(0, Math.min(dragStart.current.ox + dx, window.innerWidth - 500)),
            y: Math.max(52, Math.min(dragStart.current.oy + dy, window.innerHeight - 300))
        });
    };

    const onPointerUp = () => { draggingCard.current = false; };

    return (
        <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{
                position: "absolute", left: pos.x, top: pos.y, zIndex: 30,
                background: T.surface, border: `1.5px solid ${T.border}`,
                borderRadius: 14, boxShadow: T.dark
                    ? "0 4px 24px rgba(0,0,0,.5)"
                    : "0 4px 24px rgba(67,97,238,.13)",
                userSelect: "none", touchAction: "none", minWidth: 106,
            }}
        >
            {/* Drag handle */}
            <div style={{
                padding: "7px 10px 5px", cursor: "grab", display: "flex",
                alignItems: "center", justifyContent: "space-between",
                borderBottom: `1px solid ${T.border}`,
            }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: T.textFaint, letterSpacing: "1.5px" }}>TOOLS</span>
                <span style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5, paddingLeft: 6 }}>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <span key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: T.textFaint, display: "block" }} />
                    ))}
                </span>
            </div>

            {/* Mode buttons */}
            <div style={{ padding: "8px 8px 4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {modes.map(m => (
                    <button key={m.k} onClick={() => setMode(mode === m.k ? "none" : m.k)} title={m.label} style={{
                        width: 43, height: 43, borderRadius: 9, cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center", gap: 2, fontSize: 14, transition: "all .15s",
                        border: `2px solid ${mode === m.k ? m.color : T.border}`,
                        background: mode === m.k ? m.color + "20" : T.bg,
                        color: mode === m.k ? m.color : T.textMuted,
                    }}>
                        <span style={{ lineHeight: 1 }}>{m.icon}</span>
                        <span style={{ fontSize: 7, fontWeight: 700, fontFamily: "monospace", letterSpacing: ".5px" }}>
                            {m.label.toUpperCase()}
                        </span>
                    </button>
                ))}
            </div>

            {/* Link cost */}
            <div style={{ borderTop: `1px solid ${T.border}`, padding: "8px 8px 6px" }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: T.textFaint, letterSpacing: "1.2px", marginBottom: 5 }}>LINK COST</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                        onClick={() => setPendingCost(c => Math.max(1, c - 1))}
                        style={{
                            width: 24, height: 24, borderRadius: 6, border: `1.5px solid ${T.border}`,
                            background: T.bg, cursor: "pointer", fontSize: 14, color: T.textMuted,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700,
                        }}
                    >−</button>
                    <input
                        type="number" min="1" max="15" value={pendingCost}
                        onChange={e => setPendingCost(Math.max(1, Math.min(15, parseInt(e.target.value) || 1)))}
                        style={{
                            flex: 1, padding: "4px 6px", border: `1.5px solid ${T.border}`, borderRadius: 6,
                            fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                            color: T.text, background: T.surface, textAlign: "center", minWidth: 0,
                        }}
                    />
                    <button
                        onClick={() => setPendingCost(c => Math.min(15, c + 1))}
                        style={{
                            width: 24, height: 24, borderRadius: 6, border: `1.5px solid ${T.border}`,
                            background: T.bg, cursor: "pointer", fontSize: 14, color: T.textMuted,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700,
                        }}
                    >+</button>
                </div>
                <div style={{ fontSize: 8, color: T.textFaint, textAlign: "center", marginTop: 4 }}>hops (1–15)</div>
            </div>

            {/* Connect-from pill */}
            {connectFrom && (
                <div style={{
                    margin: "0 8px 8px", padding: "5px 8px",
                    background: "#F3EEFF", borderRadius: 6,
                    fontSize: 9, color: "#7B2FBE", fontWeight: 700, textAlign: "center",
                    border: "1px solid #C4B5FD"
                }}>
                    ↳ FROM {connectFrom}
                </div>
            )}
        </div>
    );
}

export default ToolsCard;
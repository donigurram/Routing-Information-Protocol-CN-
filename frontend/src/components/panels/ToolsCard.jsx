import { useState, useRef } from "react";

function ToolsCard({ mode, setMode, connectFrom, setConnectFrom, pendingCost, setPendingCost, T }) {
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
            x: Math.max(0, Math.min(dragStart.current.ox + dx, window.innerWidth - 550)),
            y: Math.max(64, Math.min(dragStart.current.oy + dy, window.innerHeight - 330))
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
                userSelect: "none", touchAction: "none", minWidth: 140,
            }}
        >
            {/* Drag handle */}
            <div style={{
                padding: "7px 10px 5px", cursor: "grab", display: "flex",
                alignItems: "center", justifyContent: "space-between",
                borderBottom: `1px solid ${T.border}`,
            }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.textFaint, letterSpacing: "1.5px" }}>TOOLS</span>
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
                        width: 53, height: 53, borderRadius: 9, cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center", gap: 2, fontSize: 18, transition: "all .15s",
                        border: `2px solid ${mode === m.k ? m.color : T.border}`,
                        background: mode === m.k ? m.color + "20" : T.bg,
                        color: mode === m.k ? m.color : T.textMuted,
                    }}>
                        <span style={{ lineHeight: 1 }}>{m.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", letterSpacing: ".5px" }}>
                            {m.label.toUpperCase()}
                        </span>
                    </button>
                ))}
            </div>



            {/* Connect-from pill */}
            {connectFrom && (
                <button 
                    onClick={() => setConnectFrom && setConnectFrom(null)}
                    style={{
                        margin: "0 8px 8px", padding: "5px 8px", width: "calc(100% - 16px)",
                        background: "#F3EEFF", borderRadius: 6,
                        fontSize: 14, color: "#7B2FBE", fontWeight: 700, textAlign: "center",
                        border: "1px solid #C4B5FD", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                    <span>↳ FROM {connectFrom}</span>
                    <span style={{ fontSize: 16, fontWeight: 900, opacity: 0.6 }}>✕</span>
                </button>
            )}
        </div>
    );
}

export default ToolsCard;
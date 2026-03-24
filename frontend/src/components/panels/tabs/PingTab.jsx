import React from "react";
import { SectionLabel } from "../ControlPanel";

function PingTab({ routers, ripTables, nextHopMap, pingSrc, setPingSrc, pingDst, setPingDst, doPing, pingResult, activePath, T }) {
    return (
        <div>
            <SectionLabel T={T}>Ping Test</SectionLabel>
            {["Source", "Destination"].map((label, idx) => {
                const isSource = idx === 0;
                const val = isSource ? pingSrc : pingDst;
                const setter = isSource ? setPingSrc : setPingDst;
                return (
                    <div key={label} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, marginBottom: 4 }}>{label} Router</div>
                        <select value={val} onChange={e => setter(e.target.value)} style={{
                            width: "100%", padding: "7px 9px", border: `1.5px solid ${T.border}`, borderRadius: 7,
                            fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                            color: T.text, background: T.surface
                        }}>
                            <option value="">-- Select --</option>
                            {routers.filter(r => isSource || r.id !== pingSrc).map(r => (
                                <option key={r.id} value={r.id}>{r.id}</option>
                            ))}
                        </select>
                    </div>
                );
            })}
            <button onClick={doPing} disabled={!pingSrc || !pingDst} style={{
                width: "100%", padding: "10px",
                border: `1.5px solid ${pingSrc && pingDst ? T.warn + "88" : T.border}`,
                borderRadius: 9, cursor: pingSrc && pingDst ? "pointer" : "not-allowed",
                fontWeight: 700, fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                background: pingSrc && pingDst ? T.warnBg : T.bg,
                color: pingSrc && pingDst ? T.warn : T.textFaint,
                marginBottom: 12, transition: "all .15s"
            }}>🏓  SEND PING</button>

            {pingResult ? (
                <div style={{
                    padding: 12, borderRadius: 9,
                    background: pingResult.success ? T.successBg : T.dangerBg,
                    border: `1px solid ${pingResult.success ? T.success + "55" : T.danger + "55"}`
                }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: pingResult.success ? T.success : T.danger, marginBottom: 4 }}>
                        {pingResult.success ? "✓ SUCCESS" : "✕ UNREACHABLE"}
                    </div>
                    <div style={{ fontSize: 11, color: pingResult.success ? T.success : T.danger, fontFamily: "monospace" }}>
                        {pingResult.msg}
                    </div>
                    {activePath.length > 0 && (
                        <div style={{ marginTop: 6, fontSize: 10, color: T.textMuted }}>
                            Path: {activePath.join(" → ")}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ padding: 10, background: T.bg, borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 10, color: T.textFaint }}>
                    Select source and destination, then send ping to visualize route.
                </div>
            )}

            <div style={{ marginTop: 16 }}>
                <SectionLabel T={T}>All Routes</SectionLabel>
                {routers.length === 0
                    ? <div style={{ fontSize: 11, color: T.textFaint }}>No routers added yet.</div>
                    : routers.map(src => routers.filter(d => d.id !== src.id).map(dst => {
                        const cost = ripTables[src.id]?.[dst.id];
                        const ok = cost !== undefined && cost < Infinity;
                        return (
                            <div key={`${src.id}-${dst.id}`} style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "3px 0", borderBottom: `1px solid ${T.border}`, fontSize: 10
                            }}>
                                <span style={{ fontFamily: "monospace", color: T.textMuted }}>{src.id} → {dst.id}</span>
                                <span style={{
                                    padding: "1px 7px", borderRadius: 4, fontWeight: 700, fontSize: 10,
                                    background: ok ? T.accentBg : T.dangerBg,
                                    color: ok ? T.accent : T.danger
                                }}>
                                    {ok ? `${cost} hop${cost !== 1 ? "s" : ""}` : "∞"}
                                </span>
                            </div>
                        );
                    }))
                }
            </div>
        </div>
    );
}

export default PingTab;
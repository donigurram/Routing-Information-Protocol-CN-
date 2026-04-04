import React from "react";
import { SectionLabel } from "../ControlPanel";

function TableTab({ routers, ripTables, nextHopMap, selectedRouter, setSelectedRouter, T }) {
    return (
        <div>
            <SectionLabel T={T}>Routing Tables</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                {routers.map(r => (
                    <button key={r.id} onClick={() => setSelectedRouter(r.id)} style={{
                        padding: "4px 11px", borderRadius: 7, cursor: "pointer",
                        fontSize: 15, fontWeight: 700, fontFamily: "monospace",
                        background: selectedRouter === r.id ? r.color : T.bg,
                        color: selectedRouter === r.id ? "white" : T.textMuted,
                        border: `2px solid ${selectedRouter === r.id ? r.color : T.border}`,
                        transition: "all .15s"
                    }}>{r.id}</button>
                ))}
            </div>

            {selectedRouter && ripTables[selectedRouter] ? (() => {
                const r = routers.find(x => x.id === selectedRouter);
                return (
                    <div>
                        <div style={{
                            padding: "9px 12px", borderRadius: "9px 9px 0 0",
                            background: r?.color || T.accent, color: "white",
                            fontSize: 15, fontWeight: 700, fontFamily: "monospace"
                        }}>
                            {selectedRouter} — RIP Routing Table
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, fontFamily: "monospace" }}>
                            <thead>
                                <tr style={{ background: T.surfaceAlt }}>
                                    {["DEST", "NEXT HOP", "METRIC"].map(h => (
                                        <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: T.textFaint, fontWeight: 700, fontSize: 14 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {routers.filter(d => d.id !== selectedRouter).map(dest => {
                                    const cost = ripTables[selectedRouter]?.[dest.id];
                                    const hop = nextHopMap[selectedRouter]?.[dest.id];
                                    const ok = cost !== undefined && cost < Infinity && cost <= 15;
                                    return (
                                        <tr key={dest.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                                            <td style={{ padding: "5px 8px", fontWeight: 700, color: T.text }}>{dest.id}</td>
                                            <td style={{ padding: "5px 8px", color: "#7B2FBE" }}>{ok ? hop : "—"}</td>
                                            <td style={{ padding: "5px 8px" }}>
                                                <span style={{
                                                    padding: "1px 7px", borderRadius: 4, fontWeight: 700,
                                                    background: ok ? T.accentBg : T.dangerBg,
                                                    color: ok ? T.accent : T.danger
                                                }}>
                                                    {ok ? cost : "16 (∞)"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div style={{ marginTop: 8, padding: 8, background: T.bg, borderRadius: "0 0 8px 8px", fontSize: 14, color: T.textFaint }}>
                            Direct: 0 hops · Max: 15 · 16 = unreachable
                        </div>
                    </div>
                );
            })() : (
                <div style={{ padding: 12, background: T.bg, borderRadius: 9, fontSize: 15, color: T.textFaint }}>
                    {routers.length === 0 ? "No routers added yet." : "Select a router above to view its table."}
                </div>
            )}
        </div>
    );
}

export default TableTab;


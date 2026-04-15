import React from "react";
import { SectionLabel } from "../ControlPanel";

function RoutesTab({ routers, ripTables, T }) {
    return (
        <div>
            <SectionLabel T={T}>All Routes (Global View)</SectionLabel>
            {routers.length === 0
                ? <div style={{ fontSize: 15, color: T.textFaint }}>No routers added yet.</div>
                : routers.map(src => routers.filter(d => d.id !== src.id).map(dst => {
                    const cost = ripTables[src.id]?.[dst.id];
                    const ok = cost !== undefined && cost < Infinity && cost < 16;
                    return (
                        <div key={`${src.id}-${dst.id}`} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "3px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14
                        }}>
                            <span style={{ fontFamily: "monospace", color: T.textMuted }}>{src.id} → {dst.id}</span>
                            <span style={{
                                padding: "1px 7px", borderRadius: 4, fontWeight: 700, fontSize: 14,
                                background: ok ? T.accentBg : T.dangerBg,
                                color: ok ? T.accent : T.danger
                            }}>
                                {ok ? `cost ${cost}` : (cost === 16 ? "Counted to Infinity (16)" : "∞")}
                            </span>
                        </div>
                    );
                }))
            }
        </div>
    );
}

export default RoutesTab;

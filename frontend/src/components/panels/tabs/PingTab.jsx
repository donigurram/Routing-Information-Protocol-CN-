import React, { useEffect, useRef } from "react";
import { SectionLabel, Toggle } from "../ControlPanel";

function PingTab({ 
    routers, ripTables, nextHopMap, 
    pingSrc, setPingSrc, pingDst, setPingDst, 
    doPing, pingResult, activePath, 
    pingTTL, setPingTTL, pingLogs,
    T 
}) {
    const logsContainerRef = useRef(null);
    useEffect(() => {
        if (logsContainerRef.current) {
            logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
        }
    }, [pingLogs]);
    return (
        <div>
            <SectionLabel T={T}>Ping Test</SectionLabel>
            {["Source", "Destination"].map((label, idx) => {
                const isSource = idx === 0;
                const val = isSource ? pingSrc : pingDst;
                const setter = isSource ? setPingSrc : setPingDst;
                return (
                    <div key={label} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 14, color: T.textMuted, fontWeight: 600, marginBottom: 4 }}>{label} Router</div>
                        <select value={val} onChange={e => setter(e.target.value)} style={{
                            width: "100%", padding: "7px 9px", border: `1.5px solid ${T.border}`, borderRadius: 7,
                            fontSize: 16, fontFamily: "'JetBrains Mono', monospace",
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
            {/* Settings Row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 13, color: T.textMuted, fontWeight: 600, marginBottom: 4 }}>Time-To-Live</div>
                    <input type="number" min="1" max="15" value={pingTTL} onChange={e => setPingTTL(parseInt(e.target.value) || 15)} 
                    style={{
                        width: "100%", padding: "5px 8px", border: `1.5px solid ${T.border}`, borderRadius: 7,
                        fontSize: 15, fontFamily: "monospace", color: T.text, background: T.surface, boxSizing: "border-box"
                    }} />
                </div>
            </div>

            <button onClick={doPing} disabled={!pingSrc || !pingDst} style={{
                width: "100%", padding: "10px",
                border: `1.5px solid ${pingSrc && pingDst ? T.warn + "88" : T.border}`,
                borderRadius: 9, cursor: pingSrc && pingDst ? "pointer" : "not-allowed",
                fontWeight: 700, fontSize: 16, fontFamily: "'JetBrains Mono', monospace",
                background: pingSrc && pingDst ? T.warnBg : T.bg,
                color: pingSrc && pingDst ? T.warn : T.textFaint,
                marginBottom: 12, transition: "all .15s"
            }}>🏓  SEND PING</button>

            {/* Event Logs Box */}
            <div ref={logsContainerRef} style={{
                padding: 10, background: '#0a0a0a', border: `1.5px solid ${T.border}`, borderRadius: 9, 
                fontSize: 13, color: '#10b981', fontFamily: "'JetBrains Mono', monospace",
                height: 140, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4,
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)"
            }}>
                {pingLogs.length === 0 ? (
                    <div style={{ color: "#555", textAlign: "center", fontStyle: "italic", marginTop: 10 }}>
                        Awaiting ICMP execution...
                    </div>
                ) : (
                    pingLogs.map((log, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, opacity: i === pingLogs.length - 1 ? 1 : 0.7 }}>
                            <span style={{ color: "#555" }}>[{i.toString().padStart(2, '0')}]</span>
                            <span style={{ color: log.includes('✕') ? '#EF4444' : log.includes('✓') ? '#10B981' : '#EAB308' }}>
                                {log}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default PingTab;
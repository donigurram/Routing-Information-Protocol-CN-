import React, { useState } from "react";
import PingTab from "./tabs/PingTab";
import TableTab from "./tabs/TableTab";

export function Toggle({ value, onChange, T }) {
    return (
        <div onClick={() => onChange(!value)} style={{
            width: 38, height: 21, borderRadius: 999, cursor: "pointer", flexShrink: 0,
            background: value ? T.accent : T.border, position: "relative", transition: "background .2s"
        }}>
            <div style={{
                position: "absolute", top: 2.5, left: value ? 19 : 2.5,
                width: 16, height: 16, borderRadius: 999,
                background: value ? "#fff" : T.textFaint,
                transition: "left .2s, background .2s",
                boxShadow: "0 1px 3px rgba(0,0,0,.3)"
            }} />
        </div>
    );
}

export function SectionLabel({ children, T }) {
    return (
        <div style={{
            fontSize: 9, fontWeight: 700, color: T.textFaint,
            letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8
        }}>{children}</div>
    );
}

function Btn({ children, onClick, variant = "default", disabled, style, T }) {
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
            fontWeight: 700, fontSize: 11,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            opacity: disabled ? .45 : 1, transition: "all .15s", ...v, ...style
        }}>{children}</button>
    );
}

export default function ControlPanel({
    T,
    routers,
    ripRound,
    converged,
    activeTab,
    setActiveTab,
    pingSrc,
    setPingSrc,
    pingDst,
    setPingDst,
    doPing,
    pingResult,
    activePath,
    ripTables,
    nextHopMap,
    selectedRouter,
    setSelectedRouter,
    canStart,
    simRunning,
    toggleSim,
    animSpeed,
    setAnimSpeed,
    splitHorizon,
    setSplitHorizon,
    routePoisoning,
    setRoutePoisoning,
    loadPreset,
    spawnPreset,
    clearAll
}) {
    const [presetSize, setPresetSize] = useState(5);
    const TABS = [
        { k: "ping", label: "PING", icon: "🏓" },
        { k: "table", label: "TABLE", icon: "⊞" },
        { k: "sim", label: "SIM", icon: "⚙" },
    ];

    return (
        <div style={{
            width: 310, background: T.bg, borderLeft: `1.5px solid ${T.border}`,
            display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0,
            transition: "background .25s, border-color .25s",
        }}>

            {/* ── Panel header ── */}
            <div style={{
                background: T.accent, color: "white",
                padding: "11px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px",
                display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
            }}>
                <span style={{ fontSize: 14 }}>▣</span> CONTROL PANEL
                <div style={{
                    marginLeft: "auto", padding: "2px 9px", borderRadius: 20, fontSize: 10,
                    background: converged && routers.length > 1 ? "#FEF9C3" : "rgba(255,255,255,.15)",
                    color: converged && routers.length > 1 ? "#854D0E" : "rgba(255,255,255,.85)",
                    fontWeight: 700,
                }}>
                    {converged && routers.length > 1 ? "✓ Converged" : `Rd ${ripRound}`}
                </div>
            </div>

            {/* ── Pill-style tabs ── */}
            <div style={{
                padding: "10px 12px 0",
                background: T.surface,
                borderBottom: `1.5px solid ${T.border}`,
                flexShrink: 0,
            }}>
                <div style={{
                    display: "inline-flex", gap: 4,
                    background: T.bg, borderRadius: 10, padding: 4,
                    border: `1px solid ${T.border}`,
                }}>
                    {TABS.map(t => {
                        const active = activeTab === t.k;
                        return (
                            <button key={t.k} onClick={() => setActiveTab(t.k)} style={{
                                padding: "6px 14px",
                                borderRadius: 7,
                                border: "none",
                                cursor: "pointer",
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: ".5px",
                                fontFamily: "'JetBrains Mono', monospace",
                                display: "flex", alignItems: "center", gap: 5,
                                transition: "all .15s",
                                background: active ? T.accent : "transparent",
                                color: active ? "white" : T.textMuted,
                                boxShadow: active ? `0 2px 8px ${T.accent}44` : "none",
                            }}>
                                <span style={{ fontSize: 11 }}>{t.icon}</span>
                                {t.label}
                            </button>
                        );
                    })}
                </div>
                <div style={{ height: 10 }} />
            </div>

            {/* ── Tab content — scrollable ── */}
            <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
                {activeTab === "ping" && (
                    <PingTab
                        routers={routers} ripTables={ripTables} nextHopMap={nextHopMap}
                        pingSrc={pingSrc} setPingSrc={setPingSrc}
                        pingDst={pingDst} setPingDst={setPingDst}
                        doPing={doPing} pingResult={pingResult} activePath={activePath}
                        T={T}
                    />
                )}
                {activeTab === "table" && (
                    <TableTab
                        routers={routers} ripTables={ripTables} nextHopMap={nextHopMap}
                        selectedRouter={selectedRouter} setSelectedRouter={setSelectedRouter}
                        T={T}
                    />
                )}
                {activeTab === "sim" && (
                    <div>
                        {/* Status badge */}
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            marginBottom: 12,
                        }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: "1px" }}>
                                SIMULATION
                            </div>
                            <div style={{
                                padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: "1px solid",
                                background: simRunning ? T.successBg : converged && routers.length > 1 ? T.warnBg : T.bg,
                                color: simRunning ? T.success : converged && routers.length > 1 ? T.warn : T.textFaint,
                                borderColor: simRunning ? T.success + "55" : converged && routers.length > 1 ? T.warn + "55" : T.border,
                            }}>
                                {simRunning ? `● Rd ${ripRound}` : converged && routers.length > 1 ? "✓ Done" : "○ Idle"}
                            </div>
                        </div>

                        {!canStart && (
                            <div style={{ padding: "7px 10px", background: T.warnBg, border: `1px solid ${T.warn}44`, borderRadius: 8, fontSize: 10, color: T.warn, marginBottom: 10 }}>
                                ⚠ Add ≥2 routers and 1 link to start.
                            </div>
                        )}
                        <Btn
                            variant={simRunning ? "pause" : "sim"}
                            onClick={canStart ? toggleSim : undefined}
                            disabled={!canStart}
                            style={{ fontSize: 12, marginBottom: 12 }}
                            T={T}
                        >
                            {simRunning ? "⏸  PAUSE" : "▶  START SIMULATION"}
                        </Btn>

                        {/* Speed row */}
                        <div style={{ marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <span style={{ fontSize: 9, fontWeight: 700, color: T.textFaint, letterSpacing: "1px" }}>SPEED</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: T.accent }}>{animSpeed}×</span>
                            </div>
                            <input type="range" min=".25" max="4" step=".25" value={animSpeed}
                                onChange={e => setAnimSpeed(parseFloat(e.target.value))}
                                style={{ width: "100%", accentColor: T.accent }} />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: T.textFaint, marginTop: 2 }}>
                                <span>Slow</span><span>Fast</span>
                            </div>
                        </div>

                        {/* Feature toggles */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {[
                                [splitHorizon, setSplitHorizon, "Split Horizon", "No re-ads to source"],
                                [routePoisoning, setRoutePoisoning, "Route Poisoning", "Failed = metric 16"],
                            ].map(([val, setter, label, desc]) => (
                                <div key={label} style={{
                                    padding: "8px 10px", background: T.bg, borderRadius: 8,
                                    border: `1px solid ${T.border}`,
                                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                                }}>
                                    <div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: T.text }}>{label}</div>
                                        <div style={{ fontSize: 8, color: T.textFaint, marginTop: 1 }}>{desc}</div>
                                    </div>
                                    <Toggle value={val} onChange={setter} T={T} />
                                </div>
                            ))}
                        </div>

                    </div>
                )}

                {/* Presets & clear */}
                <div style={{ marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>

                    <div style={{ fontSize: 9, fontWeight: 700, color: T.textFaint, letterSpacing: "1.5px", marginBottom: 7, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>SPAWN ROUTERS</span>
                        <input type="number" min={1} max={20} value={presetSize} onChange={e => setPresetSize(parseInt(e.target.value) || 1)} style={{ width: 40, padding: 2, borderRadius: 4, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 10, fontFamily: "monospace", textAlign: "center" }} title="Number of routers to spawn" />
                    </div>
                    <div style={{ display: "flex", gap: 5, marginBottom: 7 }}>
                        {[["▬", "linear"], ["○", "ring"], ["⬡", "mesh"]].map(([icon, key]) => (
                            <button key={key} onClick={() => spawnPreset(key, presetSize)} style={{
                                flex: 1, padding: "6px 4px", border: `1px dashed ${T.border}`,
                                borderRadius: 7, cursor: "pointer", fontSize: 10, fontWeight: 600,
                                fontFamily: "'JetBrains Mono', monospace",
                                background: "transparent", color: T.textMuted,
                                transition: "all .15s",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = T.surfaceAlt; e.currentTarget.style.borderColor = T.accentBdr; e.currentTarget.style.color = T.accent; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
                            >{icon} {key.charAt(0).toUpperCase() + key.slice(1)}</button>
                        ))}
                    </div>
                    <button onClick={clearAll} style={{
                        width: "100%", padding: "7px", border: `1.5px solid ${T.danger}44`,
                        borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 10,
                        fontFamily: "'JetBrains Mono', monospace",
                        background: T.dangerBg, color: T.danger,
                    }}>✕  CLEAR ALL</button>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                borderTop: `1.5px solid ${T.border}`, padding: "6px 14px",
                fontSize: 9, color: T.textFaint, fontFamily: "monospace",
                background: T.surfaceAlt,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexShrink: 0,
            }}>
                <span>RIPv2 · Bellman-Ford · 15 hops</span>
                <span style={{ color: converged && routers.length > 1 ? T.success : T.danger, fontWeight: 700 }}>
                    {converged && routers.length > 1 ? "✓ Conv" : "Pending"}
                </span>
            </div>
        </div>
    );
}
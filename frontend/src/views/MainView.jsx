import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { useSimulation } from "../hooks/useSimulation";
import { useRouting } from "../hooks/useRouting";
import { usePing } from "../hooks/usePing";
import { useTopology } from "../hooks/useTopology";
import ThemeToggle from "../components/ui/ThemeToggle";

import ControlPanel from "../components/panels/ControlPanel";
import ToolsCard from "../components/panels/ToolsCard";

export default function MainView() {
    const svgRef = useRef(null);
    const { dark, setDark, T } = useTheme();

    const [routers, setRouters] = useState([]);
    const [links, setLinks] = useState([]);
    const [packets, setPackets] = useState([]);
    const [activePath, setActivePath] = useState([]);
    const [activeTab, setActiveTab] = useState("ping");

    const { ripTables, nextHopMap } = useRouting(routers, links);

    const {
        simRunning, ripRound, converged, animSpeed, setAnimSpeed,
        splitHorizon, setSplitHorizon, routePoisoning, setRoutePoisoning,
        toggleSim, resetSim
    } = useSimulation(routers, setRouters, setLinks, setPackets);

    const {
        pingSrc, setPingSrc, pingDst, setPingDst, pingResult, setPingResult, doPing
    } = usePing(nextHopMap, animSpeed, setPackets, setActivePath);

    const {
        mode, setMode, connectFrom, pendingCost, setPendingCost,
        selectedRouter, setSelectedRouter,
        handleCanvasClick, handleRouterClick, handleLinkClick,
        handleCanvasMouseDown, handleRouterMouseDown, handleMouseMove, handleMouseUp,
        loadPreset, spawnPreset, clearAll, pan, isPanning,
        editingLink, setEditingLink, updateLinkCost,
        undo, canUndo
    } = useTopology(routers, setRouters, links, setLinks, setPackets, setActivePath, setPingResult, resetSim);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (canUndo) undo();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [canUndo, undo]);

    const isPathLink = (la, lb) => {
        for (let i = 0; i < activePath.length - 1; i++)
            if ((activePath[i] === la && activePath[i + 1] === lb) || (activePath[i] === lb && activePath[i + 1] === la)) return true;
        return false;
    };

    const getPacketPos = pkt => {
        const from = routers.find(r => r.id === pkt.from), to = routers.find(r => r.id === pkt.to);
        if (!from || !to) return null;
        return { x: from.x + (to.x - from.x) * pkt.t, y: from.y + (to.y - from.y) * pkt.t };
    };

    const modeColors = { add: T.accent, connect: "#7B2FBE", delete: T.danger, move: T.warn, fail: "#9B5DE5", select: T.success };
    const modeLabels = { add: "⊕ ADD ROUTER", connect: "⟵⟶ CONNECT" + (connectFrom ? ` — from ${connectFrom}` : ""), delete: "✕ DELETE", move: "✥ MOVE", fail: "⚡ FAIL LINK", select: "◉ INSPECT" };
    const mc = modeColors[mode] || T.accent;
    const canStart = routers.length >= 2 && links.length > 0;

    return (
        <div style={{
            display: "flex", height: "100vh", width: "100%",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'IBM Plex Mono', monospace",
            background: T.bg, color: T.text, overflow: "hidden",
            transition: "background .25s, color .25s",
        }}>
            <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet" />

            {/* ══ CANVAS ══════════════════════════════════════════ */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                {/* Top bar */}
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
                    background: T.surface, borderBottom: `1.5px solid ${T.border}`,
                    padding: "8px 16px", display: "flex", alignItems: "center", gap: 10,
                    transition: "background .25s, border-color .25s",
                }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: T.accent, letterSpacing: "1px" }}>
                        RIPv2 <span style={{ color: T.textFaint, fontWeight: 400, fontSize: 11 }}>Simulator</span>
                    </div>
                    <div style={{
                        padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: "1px solid",
                        background: simRunning ? T.successBg : converged && routers.length > 1 ? T.warnBg : T.bg,
                        color: simRunning ? T.success : converged && routers.length > 1 ? T.warn : T.textFaint,
                        borderColor: simRunning ? T.success + "55" : converged && routers.length > 1 ? T.warn + "55" : T.border,
                    }}>
                        {simRunning ? `● RUNNING  —  Rd ${ripRound}` : converged && routers.length > 1 ? "✓ CONVERGED" : "○ IDLE"}
                    </div>
                    <div style={{ marginLeft: "auto", padding: "3px 11px", borderRadius: 7, fontSize: 11, fontWeight: 700, background: mc + "20", color: mc, border: `1px solid ${mc}44` }}>
                        {modeLabels[mode] || "UNKNOWN"}
                    </div>
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                        style={{
                            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: canUndo ? "pointer" : "not-allowed",
                            background: canUndo ? T.surfaceAlt : "transparent",
                            color: canUndo ? T.text : T.textFaint,
                            border: `1.5px solid ${canUndo ? T.border : "transparent"}`,
                            transition: "all .2s", display: "flex", alignItems: "center", gap: 5
                        }}
                    >
                        ↶ UNDO
                    </button>
                    <ThemeToggle dark={dark} onToggle={() => setDark(d => !d)} T={T} />
                </div>

                {/* Tools card */}
                <ToolsCard
                    mode={mode} setMode={setMode}
                    connectFrom={connectFrom}
                    pendingCost={pendingCost} setPendingCost={setPendingCost}
                    T={T}
                />

                {/* Canvas SVG */}
                <svg
                    ref={svgRef}
                    width="100%" height="100%"
                    style={{ display: "block", cursor: isPanning ? "grabbing" : mode === "add" ? "crosshair" : mode === "move" ? "grab" : "pointer" }}
                    onClick={e => handleCanvasClick(e, svgRef)}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={e => handleMouseMove(e, svgRef)}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <defs>
                        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform={`translate(${pan.x}, ${pan.y})`}>
                            <path d="M30 0L0 0 0 30" fill="none" stroke={T.gridLine} strokeWidth="0.8" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    <g transform={`translate(${pan.x}, ${pan.y})`}>

                        {/* Links */}
                        {links.map(l => {
                            const ra = routers.find(r => r.id === l.a), rb = routers.find(r => r.id === l.b);
                            if (!ra || !rb) return null;
                            const mx = (ra.x + rb.x) / 2, my = (ra.y + rb.y) / 2;
                            const isPath = isPathLink(l.a, l.b);
                            const stroke = l.failed ? T.danger + "88" : isPath ? "#F59E0B" : T.accent + "66";
                            return (
                                <g key={l.id} onClick={e => handleLinkClick(e, l.id)} style={{ cursor: "pointer" }}>
                                    <line x1={ra.x} y1={ra.y} x2={rb.x} y2={rb.y}
                                        stroke={stroke} strokeWidth={isPath ? 3.5 : 2}
                                        strokeDasharray={l.failed ? "6,4" : "none"} opacity={l.failed ? 0.6 : 1} />
                                    <rect x={mx - 12} y={my - 9} width={24} height={16} rx={4}
                                        fill={l.failed ? T.dangerBg : isPath ? "#FEF3C7" : T.surface}
                                        stroke={l.failed ? T.danger + "66" : isPath ? "#F59E0B" : T.border} strokeWidth={1} />
                                    {editingLink === l.id && !l.failed ? (
                                        <foreignObject x={mx - 12} y={my - 9} width={24} height={16}>
                                            <input
                                                autoFocus
                                                defaultValue={l.cost}
                                                onFocus={e => e.target.select()}
                                                onMouseDown={e => e.stopPropagation()}
                                                onClick={e => e.stopPropagation()}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') updateLinkCost(l.id, e.target.value);
                                                    if (e.key === 'Escape') setEditingLink(null);
                                                }}
                                                onBlur={e => updateLinkCost(l.id, e.target.value)}
                                                style={{
                                                    width: '100%', height: '100%', border: 'none', background: 'transparent',
                                                    color: isPath ? "#D97706" : T.textMuted,
                                                    textAlign: 'center', fontSize: 9, fontWeight: 700,
                                                    fontFamily: 'monospace', outline: 'none', padding: 0, margin: 0
                                                }}
                                                min={1} max={15} type="number"
                                            />
                                        </foreignObject>
                                    ) : (
                                        <text x={mx} y={my + 4} textAnchor="middle" fontSize={9} fontWeight={700}
                                            fill={l.failed ? T.danger : isPath ? "#D97706" : T.textMuted} fontFamily="monospace">
                                            {l.failed ? "✕" : l.cost}
                                        </text>
                                    )}
                                </g>
                            );
                        })}

                        {/* Packets */}
                        {packets.map(pkt => {
                            const pos = getPacketPos(pkt);
                            if (!pos) return null;
                            return (
                                <g key={pkt.id}>
                                    <circle cx={pos.x} cy={pos.y} r={pkt.type === "ping" ? 7 : 5} fill={pkt.color} opacity={0.9} />
                                    {pkt.type === "update" && <circle cx={pos.x} cy={pos.y} r={9} fill="none" stroke={pkt.color} strokeWidth={1.5} opacity={0.4} />}
                                </g>
                            );
                        })}

                        {/* Routers */}
                        {routers.map(r => {
                            const isPath = activePath.includes(r.id);
                            const isConn = connectFrom === r.id;
                            const isSel = selectedRouter === r.id;
                            const cnt = ripTables[r.id] ? Object.values(ripTables[r.id]).filter(v => v < Infinity && v > 0).length : 0;
                            return (
                                <g key={r.id} className="router-node"
                                    onClick={e => handleRouterClick(e, r.id, setActiveTab)}
                                    onMouseDown={e => handleRouterMouseDown(e, r.id, svgRef)}
                                    style={{ cursor: mode === "move" ? "grab" : "pointer" }}>
                                    {(isPath || isConn || isSel) && (
                                        <circle cx={r.x} cy={r.y} r={28} fill="none"
                                            stroke={isPath ? "#F59E0B" : isConn ? "#7B2FBE" : T.accent}
                                            strokeWidth={2.5} opacity={0.6} />
                                    )}
                                    <circle cx={r.x} cy={r.y} r={22} fill={r.color} stroke={T.surface} strokeWidth={3} />
                                    <text x={r.x} y={r.y + 5} textAnchor="middle" fontSize={11} fontWeight={800} fill="white" fontFamily="monospace">
                                        {r.id}
                                    </text>
                                    <text x={r.x} y={r.y + 36} textAnchor="middle" fontSize={9} fill={T.textFaint} fontFamily="monospace">
                                        {cnt} routes
                                    </text>
                                </g>
                            );
                        })}

                        {routers.length === 0 && (
                            <text x="50%" y="52%" textAnchor="middle" fill={T.textFaint} fontSize={13} fontFamily="monospace">
                                Click canvas to add routers → Connect → Simulate
                            </text>
                        )}
                    </g>
                </svg>
            </div>

            {/* ══ RIGHT PANEL ═════════════════════════════════════ */}
            <ControlPanel
                T={T} routers={routers} ripRound={ripRound} converged={converged}
                activeTab={activeTab} setActiveTab={setActiveTab}
                pingSrc={pingSrc} setPingSrc={setPingSrc} pingDst={pingDst} setPingDst={setPingDst}
                doPing={doPing} pingResult={pingResult} activePath={activePath}
                ripTables={ripTables} nextHopMap={nextHopMap}
                selectedRouter={selectedRouter} setSelectedRouter={setSelectedRouter}
                canStart={canStart} simRunning={simRunning} toggleSim={toggleSim}
                animSpeed={animSpeed} setAnimSpeed={setAnimSpeed}
                splitHorizon={splitHorizon} setSplitHorizon={setSplitHorizon}
                routePoisoning={routePoisoning} setRoutePoisoning={setRoutePoisoning}
                loadPreset={loadPreset} spawnPreset={spawnPreset} clearAll={clearAll}
            />
        </div>
    );
}

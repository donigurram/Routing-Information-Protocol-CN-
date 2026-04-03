import React, { useState, useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Html, Line, Sphere, OrbitControls, Grid, TransformControls, Stars } from '@react-three/drei';
import { useTheme } from "../hooks/useTheme";
import { useSimulation } from "../hooks/useSimulation";
import { useRouting } from "../hooks/useRouting";
import { usePing } from "../hooks/usePing";
import { useTopology } from "../hooks/useTopology";
import ThemeToggle from "../components/ui/ThemeToggle";

import ControlPanel from "../components/panels/ControlPanel";
import ToolsCard from "../components/panels/ToolsCard";

function AnimatedRouter({ r, isPath, isConn, isSel, cnt, T, handleRouterClick, svgRef, pan, setActiveTab, mode, updateRouter3DPos }) {
    const palette = ["#4361EE", "#06D6A0", "#EF233C", "#F77F00", "#7B2FBE", "#0077B6"];
    const cIdx = parseInt(r.id.replace('R','')) || 0;
    const color = palette[cIdx % palette.length];
    
    const groupRef = useRef();

    return (
        <>
            {mode === "move" && isSel && (
                <TransformControls 
                    object={groupRef} 
                    mode="translate" 
                    size={0.6}
                    onObjectChange={() => {
                        if (groupRef.current) {
                            const p = groupRef.current.position;
                            updateRouter3DPos(r.id, p.x, p.y, p.z);
                        }
                    }}
                />
            )}
            <group ref={groupRef} position={[r.x, r.y, r.z || 0]} 
                onClick={e => { e.stopPropagation(); handleRouterClick(e.nativeEvent || e, r.id, setActiveTab); }}
            >
                {/* Glowing Sphere */}
            <group position={[0, 0, 0]}>
                <mesh>
                    <sphereGeometry args={[16, 32, 32]} />
                    <meshStandardMaterial 
                        color="#0f172a" 
                        emissive={isSel ? "#10b981" : color} 
                        emissiveIntensity={isSel ? 0.8 : 0.5} 
                        roughness={0.1} 
                        metalness={0.6} 
                    />
                </mesh>
                {/* Subtle Outer Glow Halo to blend strongly with links/background */}
                <mesh position={[0, 0, -1]}>
                    <circleGeometry args={[22, 32]} />
                    <meshBasicMaterial color={isSel ? "#10b981" : color} transparent opacity={0.15} />
                </mesh>
            </group>

            <Html center zIndexRange={[100, 50]} position={[0, 0, 16]} style={{ pointerEvents: 'none' }}>
                <div style={{ textAlign: "center", textShadow: "0 1px 4px rgba(0,0,0,1)" }}>
                    <div style={{ color: "#f8fafc", fontSize: 14, fontFamily: "monospace", fontWeight: "bold" }}>
                        {r.id.toUpperCase()}
                    </div>
                </div>
                {cnt > 0 && (
                    <div style={{ position: "absolute", top: "18px", left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {cnt} routes
                    </div>
                )}
            </Html>
            </group>
        </>
    );
}

function NetworkScene({ 
    is3D, pan, routers, links, packets, mode, T, ripTables, activePath, connectFrom, selectedRouter,
    handleRouterClick, handleRouterMouseDown, svgRef, setActiveTab,
    isPathLink, getPacketPos, handleLinkClick, editingLink, setEditingLink, updateLinkCost,
    dragging, handleCanvasClick, handleMouseMove, handleMouseUp, updateRouter3DPos, addRouter3D
}) {
    const { camera } = useThree();
    const controlsRef = useRef();

    useEffect(() => {
        if (controlsRef.current) {
            if (!is3D) {
                camera.position.set(400, 300, 550);
            } else {
                camera.position.set(400, -50, 500);
            }
            controlsRef.current.target.set(400, 300, 0);
            controlsRef.current.update();
        }
    }, [is3D, camera]);

    return (
        <group>
            <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.05} enabled={!dragging} enableRotate={is3D} target={[400, 300, 0]} />

            {/* Background Invisible Raycast World Plane Z=0 */}
            <mesh 
                position={[0,0,0]}
                onClick={e => {
                    e.stopPropagation();
                    if (mode === "add" && !e.ctrlKey) {
                        // Natively invoke true intersections from THREE.Raycaster bypassing DOM matrices!
                        addRouter3D(e.point.x, e.point.y, 0);
                        console.log("Computed Intersection Point:", e.point);
                    }
                }}
                onPointerMove={e => {
                    if (mode === "move" && dragging) {
                        e.stopPropagation();
                        // For smooth dragging, we use the intersection point on the horizontal XZ floor plane
                        const rect = svgRef.current.getBoundingClientRect();
                        handleMouseMove({
                            clientX: e.point.x + rect.left + pan.x,
                            clientY: e.point.z + rect.top + pan.y,
                            ctrlKey: false
                        }, svgRef);
                    }
                }}
                onPointerUp={(e) => {
                    e.stopPropagation();
                    handleMouseUp();
                }}
                onPointerLeave={(e) => {
                    if (dragging) handleMouseUp();
                }}
            >
                <planeGeometry args={[100000, 100000]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} side={2} />
            </mesh>

            {/* 3D Floor Grid removed as per sleek flat aesthetic request */}
            
            {/* Links */}
            {links.map(l => {
                const ra = routers.find(r => r.id === l.a), rb = routers.find(r => r.id === l.b);
                if (!ra || !rb) return null;
                const mx = (ra.x + rb.x) / 2, my = (ra.y + rb.y) / 2;
                const isPath = isPathLink(l.a, l.b);
                const stroke = l.failed ? T.danger : isPath ? "#F59E0B" : "rgba(30, 58, 138, 0.9)";
                return (
                    <group key={l.id} 
                        onClick={e => { e.stopPropagation(); handleLinkClick(e.nativeEvent || e, l.id); }} 
                        onPointerDown={e => e.stopPropagation()}
                    >
                        <>
                            <Line
                                points={[[ra.x, ra.y, (ra.z || 0) - 1], [rb.x, rb.y, (rb.z || 0) - 1]]}
                                color={l.failed ? stroke : isPath ? "#F59E0B" : "#3b82f6"}
                                lineWidth={isPath ? 14 : 10}
                                transparent opacity={0.15}
                            />
                            <Line
                                points={[[ra.x, ra.y, (ra.z || 0) - 0.5], [rb.x, rb.y, (rb.z || 0) - 0.5]]}
                                color={l.failed ? stroke : isPath ? "#FBBF24" : "#60a5fa"}
                                lineWidth={isPath ? 3.5 : 1.5}
                                dashed={l.failed}
                                dashSize={8} gapSize={5}
                                transparent opacity={l.failed ? 0.6 : 0.8}
                            />
                        </>
                        <Html position={[mx, my, ((ra.z||0)+(rb.z||0))/2]} center zIndexRange={[10, 0]}>
                            <div style={{
                                background: l.failed ? "rgba(239, 68, 68, 0.9)" : isPath ? "rgba(245, 158, 11, 0.9)" : "rgba(234, 179, 8, 0.9)",
                                color: l.failed ? "#fff" : "#000",
                                borderRadius: "4px",
                                fontSize: "12px",
                                padding: "2px 8px",
                                fontWeight: "bold",
                                cursor: "pointer",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                backdropFilter: "blur(4px)",
                                userSelect: "none",
                                pointerEvents: "auto",
                                border: l.failed ? "1px solid #ef4444" : "1px solid #eab308"
                            }}
                            onMouseDown={e => e.stopPropagation()}
                            onClick={e => { e.stopPropagation(); handleLinkClick(e, l.id); }}
                            >
                                {editingLink === l.id && !l.failed ? (
                                    <input
                                        autoFocus
                                        defaultValue={l.cost}
                                        onFocus={e => e.target.select()}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') updateLinkCost(l.id, e.target.value);
                                            if (e.key === 'Escape') setEditingLink(null);
                                        }}
                                        onBlur={e => updateLinkCost(l.id, e.target.value)}
                                        style={{
                                            width: 30, height: 20, border: 'none', background: 'transparent',
                                            color: "#000",
                                            textAlign: 'center', fontSize: 12, fontWeight: "bold",
                                            fontFamily: 'monospace', outline: 'none', padding: 0, margin: 0
                                        }}
                                        min={1} max={15} type="number"
                                    />
                                ) : (
                                    l.failed ? "✕" : `🐾 ${l.cost}`
                                )}
                            </div>
                        </Html>
                    </group>
                );
            })}

            {/* Packets */}
            {packets.map(pkt => {
                if (pkt.t < 0) return null;
                const pos = getPacketPos(pkt);
                if (!pos) return null;
                
                const ghosts = [];
                for(let i=1; i<=4; i++) {
                    const ghostT = pkt.t - (i * 0.04);
                    if (ghostT > 0) {
                        const ghostPos = getPacketPos({...pkt, t: ghostT});
                        if (ghostPos) ghosts.push({ p: [ghostPos.x, ghostPos.y, ghostPos.z || 0], opacity: 1 - (i * 0.22) });
                    }
                }

                const isPing = pkt.type === "ping";
                const pColor = isPing ? "#F59E0B" : "#4361EE";

                return (
                    <group key={pkt.id}>
                        <mesh position={[pos.x, pos.y, (pos.z || 0) + 2]}>
                            <sphereGeometry args={[isPing ? 8 : 4.5, 32, 32]} />
                            <meshBasicMaterial color={pColor} />
                        </mesh>
                        {ghosts.map((g, i) => (
                            <mesh key={i} position={[g.p[0], g.p[1], (g.p[2]||0) + 2]}>
                                <sphereGeometry args={[isPing ? 7 : 4, 16, 16]} />
                                <meshBasicMaterial color={pColor} transparent opacity={g.opacity * 0.5} blending={2} depthWrite={false} />
                            </mesh>
                        ))}
                        <mesh position={[pos.x, pos.y, (pos.z || 0) + 1]}>
                            <sphereGeometry args={[isPing ? 14 : 9, 16, 16]} />
                            <meshBasicMaterial color={pColor} transparent opacity={0.2} blending={2} depthWrite={false} />
                        </mesh>
                    </group>
                );
            })}

            {/* Routers */}
            {routers.map(r => {
                const isPath = activePath.includes(r.id);
                const isConn = connectFrom === r.id;
                const isSel = selectedRouter === r.id;
                const cnt = ripTables[r.id] ? Object.values(ripTables[r.id]).filter(v => v < Infinity && v > 0).length : 0;
                return <AnimatedRouter key={r.id} r={r} isPath={isPath} isConn={isConn} isSel={isSel} cnt={cnt} T={T} handleRouterClick={handleRouterClick} svgRef={svgRef} pan={pan} setActiveTab={setActiveTab} mode={mode} updateRouter3DPos={updateRouter3DPos} />;
            })}
            
            {routers.length === 0 && (
                <Html center position={[0,-10,0]} style={{ pointerEvents: 'none', width: 400, textAlign: 'center' }}>
                    <div style={{ color: T.textFaint, fontSize: 13, fontFamily: "monospace" }}>
                        Click canvas to add routers → Connect → Simulate
                    </div>
                </Html>
            )}
        </group>
    );
}

export default function MainView() {
    const svgRef = useRef(null);
    const { dark, setDark, T } = useTheme();

    const [routers, setRouters] = useState([]);
    const [links, setLinks] = useState([]);
    const [packets, setPackets] = useState([]);
    const [activePath, setActivePath] = useState([]);
    const [activeTab, setActiveTab] = useState("ping");
    const [is3D, setIs3D] = useState(false);

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
        loadPreset, spawnPreset, clearAll, pan, isPanning, dragging,
        editingLink, setEditingLink, updateLinkCost,
        undo, canUndo, updateRouter3DPos, addRouter3D
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
            background: "#0A0D1A", color: T.text, overflow: "hidden",
            transition: "background .25s, color .25s",
        }}>
            <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet" />

            {/* ══ CANVAS ══════════════════════════════════════════ */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden", userSelect: "none", WebkitUserSelect: "none" }}>
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
                    <button
                        onClick={() => setIs3D(!is3D)}
                        style={{
                            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                            background: is3D ? T.accent + "20" : T.surfaceAlt,
                            color: is3D ? T.accent : T.text,
                            border: `1.5px solid ${is3D ? T.accent : T.border}`,
                            transition: "all .2s", display: "flex", alignItems: "center", gap: 5,
                            marginLeft: 10, marginRight: 10
                        }}
                    >
                        {is3D ? "3D" : "2D"}
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

                {/* Interactive Wrapper matching SVG bounds */}
                <div 
                    ref={svgRef}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}
                >
                    {/* 3D Scene */}
                    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}>
                        <Canvas camera={{ position: [400, 300, 550], fov: 60 }}>
                            <color attach="background" args={["#060812"]} />
                            <ambientLight intensity={0.6} />
                            <directionalLight position={[100, 100, 300]} intensity={1.2} />
                            <Stars radius={1500} depth={50} count={3000} factor={5} saturation={0.5} fade speed={0.5} />
                            <NetworkScene 
                                is3D={is3D} pan={pan} routers={routers} links={links} packets={packets} mode={mode} T={T} 
                                ripTables={ripTables} activePath={activePath} connectFrom={connectFrom} selectedRouter={selectedRouter}
                                handleRouterClick={handleRouterClick} handleRouterMouseDown={handleRouterMouseDown} svgRef={svgRef} setActiveTab={setActiveTab}
                                isPathLink={isPathLink} getPacketPos={getPacketPos} handleLinkClick={handleLinkClick} 
                                editingLink={editingLink} setEditingLink={setEditingLink} updateLinkCost={updateLinkCost}
                                dragging={dragging} handleCanvasClick={handleCanvasClick} handleMouseMove={handleMouseMove} handleMouseUp={handleMouseUp}
                                updateRouter3DPos={updateRouter3DPos} addRouter3D={addRouter3D}
                            />
                        </Canvas>
                    </div>
                </div>
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

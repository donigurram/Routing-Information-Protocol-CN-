import React, { useState, useRef, useEffect, Suspense } from "react";
import { Canvas, useThree, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Html, Line, Sphere, OrbitControls, Grid, TransformControls, Stars } from '@react-three/drei';
import { useTheme } from "../hooks/useTheme";
import { useSimulation } from "../hooks/useSimulation";
import { useRouting } from "../hooks/useRouting";
import { usePing } from "../hooks/usePing";
import { useTopology } from "../hooks/useTopology";
import ControlPanel from "../components/panels/ControlPanel";
import ToolsCard from "../components/panels/ToolsCard";

function ProceduralModel({ type, color, isBroadcasting }) {
    const activityRef = useRef();
    
    useFrame(({ clock }) => {
        if (activityRef.current) {
            // Fast blink when broadcasting, slow idle pulse otherwise
            activityRef.current.intensity = isBroadcasting 
                ? (Math.sin(clock.elapsedTime * 25) + 1) * 3
                : (Math.sin(clock.elapsedTime * 2) + 1) * 0.5;
        }
    });


    
    // Default: Router
    return (
        <group position={[0, 0, 0]}>
            {/* Router body */}
            <mesh position={[0, 0, 0]}><boxGeometry args={[14, 4, 10]} /><meshStandardMaterial color="#1c1c1e" roughness={0.9} /></mesh>
            {/* Antennas */}
            <mesh position={[-4.5, 4, -3]}><cylinderGeometry args={[0.2, 0.4, 8]} /><meshStandardMaterial color="#111" /></mesh>
            <mesh position={[4.5, 4, -3]}><cylinderGeometry args={[0.2, 0.4, 8]} /><meshStandardMaterial color="#111" /></mesh>
            <mesh position={[0, 3, -4]}><cylinderGeometry args={[0.2, 0.4, 6]} /><meshStandardMaterial color="#111" /></mesh>
            
            {/* Front display panel */}
            <mesh position={[0, 0, 5.1]}><planeGeometry args={[12, 1.5]} /><meshBasicMaterial color="#000" /></mesh>
            {/* Status LEDs */}
            <mesh position={[-4, 0, 5.2]}><circleGeometry args={[0.4, 16]} /><meshBasicMaterial color={color} /></mesh>
            <mesh position={[-2, 0, 5.2]}><circleGeometry args={[0.3, 16]} /><meshBasicMaterial color={color} transparent opacity={0.5} /></mesh>
            
            <pointLight ref={activityRef} position={[-4, 0, 10]} distance={30} color={isBroadcasting ? "#06b6d4" : color} />
        </group>
    );
}

// 3D Model wrapper that handles loading custom GLB or showing procedural fallback
function DeviceModel({ color, isSel, isPath, isConn, isBroadcasting }) {
    const [gltfModel, setGltfModel] = useState(null);
    const hlColor   = isSel ? '#10b981' : isBroadcasting ? '#06b6d4' : isPath ? '#F59E0B' : isConn ? '#a855f7' : color;
    const ringAlpha = (isSel || isBroadcasting) ? 0.65 : 0.5;
    
    // Attempt to load external GLB (User can drop these files into /public/models/)
    useEffect(() => {
        const loader = new GLTFLoader();
        loader.load(`/models/router.glb`, 
            (gltf) => setGltfModel(gltf.scene.clone()), 
            undefined, 
            (error) => { /* Silently use procedural fallback if model not found */ }
        );
    }, []);

    return (
        <group>
            {/* Base platform disc behind the device */}
            <mesh position={[0, 0, -5]}>
                <circleGeometry args={[14, 32]} />
                <meshBasicMaterial color="#0a0a0a" transparent opacity={0.8} />
            </mesh>

            {/* Selection / path / connect / broadcast highlight ring around the base */}
            {(isSel || isPath || isConn || isBroadcasting) && (
                <mesh position={[0, 0, -5.2]}>
                    <ringGeometry args={[15, 17, 64]} />
                    <meshBasicMaterial color={hlColor} transparent opacity={ringAlpha} depthWrite={false} side={THREE.DoubleSide} />
                </mesh>
            )}
            
            {/* Second outer pulse ring when selected or broadcasting */}
            {(isSel || isBroadcasting) && (
                <mesh position={[0, 0, -5.5]}>
                    <ringGeometry args={[19, 21, 64]} />
                    <meshBasicMaterial color={hlColor} transparent opacity={0.25} depthWrite={false} side={THREE.DoubleSide} />
                </mesh>
            )}

            {/* Render GLTF if loaded, otherwise render procedural fallback */}
            {gltfModel ? (
                <primitive object={gltfModel} scale={8} position={[0, -5, 0]} />
            ) : (
                <ProceduralModel color={color} isBroadcasting={isBroadcasting} />
            )}
        </group>
    );
}

function AnimatedRouter({ r, isPath, isConn, isSel, isBroadcasting, cnt, T, handleRouterClick, handleRouterMouseDown, svgRef, pan, setActiveTab, mode, updateRouter3DPos, multiSelected, updateMultiRouter3DPos }) {
    const palette = ["#4361EE", "#06D6A0", "#EF233C", "#F77F00", "#7B2FBE", "#0077B6"];
    const cIdx = parseInt(r.id.replace('R','')) || 0;
    const color = palette[cIdx % palette.length];
    
    const groupRef = useRef();
    const prevPos = useRef({ x: r.x, y: r.y, z: r.z || 0 });

    useEffect(() => {
        prevPos.current = { x: r.x, y: r.y, z: r.z || 0 };
    }, [r.x, r.y, r.z]);

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
                            const dx = p.x - prevPos.current.x;
                            const dy = p.y - prevPos.current.y;
                            const dz = p.z - prevPos.current.z;
                            
                            if (dx !== 0 || dy !== 0 || dz !== 0) {
                                prevPos.current = { x: p.x, y: p.y, z: p.z };
                                if (multiSelected && multiSelected.length > 1 && multiSelected.includes(r.id)) {
                                    updateMultiRouter3DPos(r.id, p.x, p.y, p.z, dx, dy, dz);
                                } else {
                                    updateRouter3DPos(r.id, p.x, p.y, p.z);
                                }
                            }
                        }
                    }}
                />
            )}
            <group ref={groupRef} position={[r.x, r.y, r.z || 0]} 
                onClick={e => { e.stopPropagation(); handleRouterClick(e.nativeEvent || e, r.id, setActiveTab); }}
                onPointerDown={e => { e.stopPropagation(); if(handleRouterMouseDown) handleRouterMouseDown({clientX: e.clientX, clientY: e.clientY, ctrlKey: e.ctrlKey}, r.id, svgRef); }}
            >
                {/* Realistic Device Model with fallback */}
                <Suspense fallback={null}>
                    <DeviceModel 
                        color={color} 
                        isSel={isSel} 
                        isPath={isPath} 
                        isConn={isConn} 
                        isBroadcasting={isBroadcasting} 
                    />
                </Suspense>

            <Html center zIndexRange={[100, 50]} position={[0, 16, 0]} style={{ pointerEvents: 'none' }}>
                <div style={{ 
                    textAlign: "center", 
                    background: "rgba(0,0,0,0.65)", 
                    padding: "4px 10px", 
                    borderRadius: "8px", 
                    border: "1px solid rgba(255,255,255,0.15)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    backdropFilter: "blur(2px)"
                }}>
                    <div style={{ color: "#ffffff", fontSize: 15, fontFamily: "monospace", fontWeight: "bold", letterSpacing: '1px' }}>
                        {r.id.toUpperCase()}
                    </div>
                    {cnt > 0 && (
                        <div style={{ fontSize: 11, color: "#38bdf8", whiteSpace: "nowrap", marginTop: "2px" }}>
                            {cnt} {cnt === 1 ? 'route' : 'routes'}
                        </div>
                    )}
                </div>
            </Html>
            </group>
        </>
    );
}

function NetworkScene({ 
    is3D, pan, routers, links, packets, mode, T, ripTables, activePath, connectFrom, selectedRouter,
    multiSelected, isBoxSelectMode, selectionBox, activeBroadcaster,
    handleRouterClick, handleRouterMouseDown, svgRef, setActiveTab,
    isPathLink, getPacketPos, handleLinkClick, editingLink, setEditingLink, updateLinkCost,
    dragging, handleCanvasClick, handleCanvasMouseDown, handleMouseMove, handleMouseUp, updateRouter3DPos, updateMultiRouter3DPos, addRouter3D
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

    const isBoxActive = selectionBox && isBoxSelectMode;
    const boxW = isBoxActive ? Math.abs(selectionBox.endX - selectionBox.startX) : 0;
    const boxH = isBoxActive ? Math.abs(selectionBox.endY - selectionBox.startY) : 0;
    const boxCX = isBoxActive ? (selectionBox.startX + selectionBox.endX) / 2 : 0;
    const boxCY = isBoxActive ? (selectionBox.startY + selectionBox.endY) / 2 : 0;
    
    const clickStartRef = useRef({ x: 0, y: 0 });

    return (
        <group>
            <OrbitControls 
                ref={controlsRef} 
                makeDefault 
                enableDamping 
                dampingFactor={0.05} 
                enabled={!dragging && !isBoxSelectMode} 
                enableRotate={is3D} 
                mouseButtons={{
                    LEFT: is3D ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN,
                    MIDDLE: THREE.MOUSE.DOLLY,
                    RIGHT: THREE.MOUSE.PAN
                }}
                target={[400, 300, 0]} 
            />

            {isBoxActive && boxW > 0 && boxH > 0 && (
                <>
                    <mesh position={[boxCX, boxCY, 5]}>
                        <planeGeometry args={[boxW, boxH]} />
                        <meshBasicMaterial color="#06B6D4" transparent opacity={0.15} side={THREE.DoubleSide} />
                    </mesh>
                    <Line
                        points={[
                            [boxCX - boxW/2, boxCY - boxH/2, 5.1],
                            [boxCX + boxW/2, boxCY - boxH/2, 5.1],
                            [boxCX + boxW/2, boxCY + boxH/2, 5.1],
                            [boxCX - boxW/2, boxCY + boxH/2, 5.1],
                            [boxCX - boxW/2, boxCY - boxH/2, 5.1]
                        ]}
                        color="#06B6D4"
                        lineWidth={1.5}
                    />
                </>
            )}

            {/* Background Invisible Raycast World Plane Z=0 */}
            <mesh 
                name="CanvasPlane"
                position={[0,0,0]}
                onPointerDown={e => {
                    const evt = { clientX: e.clientX, clientY: e.clientY, point: e.point, target: svgRef.current, ctrlKey: e.ctrlKey, button: e.button };
                    if (isBoxSelectMode) {
                        e.stopPropagation();
                        // Pass svgRef to useTopology method
                        handleCanvasMouseDown(evt, svgRef);
                    } else {
                        // Yield to scene objects so we don't intercept pointer down for routers from the back
                        const hitOther = e.intersections.some(hit => hit.object.name !== "CanvasPlane" && hit.object.type !== "Points");
                        if (hitOther) return;
                        
                        clickStartRef.current = { x: e.clientX, y: e.clientY };
                    }
                }}
                onClick={e => {
                    if (isBoxSelectMode) return;
                    
                    // Yield to any other intersected meshes (routers, links) so the invisible plane doesn't block them 
                    const hitOther = e.intersections.some(hit => hit.object.name !== "CanvasPlane" && hit.object.type !== "Points");
                    if (hitOther) return; 

                    e.stopPropagation();
                    
                    const dx = Math.abs(e.clientX - clickStartRef.current.x);
                    const dy = Math.abs(e.clientY - clickStartRef.current.y);
                    if (dx > 5 || dy > 5) return; // Prevent action if user dragged the canvas

                    if (mode === "add" && !e.ctrlKey) {
                        addRouter3D(e.point.x, e.point.y, 0);
                    }
                    if (mode !== "add") {
                       handleCanvasClick({ clientX: e.clientX, clientY: e.clientY, ctrlKey: e.ctrlKey, target: svgRef.current }, svgRef);
                    }
                }}
                onPointerMove={e => {
                    if (isBoxSelectMode || dragging) {
                        e.stopPropagation();
                        handleMouseMove({
                            clientX: e.clientX,
                            clientY: e.clientY,
                            point: e.point,
                            ctrlKey: false
                        }, svgRef);
                    }
                }}
                onPointerUp={(e) => {
                    e.stopPropagation();
                    handleMouseUp(null);
                }}
                onPointerLeave={(e) => {
                    if (dragging || isBoxSelectMode) handleMouseUp();
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
                                            textAlign: 'center', fontSize: 16, fontWeight: "bold",
                                            fontFamily: 'monospace', outline: 'none', padding: 0, margin: 0
                                        }}
                                        min={1} max={15} type="number"
                                    />
                                ) : (
                                    l.failed ? "✕" : l.cost
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
                const pColor = pkt.color || (isPing ? "#F59E0B" : "#4361EE");

                return (
                    <group key={pkt.id}>
                        <mesh position={[pos.x, pos.y, (pos.z || 0) + 2]}>
                            <sphereGeometry args={[isPing ? 5 : 4.5, 32, 32]} />
                            <meshBasicMaterial color={pColor} />
                            {pkt.label && (
                                <Html center position={[0, -14, 0]} style={{ pointerEvents: 'none', zIndex: 100 }}>
                                    <div style={{ color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", background: "rgba(0,0,0,0.8)", border: `1px solid ${pColor}`, fontFamily: 'monospace', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                        {pkt.label}
                                    </div>
                                </Html>
                            )}
                        </mesh>
                        {ghosts.map((g, i) => (
                            <mesh key={i} position={[g.p[0], g.p[1], (g.p[2]||0) + 2]}>
                                <sphereGeometry args={[isPing ? 4.5 : 4, 16, 16]} />
                                <meshBasicMaterial color={pColor} transparent opacity={g.opacity * 0.5} blending={2} depthWrite={false} />
                            </mesh>
                        ))}
                        <mesh position={[pos.x, pos.y, (pos.z || 0) + 1]}>
                            <sphereGeometry args={[isPing ? 10 : 9, 16, 16]} />
                            <meshBasicMaterial color={pColor} transparent opacity={0.2} blending={2} depthWrite={false} />
                        </mesh>
                    </group>
                );
            })}

            {/* Routers */}
            {routers.map(r => {
                const isPath = activePath.includes(r.id);
                const isConn = connectFrom === r.id;
                const isSel = selectedRouter === r.id || multiSelected?.includes(r.id);
                const isBroadcasting = activeBroadcaster === r.id;
                const cnt = ripTables[r.id] ? Object.values(ripTables[r.id]).filter(v => v < Infinity && v > 0).length : 0;
                return <AnimatedRouter key={r.id} r={r} isPath={isPath} isConn={isConn} isSel={isSel} isBroadcasting={isBroadcasting} cnt={cnt} T={T} handleRouterClick={handleRouterClick} handleRouterMouseDown={handleRouterMouseDown} svgRef={svgRef} pan={pan} setActiveTab={setActiveTab} mode={mode} updateRouter3DPos={updateRouter3DPos} multiSelected={multiSelected} updateMultiRouter3DPos={updateMultiRouter3DPos} />;
            })}
            
            {routers.length === 0 && (
                <Html center position={[0,-10,0]} style={{ pointerEvents: 'none', width: 400, textAlign: 'center' }}>
                    <div style={{ color: T.textFaint, fontSize: 17, fontFamily: "monospace" }}>
                        Click canvas to add routers → Connect → Simulate
                    </div>
                </Html>
            )}
        </group>
    );
}

export default function MainView() {
    const svgRef = useRef(null);
    const { T } = useTheme();

    const [routers, setRouters] = useState([]);
    const [links, setLinks] = useState([]);
    const [packets, setPackets] = useState([]);
    const [activePath, setActivePath] = useState([]);
    const [activeTab, setActiveTab] = useState("ping");
    const [is3D, setIs3D] = useState(false);

    const [simRunning, setSimRunning] = useState(false);

    const { ripTables, nextHopMap, setRipTables, setNextHopMap, tablesRef, initializeTables, applyUpdate } = useRouting(routers, links, simRunning);

    const {
        ripRound, converged, animSpeed, setAnimSpeed,
        splitHorizon, setSplitHorizon, routePoisoning, setRoutePoisoning,
        toggleSim, resetSim, activeBroadcaster
    } = useSimulation(routers, setRouters, links, setLinks, setPackets, simRunning, setSimRunning, tablesRef, applyUpdate, setRipTables, setNextHopMap, initializeTables);

    const {
        pingSrc, setPingSrc, pingDst, setPingDst, pingResult, setPingResult, doPing, activePingNode,
        pingTTL, setPingTTL, pingLogs, setPingLogs
    } = usePing(nextHopMap, animSpeed, setPackets, setActivePath, routers, links);

    const {
        mode, setMode, connectFrom, pendingCost, setPendingCost,
        selectedRouter, setSelectedRouter,
        multiSelected, setMultiSelected,
        isBoxSelectMode, setIsBoxSelectMode,
        selectionBox, deleteMultiSelected,
        handleCanvasClick, handleRouterClick, handleLinkClick,
        handleCanvasMouseDown, handleRouterMouseDown, handleMouseMove, handleMouseUp,
        loadPreset, spawnPreset, clearAll, pan, isPanning, dragging,
        editingLink, setEditingLink, updateLinkCost,
        undo, canUndo, redo, canRedo, updateRouter3DPos, updateMultiRouter3DPos, addRouter3D
    } = useTopology(routers, setRouters, links, setLinks, setPackets, setActivePath, setPingResult, resetSim);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    if (canRedo) redo();
                } else {
                    if (canUndo) undo();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                if (canRedo) redo();
            }
            // Delete key removes multi-selected nodes
            if ((e.key === 'Delete' || e.key === 'Backspace') && multiSelected.length > 0) {
                if (document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault();
                    deleteMultiSelected();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [canUndo, undo, canRedo, redo, multiSelected, deleteMultiSelected]);

    const isPathLink = (la, lb) => {
        for (let i = 0; i < activePath.length - 1; i++)
            if ((activePath[i] === la && activePath[i + 1] === lb) || (activePath[i] === lb && activePath[i + 1] === la)) return true;
        return false;
    };

    const getPacketPos = pkt => {
        const from = routers.find(r => r.id === pkt.from), to = routers.find(r => r.id === pkt.to);
        if (!from || !to) return null;
        return { 
            x: from.x + (to.x - from.x) * pkt.t, 
            y: from.y + (to.y - from.y) * pkt.t,
            z: (from.z || 0) + ((to.z || 0) - (from.z || 0)) * pkt.t
        };
    };

    const modeColors = { add: T.accent, connect: "#7B2FBE", delete: T.danger, move: T.warn, fail: "#9B5DE5", select: T.success, none: T.textFaint };
    const modeLabels = { add: "⊕ ADD ROUTER", connect: "⟵⟶ CONNECT" + (connectFrom ? ` — from ${connectFrom}` : ""), delete: "✕ DELETE", move: "✥ MOVE", fail: "⚡ FAIL LINK", select: "◉ INSPECT", none: "∅ VIEW ONLY" };
    const mc = modeColors[mode] || T.textFaint;
    const canStart = routers.length >= 2 && links.length > 0;

    return (
        <div style={{
            display: "flex", height: "100vh", width: "100%",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'IBM Plex Mono', monospace",
            backgroundColor: T.bg, backgroundImage: T.bgImage,
            backgroundSize: T.bgSize, backgroundPosition: T.bgPos,
            color: T.text, overflow: "hidden",
            transition: "background-color .25s, color .25s",
        }}>
            <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet" />

            {/* ══ CANVAS ══════════════════════════════════════════ */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden", userSelect: "none", WebkitUserSelect: "none" }}>
                {/* Top bar */}
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
                    height: 48, boxSizing: "border-box",
                    background: T.surface, borderBottom: `1px solid ${T.border}`,
                    padding: "0 12px", display: "flex", alignItems: "center", gap: 8,
                    transition: "background .25s, border-color .25s",
                }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: T.accent, letterSpacing: "1px" }}>
                        RIPv2 <span style={{ color: T.textFaint, fontWeight: 400, fontSize: 13 }}>Simulator</span>
                    </div>
                    <div style={{
                        padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1px solid",
                        background: simRunning ? T.successBg : converged && routers.length > 1 ? T.warnBg : T.bg,
                        color: simRunning ? T.success : converged && routers.length > 1 ? T.warn : T.textFaint,
                        borderColor: simRunning ? T.success + "55" : converged && routers.length > 1 ? T.warn + "55" : T.border,
                    }}>
                        {simRunning ? `● RUNNING  —  Rd ${ripRound}` : converged && routers.length > 1 ? "✓ CONVERGED" : "○ IDLE"}
                    </div>
                    
                    {/* Multi-Select Tool */}
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                            onClick={() => setIsBoxSelectMode(!isBoxSelectMode)}
                            style={{
                                padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
                                background: isBoxSelectMode ? T.accent : "transparent",
                                color: isBoxSelectMode ? "white" : T.accent,
                                border: `1px solid ${T.accent}`,
                                transition: "all .2s"
                            }}
                        >
                            {isBoxSelectMode ? "⏹ CANCEL" : "⚄ SELECT AREA"}
                        </button>
                    </div>

                    <div style={{ padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: isBoxSelectMode ? T.accent + "20" : mc + "20", color: isBoxSelectMode ? T.accent : mc, border: `1px solid ${isBoxSelectMode ? T.accent : mc}44` }}>
                        {isBoxSelectMode ? "⚄ DRAW SELECTION BOX" : modeLabels[mode] || "UNKNOWN"}
                    </div>
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                        style={{
                            padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: canUndo ? "pointer" : "not-allowed",
                            background: canUndo ? T.surfaceAlt : "transparent",
                            color: canUndo ? T.text : T.textFaint,
                            border: `1px solid ${canUndo ? T.border : "transparent"}`,
                            transition: "all .2s", display: "flex", alignItems: "center", gap: 4
                        }}
                    >
                        ↶ UNDO
                    </button>
                    <button
                        onClick={redo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
                        style={{
                            padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: canRedo ? "pointer" : "not-allowed",
                            background: canRedo ? T.surfaceAlt : "transparent",
                            color: canRedo ? T.text : T.textFaint,
                            border: `1px solid ${canRedo ? T.border : "transparent"}`,
                            transition: "all .2s", display: "flex", alignItems: "center", gap: 4
                        }}
                    >
                        ↷ REDO
                    </button>
                    <button
                        onClick={() => setIs3D(!is3D)}
                        style={{
                            padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
                            background: is3D ? T.accent + "20" : T.surfaceAlt,
                            color: is3D ? T.accent : T.text,
                            border: `1px solid ${is3D ? T.accent : T.border}`,
                            transition: "all .2s", display: "flex", alignItems: "center", gap: 4,
                            marginLeft: 4, marginRight: 4
                        }}
                    >
                        {is3D ? "3D" : "2D"}
                    </button>
                    <button
                        onClick={clearAll}
                        title="Clear entire network"
                        style={{
                            padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                            background: T.danger + "15",
                            color: T.danger,
                            border: `1px solid ${T.danger}44`,
                            transition: "all .2s", display: "flex", alignItems: "center", gap: 4,
                            marginRight: 8
                        }}
                    >
                        ✕ CLEAR ALL
                    </button>
                </div>

                {/* Tools card */}
                <ToolsCard
                    mode={mode} setMode={setMode}
                    connectFrom={connectFrom}
                    pendingCost={pendingCost} setPendingCost={setPendingCost}
                    T={T}
                />

                {/* Floating Multi-Select Action Bar */}
                {multiSelected.length > 0 && (
                    <div style={{
                        position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
                        zIndex: 30, display: "flex", alignItems: "center", gap: 8,
                        background: T.surface, border: `1.5px solid #06B6D4`,
                        borderRadius: 12, padding: "8px 14px",
                        boxShadow: `0 4px 24px #06B6D444`,
                    }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#06B6D4", letterSpacing: "1px" }}>
                            {multiSelected.length} NODE{multiSelected.length > 1 ? 'S' : ''} SELECTED
                        </span>
                        <div style={{ width: 1, height: 16, background: T.border }} />
                        <button
                            onClick={() => setMode("move")}
                            style={{
                                padding: "4px 10px", borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: "pointer",
                                background: mode === "move" ? "#F59E0B22" : "transparent",
                                color: "#F59E0B",
                                border: `1px solid #F59E0B66`,
                                transition: "all .15s"
                            }}
                        >✥ MOVE</button>
                        <button
                            onClick={deleteMultiSelected}
                            style={{
                                padding: "4px 10px", borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: "pointer",
                                background: T.dangerBg,
                                color: T.danger,
                                border: `1px solid ${T.danger}66`,
                                transition: "all .15s"
                            }}
                        >✕ DELETE</button>
                        <button
                            onClick={() => setMultiSelected([])}
                            style={{
                                padding: "4px 8px", borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: "pointer",
                                background: "transparent",
                                color: T.textFaint,
                                border: `1px solid ${T.border}`,
                                transition: "all .15s"
                            }}
                        >✕</button>
                    </div>
                )}

                {/* Interactive Wrapper matching SVG bounds */}
                <div 
                    ref={svgRef}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}
                >
                    {/* 3D Scene */}
                    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}>
                        <Canvas camera={{ position: [400, 300, 550], fov: 60, far: 20000 }}>
                            <color attach="background" args={["#02040f"]} />
                            {/* Bright ambient so Earth is visible all around */}
                            <ambientLight intensity={1.8} color="#ffffff" />
                            {/* Sun-like key light from upper-front */}
                            <directionalLight position={[400, 300, 800]} intensity={4.5} color="#fff8f0" />
                            {/* Warm fill from opposite side */}
                            <pointLight position={[600, 100, 300]} intensity={1.8} color="#c0d8ff" distance={3000} />
                            {/* Front fill so dark side isn't pitch black */}
                            <pointLight position={[400, 300, 600]} intensity={1.2} color="#ffffff" distance={2000} />
                            {/* Vivid starfield - dense and colourful */}
                            <group position={[400, 300, 0]}>
                                <Stars radius={900} depth={650} count={3500} factor={105} saturation={1.5} fade speed={1.1} />
                            </group>
                            <NetworkScene 
                                is3D={is3D} pan={pan} routers={routers} links={links} packets={packets} mode={mode} T={T} 
                                ripTables={ripTables} activePath={activePath} connectFrom={connectFrom} selectedRouter={selectedRouter}
                                multiSelected={multiSelected} isBoxSelectMode={isBoxSelectMode} selectionBox={selectionBox} activeBroadcaster={activeBroadcaster}
                                handleRouterClick={handleRouterClick} handleRouterMouseDown={handleRouterMouseDown} svgRef={svgRef} setActiveTab={setActiveTab}
                                isPathLink={isPathLink} getPacketPos={getPacketPos} handleLinkClick={handleLinkClick} 
                                editingLink={editingLink} setEditingLink={setEditingLink} updateLinkCost={updateLinkCost}
                                dragging={dragging} handleCanvasClick={handleCanvasClick} handleCanvasMouseDown={handleCanvasMouseDown} handleMouseMove={handleMouseMove} handleMouseUp={handleMouseUp}
                                updateRouter3DPos={updateRouter3DPos} updateMultiRouter3DPos={updateMultiRouter3DPos} addRouter3D={addRouter3D}
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
                pingTTL={pingTTL} setPingTTL={setPingTTL} pingLogs={pingLogs} setPingLogs={setPingLogs}
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

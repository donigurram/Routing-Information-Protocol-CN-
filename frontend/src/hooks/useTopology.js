import { useState, useRef } from "react";
import { ROUTER_COLORS } from "./useSimulation";

export function useTopology(routers, setRouters, links, setLinks, setPackets, setActivePath, setPingResult, resetSim) {
    const nextId = useRef(1);
    const [mode, setMode] = useState("add");
    const [connectFrom, setConnectFrom] = useState(null);
    const [dragging, setDragging] = useState(null);
    const [dragOff, setDragOff] = useState({ x: 0, y: 0 });
    const [pendingCost, setPendingCost] = useState(1);
    const [selectedRouter, setSelectedRouter] = useState(null);

    const handleCanvasClick = (e, svgRef) => {
        if (mode !== "add" || e.target.closest(".router-node")) return;
        const r = svgRef.current.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        if (y < 52) return;
        const id = `R${nextId.current++}`;
        const color = ROUTER_COLORS[(routers.length) % ROUTER_COLORS.length];
        setRouters(prev => [...prev, { id, x, y, color }]);
    };

    const handleRouterClick = (e, rid, setActiveTab) => {
        e.stopPropagation();
        if (mode === "connect") {
            if (!connectFrom) { setConnectFrom(rid); }
            else if (connectFrom !== rid) {
                const exists = links.find(l => (l.a === connectFrom && l.b === rid) || (l.a === rid && l.b === connectFrom));
                if (!exists) {
                    setLinks(prev => [...prev, { id: `${connectFrom}-${rid}`, a: connectFrom, b: rid, cost: pendingCost, failed: false }]);
                }
                setConnectFrom(null);
            }
        } else if (mode === "delete") {
            setRouters(prev => prev.filter(r => r.id !== rid));
            setLinks(prev => prev.filter(l => l.a !== rid && l.b !== rid));
        } else if (mode === "select") {
            setSelectedRouter(rid); 
            if (setActiveTab) setActiveTab("table");
        }
    };

    const handleLinkClick = (e, lid) => {
        e.stopPropagation();
        if (mode === "delete") {
            setLinks(prev => prev.filter(l => l.id !== lid));
        } else if (mode === "fail") {
            setLinks(prev => prev.map(l => l.id === lid ? { ...l, failed: !l.failed } : l));
        }
    };

    const handleRouterMouseDown = (e, rid, svgRef) => {
        if (mode !== "move") return;
        e.stopPropagation();
        const rect = svgRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left, py = e.clientY - rect.top;
        const r = routers.find(r => r.id === rid);
        if (r) {
            setDragging(rid); 
            setDragOff({ x: px - r.x, y: py - r.y });
        }
    };

    const handleMouseMove = (e, svgRef) => {
        if (!dragging) return;
        const rect = svgRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left, py = e.clientY - rect.top;
        setRouters(prev => prev.map(r => r.id === dragging ? { ...r, x: px - dragOff.x, y: py - dragOff.y } : r));
    };

    const handleMouseUp = () => setDragging(null);

    const loadPreset = (type) => {
        setRouters([]); setLinks([]); setPackets([]); setActivePath([]);
        resetSim();
        nextId.current = 1; setPingResult(null);
        if (type === "linear") {
            setRouters([
                { id: "R1", x: 130, y: 300, color: ROUTER_COLORS[0] }, { id: "R2", x: 320, y: 300, color: ROUTER_COLORS[1] },
                { id: "R3", x: 510, y: 300, color: ROUTER_COLORS[2] }, { id: "R4", x: 700, y: 300, color: ROUTER_COLORS[3] },
            ]);
            setLinks([
                { id: "R1-R2", a: "R1", b: "R2", cost: 1, failed: false },
                { id: "R2-R3", a: "R2", b: "R3", cost: 2, failed: false },
                { id: "R3-R4", a: "R3", b: "R4", cost: 1, failed: false },
            ]);
            nextId.current = 5;
        } else if (type === "ring") {
            const cx = 440, cy = 310, r = 175;
            const rs = Array.from({ length: 5 }, (_, i) => {
                const a = (i / 5) * 2 * Math.PI - Math.PI / 2;
                return { id: `R${i + 1}`, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), color: ROUTER_COLORS[i] };
            });
            setRouters(rs);
            setLinks(rs.map((r, i) => ({ id: `${r.id}-${rs[(i + 1) % 5].id}`, a: r.id, b: rs[(i + 1) % 5].id, cost: Math.floor(Math.random() * 3) + 1, failed: false })));
            nextId.current = 6;
        } else if (type === "mesh") {
            setRouters([
                { id: "R1", x: 220, y: 180, color: ROUTER_COLORS[0] }, { id: "R2", x: 470, y: 160, color: ROUTER_COLORS[1] },
                { id: "R3", x: 660, y: 290, color: ROUTER_COLORS[2] }, { id: "R4", x: 510, y: 450, color: ROUTER_COLORS[3] },
                { id: "R5", x: 260, y: 450, color: ROUTER_COLORS[4] }, { id: "R6", x: 120, y: 330, color: ROUTER_COLORS[5] },
            ]);
            setLinks([
                { id: "R1-R2", a: "R1", b: "R2", cost: 1, failed: false }, { id: "R2-R3", a: "R2", b: "R3", cost: 2, failed: false },
                { id: "R3-R4", a: "R3", b: "R4", cost: 1, failed: false }, { id: "R4-R5", a: "R4", b: "R5", cost: 3, failed: false },
                { id: "R5-R6", a: "R5", b: "R6", cost: 1, failed: false }, { id: "R6-R1", a: "R6", b: "R1", cost: 2, failed: false },
                { id: "R1-R4", a: "R1", b: "R4", cost: 4, failed: false }, { id: "R2-R5", a: "R2", b: "R5", cost: 3, failed: false },
            ]);
            nextId.current = 7;
        }
    };

    const clearAll = () => {
        setRouters([]); setLinks([]); setPackets([]); setActivePath([]);
        resetSim();
        nextId.current = 1; setPingResult(null); setSelectedRouter(null);
    };

    return {
        mode, setMode,
        connectFrom, setConnectFrom,
        pendingCost, setPendingCost,
        selectedRouter, setSelectedRouter,
        handleCanvasClick, handleRouterClick, handleLinkClick,
        handleRouterMouseDown, handleMouseMove, handleMouseUp,
        loadPreset, clearAll,
        dragging
    };
}

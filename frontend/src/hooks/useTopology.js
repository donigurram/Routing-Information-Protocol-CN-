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

    // Undo state
    const [history, setHistory] = useState([]);

    const pushHistory = (rs = routers, ls = links) => {
        setHistory(prev => {
            const newHist = [...prev, { routers: [...rs], links: [...ls] }];
            if (newHist.length > 50) newHist.shift();
            return newHist;
        });
    };

    const undo = () => {
        if (history.length === 0) return;
        const last = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        setRouters(last.routers);
        setLinks(last.links);
        setPackets([]); setActivePath([]); setPingResult(null);
        resetSim();
        setMode("move");
    };

    // Pan state
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [hasDragged, setHasDragged] = useState(false);
    const [editingLink, setEditingLink] = useState(null);

    const updateLinkCost = (lid, newCost) => {
        const cost = parseInt(newCost, 10);
        if (!isNaN(cost) && cost > 0 && cost <= 16) {
            pushHistory();
            setLinks(prev => prev.map(l => l.id === lid ? { ...l, cost } : l));
        }
        setEditingLink(null);
    };

    const handleCanvasMouseDown = (e) => {
        if (e.ctrlKey) {
            setIsPanning(true);
            setHasDragged(false);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleCanvasClick = (e, svgRef) => {
        setEditingLink(null);
        if (e.ctrlKey || hasDragged || isPanning) return;
        if (mode !== "add" || e.target.closest(".router-node")) return;
        const r = svgRef.current.getBoundingClientRect();
        if (e.clientY - r.top < 52) return;
        const x = e.clientX - r.left - pan.x, y = e.clientY - r.top - pan.y;
        const id = `R${nextId.current++}`;
        const color = ROUTER_COLORS[(routers.length) % ROUTER_COLORS.length];
        pushHistory();
        setRouters(prev => [...prev, { id, x, y, color }]);
    };

    const handleRouterClick = (e, rid, setActiveTab) => {
        if (e.ctrlKey || hasDragged || isPanning) return;
        e.stopPropagation();
        if (mode === "connect") {
            if (!connectFrom) { setConnectFrom(rid); }
            else if (connectFrom !== rid) {
                const exists = links.find(l => (l.a === connectFrom && l.b === rid) || (l.a === rid && l.b === connectFrom));
                if (!exists) {
                    pushHistory();
                    setLinks(prev => [...prev, { id: `${connectFrom}-${rid}`, a: connectFrom, b: rid, cost: pendingCost, failed: false }]);
                }
                setConnectFrom(null);
            }
        } else if (mode === "delete") {
            pushHistory();
            setRouters(prev => prev.filter(r => r.id !== rid));
            setLinks(prev => prev.filter(l => l.a !== rid && l.b !== rid));
        } else if (mode === "select") {
            setSelectedRouter(rid); 
            if (setActiveTab) setActiveTab("table");
        }
    };

    const handleLinkClick = (e, lid) => {
        if (e.ctrlKey || hasDragged || isPanning) return;
        e.stopPropagation();
        if (mode === "delete") {
            pushHistory();
            setLinks(prev => prev.filter(l => l.id !== lid));
        } else if (mode === "fail") {
            pushHistory();
            setLinks(prev => prev.map(l => l.id === lid ? { ...l, failed: !l.failed } : l));
        } else {
            setEditingLink(lid);
        }
    };

    const [dragStartRouters, setDragStartRouters] = useState(null);

    const handleRouterMouseDown = (e, rid, svgRef) => {
        if (e.ctrlKey) return; // let canvas pan handle this
        if (mode !== "move") return;
        e.stopPropagation();
        const rect = svgRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left - pan.x, py = e.clientY - rect.top - pan.y;
        const r = routers.find(r => r.id === rid);
        if (r) {
            setDragStartRouters([...routers]);
            setDragging(rid); 
            setDragOff({ x: px - r.x, y: py - r.y });
        }
    };

    const handleMouseMove = (e, svgRef) => {
        if (isPanning) {
            const newPan = { x: e.clientX - panStart.x, y: e.clientY - panStart.y };
            if (Math.abs(newPan.x - pan.x) > 2 || Math.abs(newPan.y - pan.y) > 2) {
                setHasDragged(true);
            }
            setPan(newPan);
            return;
        }

        if (!dragging) return;
        const rect = svgRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left - pan.x, py = e.clientY - rect.top - pan.y;
        setRouters(prev => prev.map(r => r.id === dragging ? { ...r, x: px - dragOff.x, y: py - dragOff.y } : r));
    };

    const handleMouseUp = () => {
        if (dragging && dragStartRouters) {
            if (JSON.stringify(dragStartRouters) !== JSON.stringify(routers)) {
                pushHistory(dragStartRouters, links);
            }
        }
        setDragging(null);
        setDragStartRouters(null);
        if (isPanning) {
            setIsPanning(false);
            setTimeout(() => setHasDragged(false), 50);
        }
    };

    const loadPreset = (type) => {
        pushHistory();
        setRouters([]); setLinks([]); setPackets([]); setActivePath([]);
        resetSim();
        setPan({ x: 0, y: 0 });
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
        pushHistory();
        setRouters([]); setLinks([]); setPackets([]); setActivePath([]);
        resetSim();
        setPan({ x: 0, y: 0 });
        nextId.current = 1; setPingResult(null); setSelectedRouter(null);
    };

    return {
        mode, setMode,
        connectFrom, setConnectFrom,
        pendingCost, setPendingCost,
        selectedRouter, setSelectedRouter,
        handleCanvasClick, handleRouterClick, handleLinkClick,
        handleCanvasMouseDown, handleRouterMouseDown, handleMouseMove, handleMouseUp,
        loadPreset, clearAll,
        dragging, pan, isPanning,
        editingLink, setEditingLink, updateLinkCost,
        undo, canUndo: history.length > 0
    };
}

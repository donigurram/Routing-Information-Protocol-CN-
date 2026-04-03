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
    const [multiSelected, setMultiSelected] = useState([]);
    const [isBoxSelectMode, setIsBoxSelectMode] = useState(false);
    const [selectionBox, setSelectionBox] = useState(null);
    const [dragOffMap, setDragOffMap] = useState({});

    const [customPresets, setCustomPresets] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ripCustomPresets')) || []; }
        catch { return []; }
    });

    const saveCustomPreset = () => {
        if (routers.length === 0) return;
        const minX = Math.min(...routers.map(r => r.x));
        const minY = Math.min(...routers.map(r => r.y));
        const newPreset = {
            id: Date.now().toString(),
            name: `Custom ${customPresets.length + 1}`,
            routers: routers.map(r => ({ ...r, x: r.x - minX + 130, y: r.y - minY + 150 })),
            links: links.map(l => ({ ...l }))
        };
        const updated = [...customPresets, newPreset];
        setCustomPresets(updated);
        localStorage.setItem('ripCustomPresets', JSON.stringify(updated));
    };

    const deleteCustomPreset = (id) => {
        const updated = customPresets.filter(p => p.id !== id);
        setCustomPresets(updated);
        localStorage.setItem('ripCustomPresets', JSON.stringify(updated));
    };

    const loadCustomPreset = (preset) => {
        resetSim();
        setPackets([]);
        setActivePath([]);
        setPingResult(null);

        const startIndex = nextId.current;
        const rMap = {};
        const offset = Math.floor(Math.random() * 30);
        const mappedRouters = preset.routers.map((r, i) => {
            const newId = `R${startIndex + i}`;
            rMap[r.id] = newId;
            return { ...r, id: newId, x: r.x + offset, y: r.y + offset, color: ROUTER_COLORS[(routers.length + i) % ROUTER_COLORS.length] };
        });
        const mappedLinks = preset.links.map(l => ({
            ...l,
            id: `${rMap[l.a]}-${rMap[l.b]}`,
            a: rMap[l.a],
            b: rMap[l.b]
        }));
        
        setRouters(prev => [...prev, ...mappedRouters]);
        setLinks(prev => [...prev, ...mappedLinks]);
        nextId.current = startIndex + preset.routers.length;
    };

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
        if (isBoxSelectMode) {
            const svgElement = e.target.closest('svg');
            if (svgElement) {
                const rect = svgElement.getBoundingClientRect();
                const px = e.clientX - rect.left - pan.x;
                const py = e.clientY - rect.top - pan.y;
                setSelectionBox({ startX: px, startY: py, endX: px, endY: py });
            }
            return;
        }

        // Allow panning via Ctrl-click, middle/right click, double-click, or just a normal left click on the empty background
        if (e.ctrlKey || e.button === 1 || e.button === 2 || e.detail >= 2 || (e.button === 0 && e.target.id === 'bg-canvas')) {
            setIsPanning(true);
            setHasDragged(false);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleCanvasClick = (e, svgRef) => {
        setEditingLink(null);
        if (isBoxSelectMode) return;
        
        if (multiSelected.length > 0 && mode !== 'add') {
             setMultiSelected([]); // Clear multi-select on background click
        }
        if (e.ctrlKey || hasDragged || isPanning) return;
        if (mode !== "add" || e.target.closest(".router-node")) return;
        const r = svgRef.current.getBoundingClientRect();
        const x = e.clientX - r.left - pan.x, y = e.clientY - r.top - pan.y;
        const id = `R${nextId.current++}`;
        const color = ROUTER_COLORS[(routers.length) % ROUTER_COLORS.length];
        pushHistory();
        setRouters(prev => [...prev, { id, x, y, color }]);
    };

    const handleRouterClick = (e, rid, setActiveTab) => {
        if (e.ctrlKey || hasDragged || isPanning || isBoxSelectMode) return;
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
            if (multiSelected.includes(rid)) {
                setRouters(prev => prev.filter(r => !multiSelected.includes(r.id)));
                setLinks(prev => prev.filter(l => !multiSelected.includes(l.a) && !multiSelected.includes(l.b)));
                setMultiSelected([]);
            } else {
                setRouters(prev => prev.filter(r => r.id !== rid));
                setLinks(prev => prev.filter(l => l.a !== rid && l.b !== rid));
            }
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
        // Allow dragging multi-selected nodes directly without needing MOVE mode
        const isInGroup = multiSelected.includes(rid);
        if (!isInGroup && mode !== "move") return;
        e.stopPropagation();
        const rect = svgRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left - pan.x, py = e.clientY - rect.top - pan.y;
        
        setDragStartRouters([...routers]);

        if (isInGroup) {
            setDragging("MULTI");
            const offMap = {};
            multiSelected.forEach(id => {
                const r = routers.find(rt => rt.id === id);
                if (r) offMap[id] = { x: px - r.x, y: py - r.y };
            });
            setDragOffMap(offMap);
        } else {
            const r = routers.find(r => r.id === rid);
            if (r) {
                setDragging(rid); 
                setDragOff({ x: px - r.x, y: py - r.y });
            }
        }
    };

    const handleMouseMove = (e, svgRef) => {
        if (selectionBox) {
            const rect = svgRef.current.getBoundingClientRect();
            const px = e.clientX - rect.left - pan.x, py = e.clientY - rect.top - pan.y;
            setSelectionBox(prev => ({ ...prev, endX: px, endY: py }));
            return;
        }

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
        
        if (dragging === "MULTI") {
            setRouters(prev => prev.map(r => {
                if (multiSelected.includes(r.id) && dragOffMap[r.id]) {
                    return { ...r, x: px - dragOffMap[r.id].x, y: py - dragOffMap[r.id].y };
                }
                return r;
            }));
        } else {
            setRouters(prev => prev.map(r => r.id === dragging ? { ...r, x: px - dragOff.x, y: py - dragOff.y } : r));
        }
    };

    const handleMouseUp = () => {
        if (selectionBox) {
            const minX = Math.min(selectionBox.startX, selectionBox.endX);
            const maxX = Math.max(selectionBox.startX, selectionBox.endX);
            const minY = Math.min(selectionBox.startY, selectionBox.endY);
            const maxY = Math.max(selectionBox.startY, selectionBox.endY);
            
            const inBox = routers.filter(r => 
                r.x >= minX && r.x <= maxX && r.y >= minY && r.y <= maxY
            ).map(r => r.id);
            
            if (inBox.length > 0) {
                setMultiSelected(inBox);
            } else {
                setMultiSelected([]);
            }
            setSelectionBox(null);
            setIsBoxSelectMode(false);
            return;
        }

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

    const generateTopology = (type, size, startIndex, offset, currentLength) => {
        const newRouters = [];
        const newLinks = [];
        const rMap = {};

        if (type === "linear") {
            const startX = 130 + offset, y = 300 + offset;
            for (let i = 0; i < size; i++) {
                const id = `R${startIndex + i}`;
                rMap[i] = id;
                newRouters.push({ id, x: startX + i * 140, y, color: ROUTER_COLORS[(currentLength + i) % ROUTER_COLORS.length] });
                if (i > 0) {
                    newLinks.push({ id: `${rMap[i-1]}-${id}`, a: rMap[i-1], b: id, cost: Math.floor(Math.random() * 3) + 1, failed: false });
                }
            }
        } else if (type === "ring") {
            const cx = 440 + offset, cy = 310 + offset, r = 175;
            for (let i = 0; i < size; i++) {
                const a = (i / size) * 2 * Math.PI - Math.PI / 2;
                const id = `R${startIndex + i}`;
                rMap[i] = id;
                newRouters.push({ id, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), color: ROUTER_COLORS[(currentLength + i) % ROUTER_COLORS.length] });
            }
            for (let i = 0; i < size; i++) {
                const aId = rMap[i], bId = rMap[(i + 1) % size];
                newLinks.push({ id: `${aId}-${bId}`, a: aId, b: bId, cost: Math.floor(Math.random() * 3) + 1, failed: false });
            }
        } else if (type === "mesh") {
            const cx = 440 + offset, cy = 310 + offset, r = 175;
            for (let i = 0; i < size; i++) {
                const a = (i / size) * 2 * Math.PI - Math.PI / 2;
                const id = `R${startIndex + i}`;
                rMap[i] = id;
                newRouters.push({ id, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), color: ROUTER_COLORS[(currentLength + i) % ROUTER_COLORS.length] });
            }
            for (let i = 0; i < size; i++) {
                for (let j = i + 1; j < size; j++) {
                    const aId = rMap[i], bId = rMap[j];
                    newLinks.push({ id: `${aId}-${bId}`, a: aId, b: bId, cost: Math.floor(Math.random() * 3) + 1, failed: false });
                }
            }
        }
        return { newRouters, newLinks };
    };

    const spawnPreset = (type, size = 5) => {
        if (size < 1) size = 1;
        resetSim();
        setPackets([]);
        setActivePath([]);
        setPingResult(null);

        const startIndex = nextId.current;
        const offset = Math.floor(Math.random() * 40);
        
        const { newRouters, newLinks } = generateTopology(type, size, startIndex, offset, routers.length);

        setRouters(prev => [...prev, ...newRouters]);
        setLinks(prev => [...prev, ...newLinks]);
        nextId.current = startIndex + size;
    };

    const loadPreset = (type) => {
        pushHistory();
        setRouters([]); setLinks([]); setPackets([]); setActivePath([]);
        resetSim();
        setPan({ x: 0, y: 0 });
        nextId.current = 1; setPingResult(null); setSelectedRouter(null); setConnectFrom(null);

        const { newRouters, newLinks } = generateTopology(type, 5, 1, 0, 0);
        setRouters(newRouters);
        setLinks(newLinks);
        nextId.current = 6;
    };

    const clearAll = () => {
        pushHistory();
        setRouters([]); setLinks([]); setPackets([]); setActivePath([]);
        resetSim();
        setPan({ x: 0, y: 0 });
        nextId.current = 1; setPingResult(null); setSelectedRouter(null); setMultiSelected([]);
    };

    const deleteMultiSelected = () => {
        if (multiSelected.length === 0) return;
        pushHistory();
        setRouters(prev => prev.filter(r => !multiSelected.includes(r.id)));
        setLinks(prev => prev.filter(l => !multiSelected.includes(l.a) && !multiSelected.includes(l.b)));
        setMultiSelected([]);
    };

    return {
        mode, setMode,
        connectFrom, setConnectFrom,
        pendingCost, setPendingCost,
        selectedRouter, setSelectedRouter,
        multiSelected, setMultiSelected,
        isBoxSelectMode, setIsBoxSelectMode,
        selectionBox,
        deleteMultiSelected,
        handleCanvasClick, handleRouterClick, handleLinkClick,
        handleCanvasMouseDown, handleRouterMouseDown, handleMouseMove, handleMouseUp,
        loadPreset, spawnPreset, clearAll,
        dragging, pan, isPanning,
        editingLink, setEditingLink, updateLinkCost,
        undo, canUndo: history.length > 0
    };
}

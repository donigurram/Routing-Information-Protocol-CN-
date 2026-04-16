import { useState, useRef, useEffect } from "react";

export const ROUTER_COLORS = [
    "#4361EE", "#7B2FBE", "#06D6A0", "#EF233C", "#F77F00",
    "#0077B6", "#E91E8C", "#52B788", "#9B5DE5", "#FF6B35"
];

export function useSimulation(routers, setRouters, links, setLinks, setPackets, simRunning, setSimRunning, tablesRef, applyUpdate, setRipTables, setNextHopMap, initializeTables) {
    const animRef = useRef(null);
    const tickRef = useRef(0);
    const hasChangesRef = useRef(false);
    const pendingUIUpdateRef = useRef(false);
    
    // Triggered BFS Queue
    const broadcastQueueRef = useRef([]);
    const broadcasterUIRef = useRef(null);
    const [activeBroadcaster, setActiveBroadcaster] = useState(null);

    // Stable references for the animation loop
    const routersRef = useRef(routers);
    const linksRef = useRef(links);
    useEffect(() => { routersRef.current = routers; }, [routers]);
    useEffect(() => { linksRef.current = links; }, [links]);

    const [ripRound, setRipRound] = useState(0);
    const [converged, setConverged] = useState(false);
    const [animSpeed, setAnimSpeed] = useState(1);
    const [splitHorizon, setSplitHorizon] = useState(true);
    const [routePoisoning, setRoutePoisoning] = useState(true);

    const toggleSim = () => {
        setSimRunning(s => {
            if (!s) { 
                setRipRound(0); setConverged(false); tickRef.current = 0; 
                hasChangesRef.current = false;
                broadcasterUIRef.current = null;
                setActiveBroadcaster(null);
                initializeTables(routers, links);
                if (routers.length > 0) {
                    broadcastQueueRef.current = [...routers.map(r => r.id)];
                }
            }
            return !s;
        });
    };

    useEffect(() => {
        let last = 0;
        const loop = ts => {
            if (ts - last > 1000 / 60) {
                last = ts;
                tickRef.current++;
                const interval = Math.floor(180 / Math.max(animSpeed, 0.1));
                
                const rs = routersRef.current;
                const ls = linksRef.current;
                let newlySpawnedPackets = [];
                
                // Only spawn routing packets if sim is actually running
                if (simRunning && tickRef.current % interval === 0) {
                    if (rs.length > 0 && broadcastQueueRef.current.length > 0) {
                        const rId = broadcastQueueRef.current.shift();
                        broadcasterUIRef.current = rId;
                        const r = rs.find(x => x.id === rId);
                        if (r) {
                            ls.filter(l => !l.failed && (l.a === r.id || l.b === r.id)).forEach(l => {
                                const dst = l.a === r.id ? l.b : l.a;
                                const dv = { ...tablesRef.current.dist[r.id] };
                                newlySpawnedPackets.push({ 
                                    id: Math.random().toString(36).slice(2), 
                                    from: r.id, 
                                    to: dst, t: 0, 
                                    type: "update", 
                                    dv,
                                    originalSender: r.id,
                                    accumulatedCost: 1,
                                    color: ROUTER_COLORS[rs.findIndex(x => x.id === r.id) % ROUTER_COLORS.length] 
                                });
                            });
                        }
                    }
                }
                
                // Advance ALL packets (both Simulation 'update' packets and 'ping' packets)
                setPackets(prev => {
                    // Fast exit if no packets to process and sim not running
                    if (!simRunning && prev.length === 0 && newlySpawnedPackets.length === 0) return prev;
                    
                    const nextPkts = [];
                    
                    prev.forEach(p => {
                        p.t += 0.04 * animSpeed;
                        if (p.t >= 1) {
                            if (p.type === "update" && simRunning) {
                                const destNode = rs.find(r => r.id === p.to);
                                
                                if (destNode) {
                                    if (applyUpdate(p.to, p.originalSender || p.from, p.dv, p.accumulatedCost || 1, rs, splitHorizon, routePoisoning)) {
                                        hasChangesRef.current = true;
                                        pendingUIUpdateRef.current = true;
                                        
                                        // Triggered Update: Enqueue destination router if it's not already broadcasting next
                                        if (!broadcastQueueRef.current.includes(p.to)) {
                                            broadcastQueueRef.current.push(p.to);
                                        }
                                    }
                                }
                            }
                        } else {
                            nextPkts.push(p);
                        }
                    });
                    
                    const combinedPackets = [...nextPkts, ...newlySpawnedPackets];
                    
                    // Convergence check: queue is empty and NO packets are flying
                    if (simRunning && broadcastQueueRef.current.length === 0 && combinedPackets.length === 0) {
                        broadcasterUIRef.current = null;
                        if (hasChangesRef.current) {
                            setRipRound(r => r + 1);
                            setConverged(true);
                            hasChangesRef.current = false;
                        }
                    }
                    
                    return combinedPackets;
                });
                
                // Flush UI updates outside the pure updater function
                if (pendingUIUpdateRef.current) {
                    setRipTables({...tablesRef.current.dist});
                    setNextHopMap({...tablesRef.current.nextHop});
                    pendingUIUpdateRef.current = false;
                }
                
                setActiveBroadcaster(prev => {
                    const curr = simRunning ? broadcasterUIRef.current : null;
                    return prev !== curr ? curr : prev;
                });
            }
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
    }, [simRunning, animSpeed, applyUpdate, splitHorizon, routePoisoning, setPackets, setRipTables, setNextHopMap, tablesRef]);

    const resetSim = () => {
        setSimRunning(false);
        setConverged(false);
        setRipRound(0);
        broadcastQueueRef.current = [];
        broadcasterUIRef.current = null;
        setActiveBroadcaster(null);
        hasChangesRef.current = false;
        if (tablesRef.current) { tablesRef.current.dist = {}; tablesRef.current.nextHop = {}; }
        if (animRef.current) cancelAnimationFrame(animRef.current);
    };

    return { 
        ripRound, setRipRound,
        converged, setConverged,
        animSpeed, setAnimSpeed, 
        splitHorizon, setSplitHorizon,
        routePoisoning, setRoutePoisoning,
        toggleSim, resetSim, 
        tickRef, animRef,
        activeBroadcaster
    };
}

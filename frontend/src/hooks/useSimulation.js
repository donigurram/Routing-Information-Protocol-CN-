import { useState, useRef, useEffect } from "react";

export const ROUTER_COLORS = [
    "#4361EE", "#7B2FBE", "#06D6A0", "#EF233C", "#F77F00",
    "#0077B6", "#E91E8C", "#52B788", "#9B5DE5", "#FF6B35"
];

export function useSimulation(routers, setRouters, setLinks, setPackets) {
    const animRef = useRef(null);
    const tickRef = useRef(0);

    const [simRunning, setSimRunning] = useState(false);
    const [ripRound, setRipRound] = useState(0);
    const [converged, setConverged] = useState(false);
    const [animSpeed, setAnimSpeed] = useState(1);
    const [splitHorizon, setSplitHorizon] = useState(true);
    const [routePoisoning, setRoutePoisoning] = useState(true);

    const toggleSim = () => {
        setSimRunning(s => {
            if (!s) { setRipRound(0); setConverged(false); tickRef.current = 0; }
            return !s;
        });
    };

    useEffect(() => {
        if (!simRunning) return;
        let last = 0;
        const loop = ts => {
            if (ts - last > 1000 / 60) {
                last = ts;
                tickRef.current++;
                const interval = Math.floor(180 / Math.max(animSpeed, 0.1));
                if (tickRef.current % interval === 0) {
                    setRipRound(r => r + 1);
                    setRouters(rs => {
                        setLinks(ls => {
                            const newPkts = [];
                            rs.forEach(r => {
                                ls.filter(l => !l.failed && (l.a === r.id || l.b === r.id)).forEach(l => {
                                    const dst = l.a === r.id ? l.b : l.a;
                                    newPkts.push({ 
                                        id: Math.random().toString(36).slice(2), 
                                        from: r.id, 
                                        to: dst, t: 0, 
                                        type: "update", 
                                        color: ROUTER_COLORS[rs.findIndex(x => x.id === r.id) % ROUTER_COLORS.length] 
                                    });
                                });
                            });
                            setPackets(p => [...p, ...newPkts]);
                            return ls;
                        });
                        return rs;
                    });
                }
                setPackets(prev => prev.map(p => ({ ...p, t: p.t + 0.04 * animSpeed })).filter(p => p.t <= 1));
            }
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
    }, [simRunning, animSpeed, setRouters, setLinks, setPackets]);

    useEffect(() => { 
        if (ripRound > 3 && routers.length > 1) setConverged(true); 
    }, [ripRound, routers.length]);

    const resetSim = () => {
        setSimRunning(false);
        setConverged(false);
        setRipRound(0);
        if (animRef.current) cancelAnimationFrame(animRef.current);
    };

    return { 
        simRunning, setSimRunning,
        ripRound, setRipRound,
        converged, setConverged,
        animSpeed, setAnimSpeed, 
        splitHorizon, setSplitHorizon,
        routePoisoning, setRoutePoisoning,
        toggleSim, resetSim, 
        tickRef, animRef 
    };
}

import { useState, useCallback, useRef, useEffect } from "react";

export function getPath(src, dst, nextHopMap, routers, links) {
    if (src === dst) return { path: [src], success: true };

    const path = [src];
    let curR = src;
    const seenR = new Set([curR]);

    while (curR !== dst) {
        let nxt = nextHopMap[curR] ? nextHopMap[curR][dst] : null;
        if (!nxt || seenR.has(nxt)) {
            return { path: null, error: `Destination Unreachable` };
        }
        path.push(nxt);
        seenR.add(nxt);
        curR = nxt;
    }

    return { path, success: true };
}

export function useRouting(routers, links, simRunning) {
    const [ripTables, setRipTables] = useState({});
    const [nextHopMap, setNextHopMap] = useState({});
    
    const tablesRef = useRef({ dist: {}, nextHop: {} });

    const initializeTables = useCallback((rs, ls) => {
        if (rs.length < 2) { 
            setRipTables({}); setNextHopMap({}); 
            tablesRef.current = { dist: {}, nextHop: {} };
            return; 
        }
        
        const dist = {}, nextHop = {};
        
        rs.forEach(r => {
            dist[r.id] = {}; nextHop[r.id] = {};
            rs.forEach(j => { 
                dist[r.id][j.id] = r.id === j.id ? 0 : Infinity; 
                nextHop[r.id][j.id] = r.id === j.id ? r.id : null; 
            });
            
            ls.filter(l => !l.failed && (l.a === r.id || l.b === r.id)).forEach(l => {
                const neighborId = l.a === r.id ? l.b : l.a;
                dist[r.id][neighborId] = l.cost;
                nextHop[r.id][neighborId] = neighborId;
            });
        });

        setRipTables({...dist});
        setNextHopMap({...nextHop});
        tablesRef.current = { dist, nextHop };
    }, []);

    const prevRoutersRef = useRef(routers);
    const prevLinksRef = useRef(links);

    useEffect(() => {
        const routersChanged = prevRoutersRef.current !== routers;
        const linksChanged = prevLinksRef.current !== links;
        
        // Only completely wipe routes if routers changed (i.e. new node added). 
        // Link changes are tracked live via useSimulation to preserve routing loops for testing.
        if (!simRunning && routersChanged) {
            initializeTables(routers, links);
        }
        
        prevRoutersRef.current = routers;
        prevLinksRef.current = links;
    }, [routers, links, simRunning, initializeTables]);

    const applyUpdate = useCallback((to, from, dv, hopCost, rs, splitHorizon, routePoisoning) => {
        const prevDist = tablesRef.current.dist;
        const prevNext = tablesRef.current.nextHop;
        
        // Dest Router might not exist if topology changed instantly
        if (!prevDist[to]) return false;
        
        const newDist = { ...prevDist, [to]: { ...prevDist[to] } };
        const newNext = { ...prevNext, [to]: { ...prevNext[to] } };
        
        let changed = false;
        rs.forEach(dest => {
            if (dest.id === to) return;
            const currentMetric = newDist[to][dest.id] !== undefined ? newDist[to][dest.id] : Infinity;
            let advMetric = dv[dest.id] !== undefined ? dv[dest.id] : Infinity;
            
            if (splitHorizon && prevNext[from] && prevNext[from][dest.id] === to) {
                advMetric = routePoisoning ? 16 : Infinity;
            }
            
            let newMetric = advMetric + hopCost;
            if (newMetric > 15) newMetric = 16;
            
            if (prevNext[to] && prevNext[to][dest.id] === from) {
                if (newMetric !== currentMetric) {
                    newDist[to][dest.id] = newMetric;
                    if (newMetric === 16) newNext[to][dest.id] = null;
                    changed = true;
                }
            } else if (newMetric < currentMetric && newMetric < 16) {
                newDist[to][dest.id] = newMetric;
                newNext[to][dest.id] = from;
                changed = true;
            }
        });
        
        if (changed) {
            tablesRef.current = { 
                dist: { ...prevDist, [to]: newDist[to] }, 
                nextHop: { ...prevNext, [to]: newNext[to] } 
            };
            return true;
        }
        return false;
    }, []);

    return { ripTables, nextHopMap, setRipTables, setNextHopMap, tablesRef, initializeTables, applyUpdate };
}

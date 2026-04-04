import { useState, useCallback, useRef, useEffect } from "react";

export function getPath(src, dst, nextHopMap) {
    const path = [src]; let cur = src; const seen = new Set([src]);
    while (cur !== dst) {
        const n = nextHopMap[cur]?.[dst];
        if (!n || seen.has(n)) return null;
        path.push(n); seen.add(n); cur = n;
    }
    return path;
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
            rs.forEach(j => { dist[r.id][j.id] = r.id === j.id ? 0 : Infinity; nextHop[r.id][j.id] = r.id === j.id ? r.id : null; });
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
        
        if (!simRunning && (routersChanged || linksChanged)) {
            initializeTables(routers, links);
        }
        
        prevRoutersRef.current = routers;
        prevLinksRef.current = links;
    }, [routers, links, simRunning, initializeTables]);

    const applyUpdate = useCallback((to, from, dv, ls, rs, splitHorizon, routePoisoning) => {
        const prevDist = tablesRef.current.dist;
        const prevNext = tablesRef.current.nextHop;
        
        const newDist = { ...prevDist, [to]: { ...prevDist[to] } };
        const newNext = { ...prevNext, [to]: { ...prevNext[to] } };
        
        const link = ls.find(l => !l.failed && ((l.a === to && l.b === from) || (l.a === from && l.b === to)));
        if (!link) return false;
        
        let changed = false;
        rs.forEach(dest => {
            if (dest.id === to) return;
            const currentMetric = newDist[to][dest.id] !== undefined ? newDist[to][dest.id] : Infinity;
            let advMetric = dv[dest.id] !== undefined ? dv[dest.id] : Infinity;
            
            if (splitHorizon && prevNext[from] && prevNext[from][dest.id] === to) {
                advMetric = routePoisoning ? 16 : Infinity;
            }
            
            let newMetric = advMetric + 1;
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

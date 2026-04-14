import { useState } from "react";
import { getPath } from "./useRouting";

export function usePing(nextHopMap, animSpeed, setPackets, setActivePath, routers, links) {
    const [pingSrc, setPingSrc] = useState("");
    const [pingDst, setPingDst] = useState("");
    const [pingResult, setPingResult] = useState(null);
    const [activePingNode, setActivePingNode] = useState(null);
    const [pingDebug, setPingDebug] = useState(false);
    const [pingTTL, setPingTTL] = useState(64);
    const [pingLogs, setPingLogs] = useState([]);

    const logEvent = (msg) => setPingLogs(prev => [...prev, msg]);

    const doPing = () => {
        if (!pingSrc || !pingDst || pingSrc === pingDst) return;
        
        setPingLogs([`Initiating ICMP Echo from ${pingSrc} to ${pingDst}...`]);
        setActivePath([]);
        setActivePingNode(null);
        setPingResult(null);

        const routeResult = getPath(pingSrc, pingDst, nextHopMap, routers, links);
        const path = routeResult.path;
        
        if (!path) { 
            setTimeout(() => {
                setPingResult({ success: false, msg: routeResult.error || "Destination Unreachable" });
                logEvent(`✕ ${routeResult.error || "No route to host"}. Fragment discarded.`);
            }, 500);
            return; 
        }

        // Calculate TTL Drop
        let currentTTL = pingTTL;
        let droppedAtIndex = -1;
        
        for (let i = 1; i < path.length; i++) {
            const node = routers.find(r => r.id === path[i]);
            if (node) {
                currentTTL--;
                if (currentTTL <= 0) {
                    droppedAtIndex = i;
                    break;
                }
            }
        }
        
        const success = droppedAtIndex === -1;
        const forwardPath = success ? path : path.slice(0, droppedAtIndex + 1);
        const totalHops = forwardPath.length - 1;
        
        logEvent(`Tracing forward ICMP Echo Request...`);
        let cumulativeDelay = 0;
        let runningTTL = pingTTL;
        
        // Animate Forward Path
        for (let i = 0; i < forwardPath.length - 1; i++) {
            const ttlForPacket = runningTTL;
            
            setTimeout(() => {
                logEvent(`Forwarded by ${forwardPath[i]} (TTL=${ttlForPacket})`);
                
                setPackets(prev => [...prev, { 
                    id: Math.random().toString(36).slice(2), 
                    from: forwardPath[i], to: forwardPath[i + 1], 
                    t: 0, type: "ping", color: "#3B82F6", label: `TTL=${ttlForPacket}`
                }]);
                setActivePingNode(forwardPath[i]);
            }, cumulativeDelay);
            
            runningTTL--;
            cumulativeDelay += 400 / animSpeed;
        }
        
        setActivePath(forwardPath);
        
        // Reached end of forward path
        setTimeout(() => {
            setActivePingNode(forwardPath[forwardPath.length - 1]);
            
            if (!success) {
                logEvent(`✕ Time Exceeded! TTL reached 0 at ${forwardPath[forwardPath.length - 1]}.`);
                setPingResult({ success: false, msg: "Time Exceeded (TTL expired)" });
                setTimeout(() => setActivePingNode(null), 1000);
                setTimeout(() => setActivePath([]), 2000);
                return;
            }
            
            logEvent(`↳ Reached target ${pingDst}. Generating Echo Reply...`);
            
            const reverseResult = getPath(pingDst, pingSrc, nextHopMap, routers, links);
            const reversePath = reverseResult.path;
            if (!reversePath) {
                logEvent(`✕ Destination Unreachable on Return. Reply dropped.`);
                setPingResult({ success: false, msg: "Destination Unreachable (Return)" });
                setTimeout(() => setActivePingNode(null), 1000);
                setTimeout(() => setActivePath([]), 2000);
                return;
            }
            
            let reverseRunningTTL = 64; // Default return TTL
            logEvent(`Tracing reverse ICMP Echo Reply...`);
            let reverseDelay = 0;
            
            for (let i = 0; i < reversePath.length - 1; i++) {
                const rTtlForPacket = reverseRunningTTL;
                
                setTimeout(() => {
                    if (i === 0) logEvent(`Reply dispatched from ${reversePath[i]}`);
                    else logEvent(`Return forwarded by ${reversePath[i]} (TTL=${rTtlForPacket})`);
                    
                    setPackets(prev => [...prev, { 
                        id: Math.random().toString(36).slice(2), 
                        from: reversePath[i], to: reversePath[i + 1], 
                        t: 0, type: "ping", color: "#10B981", label: `TTL=${rTtlForPacket}`
                    }]);
                    setActivePingNode(reversePath[i]);
                }, reverseDelay);
                
                reverseRunningTTL--;
                reverseDelay += 400 / animSpeed;
            }
            
            // Reached Source
            setTimeout(() => {
                setActivePingNode(reversePath[reversePath.length - 1]);
                logEvent(`✓ Reply received from ${pingDst} (RTT elapsed)`);
                setPingResult({ success: true, msg: `Reply received (Total Hops: ${totalHops})`, hops: totalHops });
                
                setTimeout(() => {
                    setActivePingNode(null);
                    setActivePath([]);
                }, 2000);
            }, reverseDelay);
            
        }, cumulativeDelay);
    };

    return {
        pingSrc, setPingSrc,
        pingDst, setPingDst,
        pingResult, setPingResult,
        doPing, activePingNode,
        pingDebug, setPingDebug,
        pingTTL, setPingTTL,
        pingLogs, setPingLogs
    };
}

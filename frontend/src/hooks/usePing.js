import { useState } from "react";
import { getPath } from "./useRouting";

export function usePing(nextHopMap, animSpeed, setPackets, setActivePath) {
    const [pingSrc, setPingSrc] = useState("");
    const [pingDst, setPingDst] = useState("");
    const [pingResult, setPingResult] = useState(null);

    const doPing = () => {
        if (!pingSrc || !pingDst || pingSrc === pingDst) return;
        const path = getPath(pingSrc, pingDst, nextHopMap);
        setActivePath([]);
        if (!path) { setPingResult({ success: false, msg: "No route to host (unreachable)" }); return; }
        const hops = path.length - 1;
        setPingResult({ success: true, msg: `Reply: ${hops} hop${hops !== 1 ? "s" : ""}`, hops });
        setActivePath(path);
        for (let i = 0; i < path.length - 1; i++) {
            setTimeout(() => {
                setPackets(prev => [...prev, { id: Math.random().toString(36).slice(2), from: path[i], to: path[i + 1], t: 0, type: "ping", color: "#F59E0B" }]);
            }, i * 400 / animSpeed);
        }
    };

    return {
        pingSrc, setPingSrc,
        pingDst, setPingDst,
        pingResult, setPingResult,
        doPing
    };
}

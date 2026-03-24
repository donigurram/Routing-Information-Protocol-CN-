export function runBellmanFord(routers, links) {
    const ids = routers.map(r => r.id);
    const dist = {}, nextHop = {};

    ids.forEach(i => {
        dist[i] = {};
        nextHop[i] = {};
        ids.forEach(j => {
            dist[i][j] = i === j ? 0 : Infinity;
            nextHop[i][j] = i === j ? i : null;
        });
    });

    links.filter(l => !l.failed).forEach(l => {
        dist[l.a][l.b] = l.cost;
        dist[l.b][l.a] = l.cost;
        nextHop[l.a][l.b] = l.b;
        nextHop[l.b][l.a] = l.a;
    });

    for (let iter = 0; iter < 15; iter++) {
        let changed = false;

        ids.forEach(u => {
            ids.forEach(dest => {
                if (u === dest) return;

                links
                    .filter(l => !l.failed && (l.a === u || l.b === u))
                    .forEach(l => {
                        const v = l.a === u ? l.b : l.a;
                        const nd = l.cost + dist[v][dest];

                        if (nd < dist[u][dest] && nd <= 15) {
                            dist[u][dest] = nd;
                            nextHop[u][dest] = v;
                            changed = true;
                        }
                    });
            });
        });

        if (!changed) break;
    }

    return { dist, nextHop };
}


export function getPath(src, dst, nextHopMap) {
    const path = [src];
    let cur = src;
    const seen = new Set([src]);

    while (cur !== dst) {
        const next = nextHopMap[cur]?.[dst];
        if (!next || seen.has(next)) return null;
        path.push(next);
        seen.add(next);
        cur = next;
    }

    return path;
}
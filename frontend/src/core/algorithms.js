// core/algorithms.js

/**
 * Runs Bellman-Ford algorithm across all routers and active links.
 * Returns distance table and next-hop map for every router pair.
 */
export function runBellmanFord(routers, links) {
  const ids = routers.map(r => r.id);
  const dist = {}, nextHop = {};

  // Initialize
  ids.forEach(i => {
    dist[i] = {};
    nextHop[i] = {};
    ids.forEach(j => {
      dist[i][j]    = i === j ? 0 : Infinity;
      nextHop[i][j] = i === j ? i : null;
    });
  });

  // Seed direct neighbours from active links
  links.filter(l => !l.failed).forEach(l => {
    dist[l.a][l.b]    = l.cost;
    dist[l.b][l.a]    = l.cost;
    nextHop[l.a][l.b] = l.b;
    nextHop[l.b][l.a] = l.a;
  });

  // Relax up to 15 times (RIP max-hop limit)
  for (let iter = 0; iter < 15; iter++) {
    let changed = false;

    ids.forEach(u => {
      ids.forEach(dest => {
        if (u === dest) return;

        links
          .filter(l => !l.failed && (l.a === u || l.b === u))
          .forEach(l => {
            const v  = l.a === u ? l.b : l.a;
            const nd = l.cost + dist[v][dest];

            if (nd < dist[u][dest] && nd <= 15) {
              dist[u][dest]    = nd;
              nextHop[u][dest] = v;
              changed          = true;
            }
          });
      });
    });

    if (!changed) break;
  }

  return { dist, nextHop };
}

/**
 * Traces the hop-by-hop path from src to dst using the nextHop map.
 * Returns an ordered array of router IDs, or null if no path exists.
 */
export function getPath(src, dst, nextHopMap) {
  const path = [src];
  let cur     = src;
  const seen  = new Set([src]);

  while (cur !== dst) {
    const next = nextHopMap[cur]?.[dst];
    if (!next || seen.has(next)) return null;
    path.push(next);
    seen.add(next);
    cur = next;
  }

  return path;
}
/ ═══════════════════════════════════════════════════════════
// BELLMAN-FORD ENGINE
// ═══════════════════════════════════════════════════════════
function runBellmanFord(routers, links) {
  const ids = routers.map(r => r.id);
  const dist = {}, nextHop = {};
  ids.forEach(i => {
    dist[i] = {}; nextHop[i] = {};
    ids.forEach(j => { dist[i][j] = i === j ? 0 : Infinity; nextHop[i][j] = i === j ? i : null; });
  });
  links.filter(l => !l.failed).forEach(l => {
    dist[l.a][l.b] = l.cost; dist[l.b][l.a] = l.cost;
    nextHop[l.a][l.b] = l.b; nextHop[l.b][l.a] = l.a;
  });
  for (let iter = 0; iter < 15; iter++) {
    let changed = false;
    ids.forEach(u => ids.forEach(dest => {
      if (u === dest) return;
      links.filter(l => !l.failed && (l.a === u || l.b === u)).forEach(l => {
        const v = l.a === u ? l.b : l.a;
        const nd = l.cost + dist[v][dest];
        if (nd < dist[u][dest] && nd <= 15) { dist[u][dest] = nd; nextHop[u][dest] = v; changed = true; }
      });
    }));
    if (!changed) break;
  }
  return { dist, nextHop };
}

function getPath(src, dst, nextHopMap) {
  const path = [src]; let cur = src; const seen = new Set([src]);
  while (cur !== dst) {
    const n = nextHopMap[cur]?.[dst];
    if (!n || seen.has(n)) return null;
    path.push(n); seen.add(n); cur = n;
  }
  return path;
}

// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS — light & dark
// ═══════════════════════════════════════════════════════════
const ROUTER_COLORS = [
  "#4361EE","#7B2FBE","#06D6A0","#EF233C","#F77F00",
  "#0077B6","#E91E8C","#52B788","#9B5DE5","#FF6B35"
];

function makeTheme(dark) {
  return dark ? {
    bg:        "#0F1117",
    surface:   "#1A1D27",
    surfaceAlt:"#22263A",
    border:    "#2D3150",
    borderHov: "#4A5080",
    text:      "#E8EAFF",
    textMuted: "#8B90B8",
    textFaint: "#4A5080",
    accent:    "#5B73FF",
    accentBg:  "#1C2355",
    accentBdr: "#3040A0",
    success:   "#00E5A0",
    successBg: "#0A2A20",
    danger:    "#FF4D6A",
    dangerBg:  "#2A0F16",
    warn:      "#FFB347",
    warnBg:    "#2A1A00",
    gridLine:  "#1E2240",
    dark: true,
  } : {
    bg:        "#F4F6FF",
    surface:   "#FFFFFF",
    surfaceAlt:"#F8FAFF",
    border:    "#DDE3FF",
    borderHov: "#B8C4FF",
    text:      "#1B1F3A",
    textMuted: "#6B7280",
    textFaint: "#A0AABF",
    accent:    "#4361EE",
    accentBg:  "#EEF2FF",
    accentBdr: "#C0CCFF",
    success:   "#06D6A0",
    successBg: "#E8FBF6",
    danger:    "#EF233C",
    dangerBg:  "#FFF0F2",
    warn:      "#F77F00",
    warnBg:    "#FFF4E6",
    gridLine:  "#DDE3FF",
    dark: false,
  };
}

// ═══════════════════════════════════════════════════════════
// SMALL COMPONENTS  (all accept T as prop)
// ═══════════════════════════════════════════════════════════
function Toggle({ value, onChange, T }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 38, height: 21, borderRadius: 999, cursor: "pointer", flexShrink: 0,
      background: value ? T.accent : T.border, position: "relative", transition: "background .2s"
    }}>
      <div style={{
        position: "absolute", top: 2.5, left: value ? 19 : 2.5,
        width: 16, height: 16, borderRadius: 999,
        background: value ? "#fff" : T.textFaint,
        transition: "left .2s, background .2s",
        boxShadow: "0 1px 3px rgba(0,0,0,.3)"
      }} />
    </div>
  );
}

function SectionLabel({ children, T }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, color: T.textFaint,
      letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8
    }}>{children}</div>
  );
}

function Btn({ children, onClick, variant = "default", disabled, style, T }) {
  const variants = {
    default: { background: T.accentBg,  color: T.accent,    border: `1.5px solid ${T.accentBdr}` },
    success: { background: T.successBg, color: T.success,   border: `1.5px solid ${T.success}44` },
    danger:  { background: T.dangerBg,  color: T.danger,    border: `1.5px solid ${T.danger}44`  },
    warn:    { background: T.warnBg,    color: T.warn,       border: `1.5px solid ${T.warn}44`    },
    sim:     { background: T.accentBg,  color: T.accent,    border: `1.5px solid ${T.accentBdr}` },
    pause:   { background: T.warnBg,    color: T.warn,       border: `1.5px solid ${T.warn}44`    },
  };
  const v = variants[variant] || variants.default;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", padding: "9px 12px", borderRadius: 9,
      cursor: disabled ? "not-allowed" : "pointer",
      fontWeight: 700, fontSize: 11,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      opacity: disabled ? .45 : 1, transition: "all .15s", ...v, ...style
    }}>{children}</button>
  );
}

function PresetBtn({ icon, label, onClick, T }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "8px 11px", border: `1.5px solid ${T.border}`,
      borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      background: T.bg, color: T.textMuted, textAlign: "left",
      display: "flex", alignItems: "center", gap: 8, marginBottom: 5,
      transition: "border-color .15s, background .15s"
    }}
      onMouseEnter={e => { e.currentTarget.style.background = T.accentBg; e.currentTarget.style.borderColor = T.accentBdr; }}
      onMouseLeave={e => { e.currentTarget.style.background = T.bg; e.currentTarget.style.borderColor = T.border; }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span> {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// THEME TOGGLE BUTTON
// ═══════════════════════════════════════════════════════════
function ThemeToggle({ dark, onToggle, T }) {
  return (
    <button
      onClick={onToggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 34, height: 34, borderRadius: 9, border: `1.5px solid ${T.border}`,
        background: T.surfaceAlt, cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: 16,
        transition: "all .2s", flexShrink: 0,
        color: T.textMuted,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
    >
      {dark ? "☀" : "☽"}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════════════════
function PingTab({ routers, ripTables, nextHopMap, pingSrc, setPingSrc, pingDst, setPingDst, doPing, pingResult, activePath, T }) {
  return (
    <div>
      <SectionLabel T={T}>Ping Test</SectionLabel>
      {["Source", "Destination"].map((label, idx) => {
        const isSource = idx === 0;
        const val = isSource ? pingSrc : pingDst;
        const setter = isSource ? setPingSrc : setPingDst;
        return (
          <div key={label} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, marginBottom: 4 }}>{label} Router</div>
            <select value={val} onChange={e => setter(e.target.value)} style={{
              width: "100%", padding: "7px 9px", border: `1.5px solid ${T.border}`, borderRadius: 7,
              fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
              color: T.text, background: T.surface
            }}>
              <option value="">-- Select --</option>
              {routers.filter(r => isSource || r.id !== pingSrc).map(r => (
                <option key={r.id} value={r.id}>{r.id}</option>
              ))}
            </select>
          </div>
        );
      })}
      <button onClick={doPing} disabled={!pingSrc || !pingDst} style={{
        width: "100%", padding: "10px",
        border: `1.5px solid ${pingSrc && pingDst ? T.warn + "88" : T.border}`,
        borderRadius: 9, cursor: pingSrc && pingDst ? "pointer" : "not-allowed",
        fontWeight: 700, fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
        background: pingSrc && pingDst ? T.warnBg : T.bg,
        color: pingSrc && pingDst ? T.warn : T.textFaint,
        marginBottom: 12, transition: "all .15s"
      }}>🏓  SEND PING</button>

      {pingResult ? (
        <div style={{
          padding: 12, borderRadius: 9,
          background: pingResult.success ? T.successBg : T.dangerBg,
          border: `1px solid ${pingResult.success ? T.success + "55" : T.danger + "55"}`
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: pingResult.success ? T.success : T.danger, marginBottom: 4 }}>
            {pingResult.success ? "✓ SUCCESS" : "✕ UNREACHABLE"}
          </div>
          <div style={{ fontSize: 11, color: pingResult.success ? T.success : T.danger, fontFamily: "monospace" }}>
            {pingResult.msg}
          </div>
          {activePath.length > 0 && (
            <div style={{ marginTop: 6, fontSize: 10, color: T.textMuted }}>
              Path: {activePath.join(" → ")}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: 10, background: T.bg, borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 10, color: T.textFaint }}>
          Select source and destination, then send ping to visualize route.
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <SectionLabel T={T}>All Routes</SectionLabel>
        {routers.length === 0
          ? <div style={{ fontSize: 11, color: T.textFaint }}>No routers added yet.</div>
          : routers.map(src => routers.filter(d => d.id !== src.id).map(dst => {
            const cost = ripTables[src.id]?.[dst.id];
            const ok = cost !== undefined && cost < Infinity;
            return (
              <div key={`${src.id}-${dst.id}`} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "3px 0", borderBottom: `1px solid ${T.border}`, fontSize: 10
              }}>
                <span style={{ fontFamily: "monospace", color: T.textMuted }}>{src.id} → {dst.id}</span>
                <span style={{
                  padding: "1px 7px", borderRadius: 4, fontWeight: 700, fontSize: 10,
                  background: ok ? T.accentBg : T.dangerBg,
                  color: ok ? T.accent : T.danger
                }}>
                  {ok ? `${cost} hop${cost !== 1 ? "s" : ""}` : "∞"}
                </span>
              </div>
            );
          }))
        }
      </div>
    </div>
  );
}

function TableTab({ routers, ripTables, nextHopMap, selectedRouter, setSelectedRouter, T }) {
  return (
    <div>
      <SectionLabel T={T}>Routing Tables</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
        {routers.map(r => (
          <button key={r.id} onClick={() => setSelectedRouter(r.id)} style={{
            padding: "4px 11px", borderRadius: 7, cursor: "pointer",
            fontSize: 11, fontWeight: 700, fontFamily: "monospace",
            background: selectedRouter === r.id ? r.color : T.bg,
            color: selectedRouter === r.id ? "white" : T.textMuted,
            border: `2px solid ${selectedRouter === r.id ? r.color : T.border}`,
            transition: "all .15s"
          }}>{r.id}</button>
        ))}
      </div>

      {selectedRouter && ripTables[selectedRouter] ? (() => {
        const r = routers.find(x => x.id === selectedRouter);
        return (
          <div>
            <div style={{
              padding: "9px 12px", borderRadius: "9px 9px 0 0",
              background: r?.color || T.accent, color: "white",
              fontSize: 11, fontWeight: 700, fontFamily: "monospace"
            }}>
              {selectedRouter} — RIP Routing Table
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, fontFamily: "monospace" }}>
              <thead>
                <tr style={{ background: T.surfaceAlt }}>
                  {["DEST", "NEXT HOP", "METRIC"].map(h => (
                    <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: T.textFaint, fontWeight: 700, fontSize: 9 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routers.filter(d => d.id !== selectedRouter).map(dest => {
                  const cost = ripTables[selectedRouter]?.[dest.id];
                  const hop  = nextHopMap[selectedRouter]?.[dest.id];
                  const ok   = cost !== undefined && cost < Infinity && cost <= 15;
                  return (
                    <tr key={dest.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "5px 8px", fontWeight: 700, color: T.text }}>{dest.id}</td>
                      <td style={{ padding: "5px 8px", color: "#7B2FBE" }}>{ok ? hop : "—"}</td>
                      <td style={{ padding: "5px 8px" }}>
                        <span style={{
                          padding: "1px 7px", borderRadius: 4, fontWeight: 700,
                          background: ok ? T.accentBg : T.dangerBg,
                          color: ok ? T.accent : T.danger
                        }}>
                          {ok ? cost : "16 (∞)"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 8, padding: 8, background: T.bg, borderRadius: "0 0 8px 8px", fontSize: 9, color: T.textFaint }}>
              Direct: 0 hops · Max: 15 · 16 = unreachable
            </div>
          </div>
        );
      })() : (
        <div style={{ padding: 12, background: T.bg, borderRadius: 9, fontSize: 11, color: T.textFaint }}>
          {routers.length === 0 ? "No routers added yet." : "Select a router above to view its table."}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DRAGGABLE TOOLS FLOATING CARD
// ═══════════════════════════════════════════════════════════
function ToolsCard({ mode, setMode, connectFrom, pendingCost, setPendingCost, T }) {
  const modes = [
    { k: "add",     icon: "⊕",   label: "Add",     color: T.accent   },
    { k: "connect", icon: "⟵⟶",  label: "Link",    color: "#7B2FBE"  },
    { k: "delete",  icon: "✕",   label: "Delete",  color: T.danger   },
    { k: "move",    icon: "✥",   label: "Move",    color: T.warn     },
    { k: "fail",    icon: "⚡",  label: "Fail",    color: "#9B5DE5"  },
    { k: "select",  icon: "◉",   label: "Inspect", color: T.success  },
  ];

  const [pos, setPos]      = useState({ x: 14, y: 62 });
  const draggingCard       = useRef(false);
  const dragStart          = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  const onPointerDown = e => {
    if (e.target.closest("button") || e.target.closest("input")) return;
    draggingCard.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = e => {
    if (!draggingCard.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setPos({ x: Math.max(0, dragStart.current.ox + dx), y: Math.max(52, dragStart.current.oy + dy) });
  };

  const onPointerUp = () => { draggingCard.current = false; };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "absolute", left: pos.x, top: pos.y, zIndex: 30,
        background: T.surface, border: `1.5px solid ${T.border}`,
        borderRadius: 14, boxShadow: T.dark
          ? "0 4px 24px rgba(0,0,0,.5)"
          : "0 4px 24px rgba(67,97,238,.13)",
        userSelect: "none", touchAction: "none", minWidth: 106,
      }}
    >
      {/* Drag handle */}
      <div style={{
        padding: "7px 10px 5px", cursor: "grab", display: "flex",
        alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: T.textFaint, letterSpacing: "1.5px" }}>TOOLS</span>
        <span style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5, paddingLeft: 6 }}>
          {[0,1,2,3,4,5].map(i => (
            <span key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: T.textFaint, display: "block" }} />
          ))}
        </span>
      </div>

      {/* Mode buttons */}
      <div style={{ padding: "8px 8px 4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
        {modes.map(m => (
          <button key={m.k} onClick={() => setMode(m.k)} title={m.label} style={{
            width: 43, height: 43, borderRadius: 9, cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 2, fontSize: 14, transition: "all .15s",
            border: `2px solid ${mode === m.k ? m.color : T.border}`,
            background: mode === m.k ? m.color + "20" : T.bg,
            color: mode === m.k ? m.color : T.textMuted,
          }}>
            <span style={{ lineHeight: 1 }}>{m.icon}</span>
            <span style={{ fontSize: 7, fontWeight: 700, fontFamily: "monospace", letterSpacing: ".5px" }}>
              {m.label.toUpperCase()}
            </span>
          </button>
        ))}
      </div>

      {/* Link cost */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "8px 8px 6px" }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: T.textFaint, letterSpacing: "1.2px", marginBottom: 5 }}>LINK COST</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => setPendingCost(c => Math.max(1, c - 1))}
            style={{
              width: 24, height: 24, borderRadius: 6, border: `1.5px solid ${T.border}`,
              background: T.bg, cursor: "pointer", fontSize: 14, color: T.textMuted,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700,
            }}
          >−</button>
          <input
            type="number" min="1" max="15" value={pendingCost}
            onChange={e => setPendingCost(Math.max(1, Math.min(15, parseInt(e.target.value) || 1)))}
            style={{
              flex: 1, padding: "4px 6px", border: `1.5px solid ${T.border}`, borderRadius: 6,
              fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
              color: T.text, background: T.surface, textAlign: "center", minWidth: 0,
            }}
          />
          <button
            onClick={() => setPendingCost(c => Math.min(15, c + 1))}
            style={{
              width: 24, height: 24, borderRadius: 6, border: `1.5px solid ${T.border}`,
              background: T.bg, cursor: "pointer", fontSize: 14, color: T.textMuted,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700,
            }}
          >+</button>
        </div>
        <div style={{ fontSize: 8, color: T.textFaint, textAlign: "center", marginTop: 4 }}>hops (1–15)</div>
      </div>

      {/* Connect-from pill */}
      {connectFrom && (
        <div style={{
          margin: "0 8px 8px", padding: "5px 8px",
          background: "#F3EEFF", borderRadius: 6,
          fontSize: 9, color: "#7B2FBE", fontWeight: 700, textAlign: "center",
          border: "1px solid #C4B5FD"
        }}>
          ↳ FROM {connectFrom}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function RIPSimulator() {
  const svgRef  = useRef(null);
  const animRef = useRef(null);
  const tickRef = useRef(0);
  const nextId  = useRef(1);

  const [dark,          setDark]          = useState(false);
  const T = makeTheme(dark);

  const [routers,       setRouters]       = useState([]);
  const [links,         setLinks]         = useState([]);
  const [packets,       setPackets]       = useState([]);
  const [ripTables,     setRipTables]     = useState({});
  const [nextHopMap,    setNextHopMap]    = useState({});
  const [activePath,    setActivePath]    = useState([]);

  const [mode,          setMode]          = useState("add");
  const [connectFrom,   setConnectFrom]   = useState(null);
  const [dragging,      setDragging]      = useState(null);
  const [dragOff,       setDragOff]       = useState({ x: 0, y: 0 });

  const [simRunning,    setSimRunning]    = useState(false);
  const [ripRound,      setRipRound]      = useState(0);
  const [converged,     setConverged]     = useState(false);

  const [pingSrc,       setPingSrc]       = useState("");
  const [pingDst,       setPingDst]       = useState("");
  const [pingResult,    setPingResult]    = useState(null);

  const [animSpeed,     setAnimSpeed]     = useState(1);
  const [splitHorizon,  setSplitHorizon]  = useState(true);
  const [routePoisoning,setRoutePoisoning]= useState(true);
  const [pendingCost,   setPendingCost]   = useState(1);
  const [selectedRouter,setSelectedRouter]= useState(null);
  const [activeTab,     setActiveTab]     = useState("ping");

  // ── recompute ───────────────────────────────────────────
  const recompute = useCallback((rs, ls) => {
    if (rs.length < 2) { setRipTables({}); setNextHopMap({}); return; }
    const { dist, nextHop } = runBellmanFord(rs, ls);
    setRipTables(dist);
    setNextHopMap(nextHop);
  }, []);

  useEffect(() => { recompute(routers, links); }, [routers, links]);

  // ── animation loop ──────────────────────────────────────
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
                  newPkts.push({ id: Math.random().toString(36).slice(2), from: r.id, to: dst, t: 0, type: "update", color: ROUTER_COLORS[rs.findIndex(x => x.id === r.id) % ROUTER_COLORS.length] });
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
  }, [simRunning, animSpeed]);

  useEffect(() => { if (ripRound > 3 && routers.length > 1) setConverged(true); }, [ripRound, routers.length]);

  // ── SVG helpers ─────────────────────────────────────────
  const getSVGPoint = e => {
    const r = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const handleCanvasClick = e => {
    if (mode !== "add" || e.target.closest(".router-node")) return;
    const { x, y } = getSVGPoint(e);
    if (y < 52) return;
    const id = `R${nextId.current++}`;
    const color = ROUTER_COLORS[(routers.length) % ROUTER_COLORS.length];
    setRouters(prev => [...prev, { id, x, y, color }]);
  };

  const handleRouterClick = (e, rid) => {
    e.stopPropagation();
    if (mode === "connect") {
      if (!connectFrom) { setConnectFrom(rid); }
      else if (connectFrom !== rid) {
        const exists = links.find(l => (l.a === connectFrom && l.b === rid) || (l.a === rid && l.b === connectFrom));
        if (!exists) {
          setLinks(prev => [...prev, { id: `${connectFrom}-${rid}`, a: connectFrom, b: rid, cost: pendingCost, failed: false }]);
        }
        setConnectFrom(null);
      }
    } else if (mode === "delete") {
      setRouters(prev => prev.filter(r => r.id !== rid));
      setLinks(prev => prev.filter(l => l.a !== rid && l.b !== rid));
    } else if (mode === "select") {
      setSelectedRouter(rid); setActiveTab("table");
    }
  };

  const handleLinkClick = (e, lid) => {
    e.stopPropagation();
    if (mode === "delete") {
      setLinks(prev => prev.filter(l => l.id !== lid));
    } else if (mode === "fail") {
      setLinks(prev => prev.map(l => l.id === lid ? { ...l, failed: !l.failed } : l));
    }
  };

  const handleRouterMouseDown = (e, rid) => {
    if (mode !== "move") return;
    e.stopPropagation();
    const p = getSVGPoint(e), r = routers.find(r => r.id === rid);
    setDragging(rid); setDragOff({ x: p.x - r.x, y: p.y - r.y });
  };

  const handleMouseMove = e => {
    if (!dragging) return;
    const p = getSVGPoint(e);
    setRouters(prev => prev.map(r => r.id === dragging ? { ...r, x: p.x - dragOff.x, y: p.y - dragOff.y } : r));
  };

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

  const loadPreset = type => {
    setRouters([]); setLinks([]); setPackets([]); setActivePath([]);
    setConverged(false); setRipRound(0); nextId.current = 1; setPingResult(null);
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
    setRouters([]); setLinks([]); setPackets([]); setActivePath([]);
    setSimRunning(false); setConverged(false); setRipRound(0);
    nextId.current = 1; setPingResult(null); setSelectedRouter(null);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  const toggleSim = () => {
    setSimRunning(s => {
      if (!s) { setRipRound(0); setConverged(false); tickRef.current = 0; }
      return !s;
    });
  };

  const isPathLink = (la, lb) => {
    for (let i = 0; i < activePath.length - 1; i++)
      if ((activePath[i] === la && activePath[i + 1] === lb) || (activePath[i] === lb && activePath[i + 1] === la)) return true;
    return false;
  };

  const getPacketPos = pkt => {
    const from = routers.find(r => r.id === pkt.from), to = routers.find(r => r.id === pkt.to);
    if (!from || !to) return null;
    return { x: from.x + (to.x - from.x) * pkt.t, y: from.y + (to.y - from.y) * pkt.t };
  };

  const modeColors = { add: T.accent, connect: "#7B2FBE", delete: T.danger, move: T.warn, fail: "#9B5DE5", select: T.success };
  const modeLabels = { add: "⊕ ADD ROUTER", connect: "⟵⟶ CONNECT" + (connectFrom ? ` — from ${connectFrom}` : ""), delete: "✕ DELETE", move: "✥ MOVE", fail: "⚡ FAIL LINK", select: "◉ INSPECT" };
  const mc = modeColors[mode];

  const TABS = [
    { k: "ping",  label: "PING",  icon: "🏓" },
    { k: "table", label: "TABLE", icon: "⊞"  },
  ];

  const canStart = routers.length >= 2 && links.length > 0;

  // ── render ───────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", height: "100vh", width: "100%",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'IBM Plex Mono', monospace",
      background: T.bg, color: T.text, overflow: "hidden",
      transition: "background .25s, color .25s",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* ══ CANVAS ══════════════════════════════════════════ */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
          background: T.surface, borderBottom: `1.5px solid ${T.border}`,
          padding: "8px 16px", display: "flex", alignItems: "center", gap: 10,
          transition: "background .25s, border-color .25s",
        }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: T.accent, letterSpacing: "1px" }}>
            RIPv2 <span style={{ color: T.textFaint, fontWeight: 400, fontSize: 11 }}>Simulator</span>
          </div>
          <div style={{
            padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: "1px solid",
            background: simRunning ? T.successBg : converged && routers.length > 1 ? T.warnBg : T.bg,
            color: simRunning ? T.success : converged && routers.length > 1 ? T.warn : T.textFaint,
            borderColor: simRunning ? T.success + "55" : converged && routers.length > 1 ? T.warn + "55" : T.border,
          }}>
            {simRunning ? `● RUNNING  —  Rd ${ripRound}` : converged && routers.length > 1 ? "✓ CONVERGED" : "○ IDLE"}
          </div>
          <div style={{ marginLeft: "auto", padding: "3px 11px", borderRadius: 7, fontSize: 11, fontWeight: 700, background: mc + "20", color: mc, border: `1px solid ${mc}44` }}>
            {modeLabels[mode]}
          </div>
          <ThemeToggle dark={dark} onToggle={() => setDark(d => !d)} T={T} />
        </div>

        {/* Tools card */}
        <ToolsCard
          mode={mode} setMode={m => { setMode(m); setConnectFrom(null); }}
          connectFrom={connectFrom}
          pendingCost={pendingCost} setPendingCost={setPendingCost}
          T={T}
        />

        {/* Canvas SVG */}
        <svg
          ref={svgRef}
          width="100%" height="100%"
          style={{ display: "block", cursor: mode === "add" ? "crosshair" : mode === "move" ? "grab" : "pointer" }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setDragging(null)}
        >
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0L0 0 0 30" fill="none" stroke={T.gridLine} strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Links */}
          {links.map(l => {
            const ra = routers.find(r => r.id === l.a), rb = routers.find(r => r.id === l.b);
            if (!ra || !rb) return null;
            const mx = (ra.x + rb.x) / 2, my = (ra.y + rb.y) / 2;
            const isPath = isPathLink(l.a, l.b);
            const stroke = l.failed ? T.danger + "88" : isPath ? "#F59E0B" : T.accent + "66";
            return (
              <g key={l.id} onClick={e => handleLinkClick(e, l.id)} style={{ cursor: "pointer" }}>
                <line x1={ra.x} y1={ra.y} x2={rb.x} y2={rb.y}
                  stroke={stroke} strokeWidth={isPath ? 3.5 : 2}
                  strokeDasharray={l.failed ? "6,4" : "none"} opacity={l.failed ? 0.6 : 1} />
                <rect x={mx - 12} y={my - 9} width={24} height={16} rx={4}
                  fill={l.failed ? T.dangerBg : isPath ? "#FEF3C7" : T.surface}
                  stroke={l.failed ? T.danger + "66" : isPath ? "#F59E0B" : T.border} strokeWidth={1} />
                <text x={mx} y={my + 4} textAnchor="middle" fontSize={9} fontWeight={700}
                  fill={l.failed ? T.danger : isPath ? "#D97706" : T.textMuted} fontFamily="monospace">
                  {l.failed ? "✕" : l.cost}
                </text>
              </g>
            );
          })}

          {/* Packets */}
          {packets.map(pkt => {
            const pos = getPacketPos(pkt);
            if (!pos) return null;
            return (
              <g key={pkt.id}>
                <circle cx={pos.x} cy={pos.y} r={pkt.type === "ping" ? 7 : 5} fill={pkt.color} opacity={0.9} />
                {pkt.type === "update" && <circle cx={pos.x} cy={pos.y} r={9} fill="none" stroke={pkt.color} strokeWidth={1.5} opacity={0.4} />}
              </g>
            );
          })}

          {/* Routers */}
          {routers.map(r => {
            const isPath = activePath.includes(r.id);
            const isConn = connectFrom === r.id;
            const isSel  = selectedRouter === r.id;
            const cnt    = ripTables[r.id] ? Object.values(ripTables[r.id]).filter(v => v < Infinity && v > 0).length : 0;
            return (
              <g key={r.id} className="router-node"
                onClick={e => handleRouterClick(e, r.id)}
                onMouseDown={e => handleRouterMouseDown(e, r.id)}
                style={{ cursor: mode === "move" ? "grab" : "pointer" }}>
                {(isPath || isConn || isSel) && (
                  <circle cx={r.x} cy={r.y} r={28} fill="none"
                    stroke={isPath ? "#F59E0B" : isConn ? "#7B2FBE" : T.accent}
                    strokeWidth={2.5} opacity={0.6} />
                )}
                <circle cx={r.x} cy={r.y} r={22} fill={r.color} stroke={T.surface} strokeWidth={3} />
                <text x={r.x} y={r.y + 5} textAnchor="middle" fontSize={11} fontWeight={800} fill="white" fontFamily="monospace">
                  {r.id}
                </text>
                <text x={r.x} y={r.y + 36} textAnchor="middle" fontSize={9} fill={T.textFaint} fontFamily="monospace">
                  {cnt} routes
                </text>
              </g>
            );
          })}

          {routers.length === 0 && (
            <text x="50%" y="52%" textAnchor="middle" fill={T.textFaint} fontSize={13} fontFamily="monospace">
              Click canvas to add routers → Connect → Simulate
            </text>
          )}
        </svg>
      </div>

      {/* ══ RIGHT PANEL ═════════════════════════════════════ */}
      <div style={{
        width: 310, background: T.bg, borderLeft: `1.5px solid ${T.border}`,
        display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0,
        transition: "background .25s, border-color .25s",
      }}>

        {/* ── TOP HALF: tabbed area ── */}
        <div style={{
          flex: 1, minHeight: 0, background: T.surface,
          display: "flex", flexDirection: "column", overflow: "hidden",
          borderBottom: `1.5px solid ${T.border}`,
          transition: "background .25s",
        }}>
          {/* Panel header */}
          <div style={{
            background: T.accent, color: "white",
            padding: "11px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px",
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
          }}>
            <span style={{ fontSize: 14 }}>▣</span> CONTROL PANEL
            <div style={{
              marginLeft: "auto", padding: "2px 9px", borderRadius: 20, fontSize: 10,
              background: converged && routers.length > 1 ? "#FEF9C3" : "rgba(255,255,255,.15)",
              color: converged && routers.length > 1 ? "#854D0E" : "rgba(255,255,255,.85)",
              fontWeight: 700,
            }}>
              {converged && routers.length > 1 ? "✓ Converged" : `Rd ${ripRound}`}
            </div>
          </div>

          {/* ── Pill-style tabs ── */}
          <div style={{
            padding: "10px 12px 0",
            background: T.surface,
            borderBottom: `1.5px solid ${T.border}`,
            flexShrink: 0,
          }}>
            <div style={{
              display: "inline-flex", gap: 4,
              background: T.bg, borderRadius: 10, padding: 4,
              border: `1px solid ${T.border}`,
            }}>
              {TABS.map(t => {
                const active = activeTab === t.k;
                return (
                  <button key={t.k} onClick={() => setActiveTab(t.k)} style={{
                    padding: "6px 16px",
                    borderRadius: 7,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: ".5px",
                    fontFamily: "'JetBrains Mono', monospace",
                    display: "flex", alignItems: "center", gap: 5,
                    transition: "all .15s",
                    background: active ? T.accent : "transparent",
                    color: active ? "white" : T.textMuted,
                    boxShadow: active ? `0 2px 8px ${T.accent}44` : "none",
                  }}>
                    <span style={{ fontSize: 11 }}>{t.icon}</span>
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div style={{ height: 10 }} />
          </div>

          {/* Tab content — scrollable */}
          <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
            {activeTab === "ping" && (
              <PingTab
                routers={routers} ripTables={ripTables} nextHopMap={nextHopMap}
                pingSrc={pingSrc} setPingSrc={setPingSrc}
                pingDst={pingDst} setPingDst={setPingDst}
                doPing={doPing} pingResult={pingResult} activePath={activePath}
                T={T}
              />
            )}
            {activeTab === "table" && (
              <TableTab
                routers={routers} ripTables={ripTables} nextHopMap={nextHopMap}
                selectedRouter={selectedRouter} setSelectedRouter={setSelectedRouter}
                T={T}
              />
            )}
          </div>
        </div>

        {/* ── BOTTOM HALF: simulation settings box ── */}
        <div style={{
          flexShrink: 0, background: T.surface,
          display: "flex", flexDirection: "column",
          transition: "background .25s",
        }}>
          {/* Sim box header */}
          <div style={{
            padding: "9px 16px",
            background: T.surfaceAlt,
            borderBottom: `1.5px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: "1px" }}>
              ⚙ SIMULATION
            </div>
            <div style={{
              padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: "1px solid",
              background: simRunning ? T.successBg : converged && routers.length > 1 ? T.warnBg : T.bg,
              color: simRunning ? T.success : converged && routers.length > 1 ? T.warn : T.textFaint,
              borderColor: simRunning ? T.success + "55" : converged && routers.length > 1 ? T.warn + "55" : T.border,
            }}>
              {simRunning ? `● Rd ${ripRound}` : converged && routers.length > 1 ? "✓ Done" : "○ Idle"}
            </div>
          </div>

          {/* Sim content */}
          <div style={{ padding: "12px 14px" }}>
            {!canStart && (
              <div style={{ padding: "7px 10px", background: T.warnBg, border: `1px solid ${T.warn}44`, borderRadius: 8, fontSize: 10, color: T.warn, marginBottom: 10 }}>
                ⚠ Add ≥2 routers and 1 link to start.
              </div>
            )}
            <Btn
              variant={simRunning ? "pause" : "sim"}
              onClick={canStart ? toggleSim : undefined}
              disabled={!canStart}
              style={{ fontSize: 12, marginBottom: 12 }}
              T={T}
            >
              {simRunning ? "⏸  PAUSE" : "▶  START SIMULATION"}
            </Btn>

            {/* Speed row */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: T.textFaint, letterSpacing: "1px" }}>SPEED</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.accent }}>{animSpeed}×</span>
              </div>
              <input type="range" min=".25" max="4" step=".25" value={animSpeed}
                onChange={e => setAnimSpeed(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: T.accent }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: T.textFaint, marginTop: 2 }}>
                <span>Slow</span><span>Fast</span>
              </div>
            </div>

            {/* Feature toggles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                [splitHorizon,   setSplitHorizon,   "Split Horizon",   "No re-ads to source"],
                [routePoisoning, setRoutePoisoning,  "Route Poisoning", "Failed = metric 16"],
              ].map(([val, setter, label, desc]) => (
                <div key={label} style={{
                  padding: "8px 10px", background: T.bg, borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.text }}>{label}</div>
                    <div style={{ fontSize: 8, color: T.textFaint, marginTop: 1 }}>{desc}</div>
                  </div>
                  <Toggle value={val} onChange={setter} T={T} />
                </div>
              ))}
            </div>

            {/* Presets & clear */}
            <div style={{ marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.textFaint, letterSpacing: "1.5px", marginBottom: 7 }}>PRESETS</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 7 }}>
                {[["▬","linear"],["○","ring"],["⬡","mesh"]].map(([icon, key]) => (
                  <button key={key} onClick={() => loadPreset(key)} style={{
                    flex: 1, padding: "6px 4px", border: `1.5px solid ${T.border}`,
                    borderRadius: 7, cursor: "pointer", fontSize: 10, fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                    background: T.bg, color: T.textMuted,
                    transition: "all .15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.accentBg; e.currentTarget.style.borderColor = T.accentBdr; e.currentTarget.style.color = T.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.bg; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
                  >{icon} {key.charAt(0).toUpperCase() + key.slice(1)}</button>
                ))}
              </div>
              <button onClick={clearAll} style={{
                width: "100%", padding: "7px", border: `1.5px solid ${T.danger}44`,
                borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                background: T.dangerBg, color: T.danger,
              }}>✕  CLEAR ALL</button>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            borderTop: `1.5px solid ${T.border}`, padding: "6px 14px",
            fontSize: 9, color: T.textFaint, fontFamily: "monospace",
            background: T.surfaceAlt,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>RIPv2 · Bellman-Ford · 15 hops</span>
            <span style={{ color: converged && routers.length > 1 ? T.success : T.danger, fontWeight: 700 }}>
              {converged && routers.length > 1 ? "✓ Conv" : "Pending"}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}


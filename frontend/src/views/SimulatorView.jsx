import React, { useState, useCallback, useEffect } from "react";

import useNetworkState from "../hooks/useNetworkState";
import useRoutingTables from "../hooks/useRoutingTables";
import useSimulationLoop from "../hooks/useSimulationLoop";

import ToolsCard from "../components/panels/ToolsCard";

import { RIP_INFINITY, UPDATE_INTERVAL_MS } from "../core/constants";

import theme from "../theme/theme";

const S = {
    root: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        backgroundColor: theme.colors.background,
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fontFamilyUI,
        overflow: "hidden",
    },

    topBar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
        backgroundColor: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
        flexShrink: 0,
    },
    logo: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        fontFamily: theme.typography.fontFamily,
        color: theme.colors.node.active,
        letterSpacing: "0.04em",
        userSelect: "none",
    },
    badge: (state) => ({
        padding: `${theme.spacing.xxs} ${theme.spacing.sm}`,
        borderRadius: theme.borderRadius.pill,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        backgroundColor:
            state === "converged" ? theme.colors.success :
                state === "running" ? theme.colors.accent :
                    state === "failed" ? theme.colors.danger :
                        theme.colors.surfaceElevated,
        color:
            state === "idle" ? theme.colors.text.secondary : theme.colors.text.primary,
        border: `1px solid ${theme.colors.border}`,
    }),

    controlBar: {
        display: "flex",
        gap: theme.spacing.sm,
        alignItems: "center",
        padding: `${theme.spacing.xs} ${theme.spacing.md}`,
        backgroundColor: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
        flexShrink: 0,
        flexWrap: "wrap",
    },
    btn: (variant = "default", disabled = false) => ({
        padding: `5px ${theme.spacing.md}`,
        borderRadius: theme.borderRadius.sm,
        border: `1px solid ${theme.colors.border}`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        fontSize: theme.typography.fontSize.sm,
        fontFamily: theme.typography.fontFamilyUI,
        fontWeight: theme.typography.fontWeight.medium,
        transition: `background ${theme.transitions.fast}`,
        outline: "none",
        backgroundColor:
            variant === "start" ? theme.colors.primary :
                variant === "step" ? theme.colors.accent :
                    variant === "reset" ? theme.colors.danger :
                        theme.colors.surfaceElevated,
        color: disabled ? theme.colors.text.muted : theme.colors.text.primary,
    }),
    divider: {
        width: "1px",
        height: "20px",
        backgroundColor: theme.colors.border,
        margin: `0 ${theme.spacing.xs}`,
    },
    metaLabel: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
    },
    metaValue: {
        color: theme.colors.info,
        fontWeight: theme.typography.fontWeight.semibold,
        fontFamily: theme.typography.fontFamily,
    },

    body: {
        display: "flex",
        flex: 1,
        overflow: "hidden",
    },
    graphPanel: {
        flex: "1 1 60%",
        position: "relative",
        borderRight: `1px solid ${theme.colors.border}`,
        overflow: "hidden",
        backgroundColor: theme.colors.background,
    },
    sidePanel: {
        flex: "0 0 380px",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        padding: theme.spacing.md,
        gap: theme.spacing.md,
    },

    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${theme.colors.border}`,
        overflow: "hidden",
        boxShadow: theme.shadows.sm,
    },
    cardHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        borderBottom: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.surfaceElevated,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.secondary,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
    },
    cardBody: {
        padding: theme.spacing.md,
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: theme.typography.fontSize.xs,
        fontFamily: theme.typography.fontFamily,
    },
    th: {
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        textAlign: "left",
        backgroundColor: theme.colors.table.headerBg,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.semibold,
        borderBottom: `1px solid ${theme.colors.border}`,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        fontSize: "10px",
    },
    tdBase: {
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        borderBottom: `1px solid ${theme.colors.border}`,
    },

    logBox: {
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        lineHeight: theme.typography.lineHeight.normal,
        maxHeight: "160px",
        overflowY: "auto",
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.xs,
    },
    logLine: (type) => ({
        color:
            type === "success" ? theme.colors.success :
                type === "warn" ? theme.colors.warning :
                    type === "error" ? theme.colors.danger :
                        type === "info" ? theme.colors.info :
                            theme.colors.text.secondary,
    }),

    statusBar: {
        display: "flex",
        gap: theme.spacing.xl,
        padding: `${theme.spacing.xs} ${theme.spacing.lg}`,
        backgroundColor: theme.colors.surface,
        borderTop: `1px solid ${theme.colors.border}`,
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.muted,
        flexShrink: 0,
    },

    empty: {
        padding: theme.spacing.lg,
        color: theme.colors.text.muted,
        fontSize: theme.typography.fontSize.sm,
        textAlign: "center",
    },
};

function NetworkGraph({ nodes, edges, selectedNode, onSelectNode }) {
    const r = theme.graph.nodeRadius;

    const getNodeColor = (node) => {
        if (node.failed) return theme.colors.node.failed;
        if (node.converged) return theme.colors.node.converged;
        if (node.active) return theme.colors.node.active;
        return theme.colors.node.idle;
    };

    return (
        <svg
            style={{ width: "100%", height: "100%" }}
            viewBox="0 0 700 460"
            xmlns="http://www.w3.org/2000/svg"
        >
            {edges.map((edge, i) => {
                const from = nodes.find((n) => n.id === edge.from);
                const to = nodes.find((n) => n.id === edge.to);
                if (!from || !to) return null;
                const mx = (from.x + to.x) / 2;
                const my = (from.y + to.y) / 2;
                const isHighlighted =
                    selectedNode &&
                    (edge.from === selectedNode || edge.to === selectedNode);

                return (
                    <g key={`edge-${i}`}>
                        <line
                            x1={from.x} y1={from.y}
                            x2={to.x} y2={to.y}
                            stroke={
                                isHighlighted
                                    ? theme.colors.edge.highlight
                                    : theme.colors.edge.default
                            }
                            strokeWidth={isHighlighted ? 3 : theme.graph.edgeStrokeWidth}
                            strokeDasharray={edge.active ? "6 3" : undefined}
                        />
                        <rect
                            x={mx - 12} y={my - 18}
                            width={24} height={16}
                            rx={3}
                            fill={theme.colors.surface}
                            stroke={theme.colors.border}
                            strokeWidth={1}
                        />
                        <text
                            x={mx} y={my - 7}
                            fill={theme.colors.text.secondary}
                            fontSize={10}
                            textAnchor="middle"
                            fontFamily={theme.typography.fontFamily}
                        >
                            {edge.cost}
                        </text>
                    </g>
                );
            })}

            {nodes.map((node) => {
                const isSelected = selectedNode === node.id;
                const color = getNodeColor(node);
                const shadow = isSelected
                    ? theme.shadows.nodeSelect
                    : node.active
                        ? theme.shadows.nodeActive
                        : theme.shadows.nodeIdle;

                return (
                    <g
                        key={`node-${node.id}`}
                        onClick={() => onSelectNode(node.id)}
                        style={{ cursor: "pointer" }}
                    >
                        {isSelected && (
                            <circle
                                cx={node.x} cy={node.y}
                                r={r + 8}
                                fill="none"
                                stroke={theme.colors.node.selected}
                                strokeWidth={2}
                                opacity={0.5}
                            />
                        )}
                        <circle
                            cx={node.x} cy={node.y} r={r}
                            fill={isSelected ? theme.colors.node.selected : color}
                            stroke={theme.colors.border}
                            strokeWidth={1.5}
                            style={{ filter: `drop-shadow(${shadow})` }}
                        />
                        <text
                            x={node.x} y={node.y + 5}
                            fill={theme.colors.text.inverse}
                            fontSize={13}
                            fontWeight={theme.typography.fontWeight.bold}
                            textAnchor="middle"
                            fontFamily={theme.typography.fontFamily}
                            style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                            {node.id}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export default function SimulatorView() {
    const { nodes, edges, addNode, addEdge, toggleNodeFailed } = useNetworkState();
    const { routingTables, stepTables, resetTables } = useRoutingTables(nodes, edges);
    const { running, iteration, start, stop, reset } = useSimulationLoop(stepTables);

    const [selectedNode, setSelectedNode] = useState(null);
    const [simulationStatus, setSimulationStatus] = useState("idle");
    const [logs, setLogs] = useState([
        { msg: "RIP Simulator ready. Build a network and press Start.", type: "info" },
    ]);

    const selectedTable = selectedNode ? routingTables[selectedNode] ?? [] : [];
    const isRunning = simulationStatus === "running";
    const isConverged = simulationStatus === "converged";

    const log = useCallback((msg, type = "default") => {
        setLogs((prev) =>
            [{ msg: `[Iter ${iteration}]  ${msg}`, type }, ...prev].slice(0, 80)
        );
    }, [iteration]);

    useEffect(() => {
        if (isRunning && iteration > 0) {
            const converged = iteration >= nodes.length + 1;   
            if (converged) {
                stop();
                setSimulationStatus("converged");
                log("All routing tables have converged ✓", "success");
            } else {
                log(`Broadcasting distance vectors — round ${iteration}`, "info");
            }
        }
    }, [iteration]);   

    const handleStart = () => {
        if (nodes.length < 2) {
            log("Need at least 2 nodes to run simulation.", "warn");
            return;
        }
        start();
        setSimulationStatus("running");
        log("Simulation started. Initialising distance vectors…", "info");
    };

    const handleStep = () => {
        stepTables();
        log(`Manual step — iteration ${iteration + 1}`, "default");
    };

    const handleReset = () => {
        stop();
        reset();
        resetTables();
        setSelectedNode(null);
        setSimulationStatus("idle");
        setLogs([{ msg: "Reset. Network state cleared.", type: "warn" }]);
    };

    const handleSelectNode = (id) => {
        setSelectedNode((prev) => (prev === id ? null : id));
    };

    return (
        <div style={S.root}>
            <header style={S.topBar}>
                <span style={S.logo}>⬡ RIP Simulator</span>
                <div style={{ display: "flex", gap: theme.spacing.md, alignItems: "center" }}>
                    <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.text.muted }}>
                        Nodes: <b style={{ color: theme.colors.text.primary }}>{nodes.length}</b>
                        &nbsp;&nbsp;|&nbsp;&nbsp;
                        Links: <b style={{ color: theme.colors.text.primary }}>{edges.length}</b>
                    </span>
                    <span style={S.badge(simulationStatus)}>{simulationStatus}</span>
                </div>
            </header>

            <div style={S.controlBar}>
                <button
                    style={S.btn("start", isRunning || isConverged)}
                    disabled={isRunning || isConverged}
                    onClick={handleStart}
                >
                    ▶ Start
                </button>
                <button
                    style={S.btn("step", !isRunning)}
                    disabled={!isRunning}
                    onClick={handleStep}
                >
                    ⏭ Step
                </button>
                <button
                    style={S.btn("reset")}
                    onClick={handleReset}
                >
                    ↺ Reset
                </button>

                <div style={S.divider} />

                <span style={S.metaLabel}>
                    Iteration:&nbsp;
                    <span style={S.metaValue}>{iteration}</span>
                </span>
                <span style={S.metaLabel}>
                    Infinity Metric:&nbsp;
                    <span style={S.metaValue}>{RIP_INFINITY ?? 16}</span>
                </span>
                <span style={S.metaLabel}>
                    Update Interval:&nbsp;
                    <span style={S.metaValue}>{UPDATE_INTERVAL_MS ?? 1000} ms</span>
                </span>
            </div>

            <div style={S.body}>

                <div style={S.graphPanel}>
                    <NetworkGraph
                        nodes={nodes}
                        edges={edges}
                        selectedNode={selectedNode}
                        onSelectNode={handleSelectNode}
                    />

                    <div style={{
                        position: "absolute",
                        top: theme.spacing.md,
                        left: theme.spacing.md,
                    }}>
                        <ToolsCard
                            onAddNode={addNode}
                            onAddEdge={addEdge}
                            onToggleFail={toggleNodeFailed}
                            nodes={nodes}
                        />
                    </div>
                </div>

                <div style={S.sidePanel}>

                    <div style={S.card}>
                        <div style={S.cardHeader}>
                            <span>
                                📋 Routing Table
                                {selectedNode
                                    ? ` — Router ${selectedNode}`
                                    : " — (select a node)"}
                            </span>
                            {selectedNode && (
                                <span style={{
                                    fontSize: theme.typography.fontSize.xs,
                                    color: theme.colors.text.muted,
                                }}>
                                    {selectedTable.length} routes
                                </span>
                            )}
                        </div>

                        {selectedNode ? (
                            <table style={S.table}>
                                <thead>
                                    <tr>
                                        {["Destination", "Next Hop", "Metric", "TTL (s)"].map((h) => (
                                            <th key={h} style={S.th}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedTable.length > 0 ? (
                                        selectedTable.map((row, i) => {
                                            const isInfinity = row.metric >= (RIP_INFINITY ?? 16);
                                            const ttlLow = row.ttl !== undefined && row.ttl < 60;
                                            const bg = i % 2 === 0
                                                ? theme.colors.table.rowEven
                                                : theme.colors.table.rowOdd;

                                            return (
                                                <tr key={i}>
                                                    <td style={{ ...S.tdBase, backgroundColor: bg }}>
                                                        {row.destination}
                                                    </td>
                                                    <td style={{ ...S.tdBase, backgroundColor: bg }}>
                                                        {row.nextHop ?? "—"}
                                                    </td>
                                                    <td style={{
                                                        ...S.tdBase,
                                                        backgroundColor: bg,
                                                        color: isInfinity
                                                            ? theme.colors.danger
                                                            : row.metric > 8
                                                                ? theme.colors.warning
                                                                : theme.colors.success,
                                                        fontFamily: theme.typography.fontFamily,
                                                    }}>
                                                        {isInfinity ? "∞" : row.metric}
                                                    </td>
                                                    <td style={{
                                                        ...S.tdBase,
                                                        backgroundColor: bg,
                                                        color: ttlLow
                                                            ? theme.colors.danger
                                                            : theme.colors.text.primary,
                                                    }}>
                                                        {row.ttl ?? "—"}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                style={{ ...S.tdBase, ...S.empty }}
                                            >
                                                No routes yet — run the simulation.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <div style={S.empty}>
                                Click any router node in the graph to inspect its RIP table.
                            </div>
                        )}
                    </div>

                    <div style={S.card}>
                        <div style={S.cardHeader}>
                            <span>📜 Event Log</span>
                            <button
                                style={{
                                    ...S.btn(),
                                    padding: "2px 8px",
                                    fontSize: "10px",
                                }}
                                onClick={() => setLogs([])}
                            >
                                Clear
                            </button>
                        </div>
                        <div style={{ padding: theme.spacing.sm }}>
                            <div style={S.logBox}>
                                {logs.map((entry, i) => (
                                    <div key={i} style={S.logLine(entry.type)}>
                                        {entry.msg}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={S.card}>
                        <div style={S.cardHeader}>ℹ Protocol Info</div>
                        <div style={{ ...S.cardBody, fontSize: theme.typography.fontSize.xs }}>
                            {[
                                ["Protocol", "RIPv1 (Distance Vector)"],
                                ["Algorithm", "Bellman-Ford"],
                                ["Infinity Metric", `${RIP_INFINITY ?? 16} hops`],
                                ["Update Timer", `${UPDATE_INTERVAL_MS ?? 1000} ms`],
                                ["Loop Prevention", "Split Horizon"],
                                ["Max Diameter", "15 hops"],
                            ].map(([label, value]) => (
                                <div key={label} style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: `${theme.spacing.xxs} 0`,
                                    borderBottom: `1px solid ${theme.colors.border}`,
                                    color: theme.colors.text.secondary,
                                }}>
                                    <span>{label}</span>
                                    <span style={{
                                        color: theme.colors.text.primary,
                                        fontFamily: theme.typography.fontFamily,
                                    }}>
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            <footer style={S.statusBar}>
                <span>Nodes: {nodes.length}</span>
                <span>Links: {edges.length}</span>
                <span>
                    Status: <span style={{
                        color:
                            isConverged ? theme.colors.success :
                                isRunning ? theme.colors.info :
                                    theme.colors.text.muted
                    }}>{simulationStatus}</span>
                </span>
                <span>Protocol: RIPv1</span>
                <span style={{ marginLeft: "auto" }}>
                    Routing Information Protocol — CN Project
                </span>
            </footer>
        </div>
    );
}
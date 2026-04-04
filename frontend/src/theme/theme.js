const theme = {
    colors: {
        background: "#0d1117",   // deepest bg (canvas, body)
        surface: "#161b22",   // cards, panels
        surfaceElevated: "#21262d",   // hover states, alt rows
        border: "#30363d",   // all borders / dividers

        primary: "#238636",   // start / confirm actions (GitHub-green feels right for "go")
        primaryHover: "#2ea043",
        accent: "#1f6feb",   // links, selected highlights
        accentHover: "#388bfd",

        success: "#3fb950",   // converged, route found
        warning: "#d29922",   // metric nearing infinity, TTL low
        danger: "#f85149",   // unreachable, node failed, reset
        info: "#58a6ff",   // broadcast, update events

        text: {
            primary: "#e6edf3",
            secondary: "#8b949e",
            muted: "#484f58",
            inverse: "#0d1117",
        },

        node: {
            idle: "#1f6feb",   // not yet reached
            active: "#58a6ff",   // currently broadcasting
            converged: "#3fb950",   // table stable
            selected: "#e3b341",   // user-clicked
            failed: "#f85149",   // simulated link-down
        },

        edge: {
            default: "#30363d",
            active: "#58a6ff",   // packet travelling on this link
            highlight: "#e3b341",   // path to selected node
        },

        table: {
            headerBg: "#1c2128",
            rowEven: "#161b22",
            rowOdd: "#1c2128",
            rowUpdated: "#1a3a1a",   // just-updated route (flash green)
            rowExpired: "#3a1a1a",   // TTL expired (flash red)
        },
    },

    typography: {
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontFamilyUI: "'Inter', 'Segoe UI', system-ui, sans-serif",
        fontSize: {
            xs: "12px",
            sm: "14px",
            md: "16px",
            lg: "18px",
            xl: "24px",
            xxl: "32px",
        },
        fontWeight: {
            regular: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        },
        lineHeight: {
            tight: 1.3,
            normal: 1.6,
            loose: 2.0,
        },
    },

    spacing: {
        xxs: "2px",
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
        xxl: "64px",
    },

    borderRadius: {
        xs: "3px",
        sm: "6px",
        md: "10px",
        lg: "16px",
        pill: "999px",
        circle: "50%",
    },

    shadows: {
        sm: "0 1px 4px rgba(0,0,0,0.4)",
        md: "0 4px 16px rgba(0,0,0,0.5)",
        lg: "0 8px 32px rgba(0,0,0,0.6)",
        nodeIdle: "0 0 10px rgba(31,111,235,0.45)",
        nodeActive: "0 0 18px rgba(88,166,255,0.75)",
        nodeConv: "0 0 14px rgba(63,185,80,0.6)",
        nodeSelect: "0 0 18px rgba(227,179,65,0.8)",
    },

    transitions: {
        instant: "0.05s ease",
        fast: "0.15s ease",
        normal: "0.3s ease",
        slow: "0.6s ease",
    },

    graph: {
        nodeRadius: 26,          // px – SVG circle r
        edgeStrokeWidth: 2,           // px
        edgeLabelOffset: 10,          // px above midpoint
        packetRadius: 7,           // animated packet dot
        animationStep: 400,         // ms per simulation tick render
    },
};

export default theme;
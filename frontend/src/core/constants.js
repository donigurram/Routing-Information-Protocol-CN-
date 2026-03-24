// core/constants.js

// ─── Router colour palette ────────────────────────────────────────────────────
export const ROUTER_COLORS = [
  "#4361EE", "#7B2FBE", "#06D6A0", "#EF233C", "#F77F00",
  "#0077B6", "#E91E8C", "#52B788", "#9B5DE5", "#FF6B35",
];

// ─── Tool mode metadata ───────────────────────────────────────────────────────
export const MODES = [
  { k: "add",     icon: "⊕",   label: "Add",     color: null }, // color filled from theme at runtime
  { k: "connect", icon: "⟵⟶",  label: "Link",    color: "#7B2FBE" },
  { k: "delete",  icon: "✕",   label: "Delete",  color: null },
  { k: "move",    icon: "✥",   label: "Move",    color: null },
  { k: "fail",    icon: "⚡",  label: "Fail",    color: "#9B5DE5" },
  { k: "select",  icon: "◉",   label: "Inspect", color: null },
];

// ─── Panel tabs ───────────────────────────────────────────────────────────────
export const TABS = [
  { k: "ping",  label: "PING",  icon: "🏓" },
  { k: "table", label: "TABLE", icon: "⊞"  },
];

// ─── Preset topology definitions ──────────────────────────────────────────────
export const PRESETS = [
  { icon: "▬", key: "linear", label: "Linear" },
  { icon: "○", key: "ring",   label: "Ring"   },
  { icon: "⬡", key: "mesh",  label: "Mesh"   },
];

// ─── RIP protocol limits ──────────────────────────────────────────────────────
export const RIP_MAX_HOPS    = 15;   // metric 16 = infinity / unreachable
export const RIP_INFINITY    = 16;

// ─── Theme factory ────────────────────────────────────────────────────────────
/**
 * Returns a full design-token object for the given colour mode.
 * @param {boolean} dark
 */
export function makeTheme(dark) {
  return dark
    ? {
        bg:         "#0F1117",
        surface:    "#1A1D27",
        surfaceAlt: "#22263A",
        border:     "#2D3150",
        borderHov:  "#4A5080",
        text:       "#E8EAFF",
        textMuted:  "#8B90B8",
        textFaint:  "#4A5080",
        accent:     "#5B73FF",
        accentBg:   "#1C2355",
        accentBdr:  "#3040A0",
        success:    "#00E5A0",
        successBg:  "#0A2A20",
        danger:     "#FF4D6A",
        dangerBg:   "#2A0F16",
        warn:       "#FFB347",
        warnBg:     "#2A1A00",
        gridLine:   "#1E2240",
        dark: true,
      }
    : {
        bg:         "#F4F6FF",
        surface:    "#FFFFFF",
        surfaceAlt: "#F8FAFF",
        border:     "#DDE3FF",
        borderHov:  "#B8C4FF",
        text:       "#1B1F3A",
        textMuted:  "#6B7280",
        textFaint:  "#A0AABF",
        accent:     "#4361EE",
        accentBg:   "#EEF2FF",
        accentBdr:  "#C0CCFF",
        success:    "#06D6A0",
        successBg:  "#E8FBF6",
        danger:     "#EF233C",
        dangerBg:   "#FFF0F2",
        warn:       "#F77F00",
        warnBg:     "#FFF4E6",
        gridLine:   "#DDE3FF",
        dark: false,
      };
}
export function useTheme() {
    const T = {
        bg: "#0F1117",
        surface: "#1A1D27",
        surfaceAlt: "#22263A",
        border: "#2D3150",
        borderHov: "#4A5080",
        text: "#E8EAFF",
        textMuted: "#8B90B8",
        textFaint: "#4A5080",
        accent: "#5B73FF",
        accentBg: "#1C2355",
        accentBdr: "#3040A0",
        success: "#00E5A0",
        successBg: "#0A2A20",
        danger: "#FF4D6A",
        dangerBg: "#2A0F16",
        warn: "#FFB347",
        warnBg: "#2A1A00",
        gridLine: "#1E2240",
        dark: true,
        bgImage: "radial-gradient(circle, #2D3150 1.5px, transparent 1px)",
        bgSize: "35px 35px",
        bgPos: "0 0",
    };
    return { T };
}

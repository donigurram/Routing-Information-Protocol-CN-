import { useState } from "react";

export function makeTheme(dark) {
    return dark ? {
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
    } : {
        bg: "#F4F6FF",
        surface: "#FFFFFF",
        surfaceAlt: "#F8FAFF",
        border: "#DDE3FF",
        borderHov: "#B8C4FF",
        text: "#1B1F3A",
        textMuted: "#6B7280",
        textFaint: "#A0AABF",
        accent: "#4361EE",
        accentBg: "#EEF2FF",
        accentBdr: "#C0CCFF",
        success: "#06D6A0",
        successBg: "#E8FBF6",
        danger: "#EF233C",
        dangerBg: "#FFF0F2",
        warn: "#F77F00",
        warnBg: "#FFF4E6",
        gridLine: "#DDE3FF",
        dark: false,
    };
}

export function useTheme() {
    const [dark, setDark] = useState(false);
    const T = makeTheme(dark);
    return { dark, setDark, T };
}

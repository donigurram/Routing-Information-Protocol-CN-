// components/canvas/LinkLine.jsx

export default function LinkLine({ link, routers, activePath, mode, onLinkClick, T }) {
  const ra = routers.find(r => r.id === link.a);
  const rb = routers.find(r => r.id === link.b);
  if (!ra || !rb) return null;

  const mx = (ra.x + rb.x) / 2;
  const my = (ra.y + rb.y) / 2;

  const isPath = (() => {
    for (let i = 0; i < activePath.length - 1; i++) {
      if (
        (activePath[i] === link.a && activePath[i + 1] === link.b) ||
        (activePath[i] === link.b && activePath[i + 1] === link.a)
      ) return true;
    }
    return false;
  })();

  const stroke = link.failed
    ? T.danger + "88"
    : isPath
    ? "#F59E0B"
    : T.accent + "66";

  return (
    <g
      onClick={e => onLinkClick(e, link.id)}
      style={{ cursor: mode === "delete" || mode === "fail" ? "pointer" : "default" }}
    >
      <line
        x1={ra.x} y1={ra.y} x2={rb.x} y2={rb.y}
        stroke={stroke}
        strokeWidth={isPath ? 3.5 : 2}
        strokeDasharray={link.failed ? "6,4" : "none"}
        opacity={link.failed ? 0.6 : 1}
      />
      <rect
        x={mx - 12} y={my - 9} width={24} height={16} rx={4}
        fill={link.failed ? T.dangerBg : isPath ? "#FEF3C7" : T.surface}
        stroke={link.failed ? T.danger + "66" : isPath ? "#F59E0B" : T.border}
        strokeWidth={1}
      />
      <text
        x={mx} y={my + 4}
        textAnchor="middle" fontSize={9} fontWeight={700}
        fill={link.failed ? T.danger : isPath ? "#D97706" : T.textMuted}
        fontFamily="monospace"
      >
        {link.failed ? "✕" : link.cost}
      </text>
    </g>
  );
}
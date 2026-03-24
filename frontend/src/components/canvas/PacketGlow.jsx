// components/canvas/PacketGlow.jsx

export default function PacketGlow({ packet, routers }) {
  const from = routers.find(r => r.id === packet.from);
  const to   = routers.find(r => r.id === packet.to);
  if (!from || !to) return null;

  const x = from.x + (to.x - from.x) * packet.t;
  const y = from.y + (to.y - from.y) * packet.t;

  return (
    <g>
      <circle
        cx={x} cy={y}
        r={packet.type === "ping" ? 7 : 5}
        fill={packet.color}
        opacity={0.9}
      />
      {packet.type === "update" && (
        <circle
          cx={x} cy={y} r={9}
          fill="none"
          stroke={packet.color}
          strokeWidth={1.5}
          opacity={0.4}
        />
      )}
    </g>
  );
}
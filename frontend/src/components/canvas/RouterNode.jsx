// components/canvas/RouterNode.jsx

export default function RouterNode({
  router,
  mode,
  activePath,
  connectFrom,
  selectedRouter,
  ripTables,
  onRouterClick,
  onRouterMouseDown,
  T,
}) {
  const isPath = activePath.includes(router.id);
  const isConn = connectFrom === router.id;
  const isSel  = selectedRouter === router.id;

  const routeCount = ripTables[router.id]
    ? Object.values(ripTables[router.id]).filter(v => v < Infinity && v > 0).length
    : 0;

  const ringColor = isPath ? "#F59E0B" : isConn ? "#7B2FBE" : T.accent;

  return (
    <g
      className="router-node"
      onClick={e => onRouterClick(e, router.id)}
      onMouseDown={e => onRouterMouseDown(e, router.id)}
      style={{ cursor: mode === "move" ? "grab" : "pointer" }}
    >
      {(isPath || isConn || isSel) && (
        <circle
          cx={router.x} cy={router.y} r={28}
          fill="none"
          stroke={ringColor}
          strokeWidth={2.5}
          opacity={0.6}
        />
      )}
      <circle
        cx={router.x} cy={router.y} r={22}
        fill={router.color}
        stroke={T.surface}
        strokeWidth={3}
      />
      <text
        x={router.x} y={router.y + 5}
        textAnchor="middle" fontSize={11} fontWeight={800}
        fill="white" fontFamily="monospace"
      >
        {router.id}
      </text>
      <text
        x={router.x} y={router.y + 36}
        textAnchor="middle" fontSize={9}
        fill={T.textFaint} fontFamily="monospace"
      >
        {routeCount} routes
      </text>
    </g>
  );
}
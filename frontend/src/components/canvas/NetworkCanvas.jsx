// components/canvas/NetworkCanvas.jsx

import { useRef } from "react";
import LinkLine    from "./LinkLine";
import PacketGlow  from "./PacketGlow";
import RouterNode  from "./RouterNode";

export default function NetworkCanvas({
  routers,
  links,
  packets,
  activePath,
  mode,
  connectFrom,
  selectedRouter,
  ripTables,
  dragging,
  dragOff,
  setDragging,
  setRouters,
  onCanvasClick,
  onRouterClick,
  onRouterMouseDown,
  onLinkClick,
  T,
}) {
  const svgRef = useRef(null);

  const getSVGPoint = e => {
    const rect = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = e => {
    if (!dragging) return;
    const p = getSVGPoint(e);
    setRouters(prev =>
      prev.map(r =>
        r.id === dragging
          ? { ...r, x: p.x - dragOff.x, y: p.y - dragOff.y }
          : r
      )
    );
  };

  const cursorStyle =
    mode === "add"  ? "crosshair" :
    mode === "move" ? "grab"      : "pointer";

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      style={{ display: "block", cursor: cursorStyle }}
      onClick={onCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setDragging(null)}
    >
      {/* Grid background */}
      <defs>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M30 0L0 0 0 30" fill="none" stroke={T.gridLine} strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Links */}
      {links.map(link => (
        <LinkLine
          key={link.id}
          link={link}
          routers={routers}
          activePath={activePath}
          mode={mode}
          onLinkClick={onLinkClick}
          T={T}
        />
      ))}

      {/* Animated packets */}
      {packets.map(pkt => (
        <PacketGlow key={pkt.id} packet={pkt} routers={routers} />
      ))}

      {/* Router nodes */}
      {routers.map(router => (
        <RouterNode
          key={router.id}
          router={router}
          mode={mode}
          activePath={activePath}
          connectFrom={connectFrom}
          selectedRouter={selectedRouter}
          ripTables={ripTables}
          onRouterClick={onRouterClick}
          onRouterMouseDown={onRouterMouseDown}
          T={T}
        />
      ))}

      {/* Empty-state hint */}
      {routers.length === 0 && (
        <text
          x="50%" y="52%"
          textAnchor="middle"
          fill={T.textFaint}
          fontSize={13}
          fontFamily="monospace"
        >
          Click canvas to add routers → Connect → Simulate
        </text>
      )}
    </svg>
  );
}
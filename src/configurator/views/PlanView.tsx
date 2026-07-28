/**
 * Top-down plan of the run.
 *
 * This is the view that makes the shape legible — corners, which way the door
 * swings, and how the panels sit against the walls. Panels are clickable so
 * the customer can select one and edit it.
 */

import { useMemo } from 'react';
import { traceChain } from '../geometry';
import type { ConfiguratorJunction, ConfiguratorPanel } from '../types';

interface PlanViewProps {
  panels: ConfiguratorPanel[];
  junctions: ConfiguratorJunction[];
  leftWall: boolean;
  rightWall: boolean;
  width?: number;
  height?: number;
  activePanelId?: string | null;
  onPanelClick?: (id: string) => void;
  onToggleJunction?: (index: number) => void;
  accent?: string;
}

const GLASS_STROKE = 7;
const PADDING = 130;

export function PlanView({
  panels,
  junctions,
  leftWall,
  rightWall,
  width = 620,
  height = 560,
  activePanelId,
  onPanelClick,
  onToggleJunction,
  accent = '#2563eb',
}: PlanViewProps) {
  // Every hook runs unconditionally — an empty or door-less run is valid and
  // must not short-circuit before this point.
  const trace = useMemo(() => traceChain(panels, junctions), [panels, junctions]);

  const { scale, offsetX, offsetY } = useMemo(() => {
    const contentW = trace.maxX - trace.minX || 1000;
    const contentH = trace.maxY - trace.minY || 1000;
    const s = Math.min((width - PADDING) / contentW, (height - PADDING) / contentH);
    return {
      scale: s,
      offsetX: width / 2 - (trace.minX + contentW / 2) * s,
      offsetY: height / 2 - (trace.minY + contentH / 2) * s,
    };
  }, [trace, width, height]);

  if (panels.length === 0) return null;

  const tx = (x: number) => x * scale + offsetX;
  const ty = (y: number) => y * scale + offsetY;

  const doorSeg = trace.segments[trace.anchorIndex];
  const doorPanel = panels[trace.anchorIndex];
  const hasDoor = doorPanel?.kind === 'door';

  return (
    <svg width={width} height={height} className="select-none" role="img" aria-label="Top-down plan of the shower enclosure">
      <defs>
        <marker id="plan-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill="#94a3b8" />
        </marker>
      </defs>

      {/* Door swing arc, drawn under the glass so the panel reads on top. */}
      {hasDoor && doorSeg && (() => {
        const hingeAtLeft = doorPanel.door?.hinge_side === 'left';
        const pivotX = hingeAtLeft ? doorSeg.x1 : doorSeg.x2;
        const radius = doorPanel.width_mm;
        // Swinging out through 90° brings the free edge round to sit directly
        // in front of the pivot, so the arc ends at the pivot's x.
        return (
          <g>
            <path
              d={`M ${tx(pivotX)} ${ty(0)}
                  L ${tx(hingeAtLeft ? pivotX + radius : pivotX - radius)} ${ty(0)}
                  A ${radius * scale} ${radius * scale} 0 0 ${hingeAtLeft ? 1 : 0} ${tx(pivotX)} ${ty(radius)}
                  Z`}
              fill={accent}
              fillOpacity={0.06}
              stroke={accent}
              strokeOpacity={0.35}
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
          </g>
        );
      })()}

      {/* Walls at each end of the run. */}
      {leftWall && trace.segments[0] && (
        <WallTick x={tx(trace.segments[0].x1)} y={ty(trace.segments[0].y1)} label="WALL" />
      )}
      {rightWall && trace.segments[panels.length - 1] && (
        <WallTick
          x={tx(trace.segments[panels.length - 1].x2)}
          y={ty(trace.segments[panels.length - 1].y2)}
          label="WALL"
        />
      )}

      {/* Glass. */}
      {trace.segments.map((seg) => {
        const panel = panels[seg.index];
        const isActive = panel.id === activePanelId;
        const isDoor = panel.kind === 'door';
        const midX = tx((seg.x1 + seg.x2) / 2);
        const midY = ty((seg.y1 + seg.y2) / 2);
        const vertical = Math.abs(seg.dy) > Math.abs(seg.dx);

        return (
          <g
            key={panel.id}
            onClick={() => onPanelClick?.(panel.id)}
            style={{ cursor: onPanelClick ? 'pointer' : 'default' }}
          >
            {/* Fat transparent hit area so thin glass is still easy to click. */}
            <line
              x1={tx(seg.x1)}
              y1={ty(seg.y1)}
              x2={tx(seg.x2)}
              y2={ty(seg.y2)}
              stroke="transparent"
              strokeWidth={22}
            />
            <line
              x1={tx(seg.x1)}
              y1={ty(seg.y1)}
              x2={tx(seg.x2)}
              y2={ty(seg.y2)}
              stroke={isDoor ? accent : '#0f172a'}
              strokeWidth={isActive ? GLASS_STROKE + 3 : GLASS_STROKE}
              strokeLinecap="round"
              opacity={isActive ? 1 : 0.85}
            />
            <text
              x={vertical ? midX + 16 : midX}
              y={vertical ? midY : midY - 14}
              textAnchor={vertical ? 'start' : 'middle'}
              dominantBaseline="middle"
              className="text-[11px] font-bold"
              fill={isDoor ? accent : '#334155'}
            >
              {panel.width_mm}
            </text>
            <text
              x={vertical ? midX + 16 : midX}
              y={vertical ? midY + 14 : midY + 20}
              textAnchor={vertical ? 'start' : 'middle'}
              dominantBaseline="middle"
              className="text-[9px] font-semibold tracking-widest"
              fill="#94a3b8"
            >
              {isDoor ? 'DOOR' : 'FIXED'}
            </text>
          </g>
        );
      })}

      {/* Corner handles — click to straighten or turn. */}
      {junctions.map((j, i) => {
        const seg = trace.segments[i];
        if (!seg) return null;
        const cx = tx(seg.x2);
        const cy = ty(seg.y2);
        return (
          <g
            key={`junction-${i}`}
            onClick={() => onToggleJunction?.(i)}
            style={{ cursor: onToggleJunction ? 'pointer' : 'default' }}
          >
            <circle cx={cx} cy={cy} r={11} fill="#ffffff" stroke="#cbd5e1" strokeWidth={2} />
            <text
              x={cx}
              y={cy + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[8px] font-black"
              fill="#475569"
            >
              {j.angle_deg}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function WallTick({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <line x1={x - 20} y1={y - 20} x2={x + 20} y2={y - 20} stroke="#94a3b8" strokeWidth={3} />
      <text
        x={x}
        y={y - 30}
        textAnchor="middle"
        className="text-[9px] font-bold tracking-widest"
        fill="#94a3b8"
      >
        {label}
      </text>
    </g>
  );
}

/**
 * Per-template measurement diagrams.
 *
 * Each shower type gets its own set of diagrams showing exactly what to
 * measure for that specific configuration. Diagrams are kept simple and
 * focused on mobile screens (390px width typical).
 *
 * Design principles:
 * - Show the shower type's shape clearly (top-down view)
 * - Highlight ONLY the dimension being measured now
 * - Use brand accent color for the active measurement
 * - Muted colors for everything else
 * - Size for mobile: 320x240 viewBox
 */

import type { ShowerTemplate } from '../templates';

const WALL = 'hsl(var(--muted-foreground) / 0.25)';
const WALL_EDGE = 'hsl(var(--muted-foreground) / 0.55)';
const INK = 'hsl(var(--muted-foreground))';
const ACCENT = 'hsl(var(--primary))';
const MUTED = 'hsl(var(--muted-foreground) / 0.4)';
const GLASS = 'hsl(var(--primary) / 0.15)';

interface TemplateDiagramProps {
  templateId: string;
  measurement: string; // e.g., "width-floor", "height", "wall-start"
  runIndex?: number;
  className?: string;
}

/**
 * Dimension line with ticks.
 */
function Dim({
  x1,
  y1,
  x2,
  y2,
  label,
  highlighted = true,
  vertical = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  highlighted?: boolean;
  vertical?: boolean;
}) {
  const color = highlighted ? ACCENT : MUTED;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2} />
      <line
        x1={vertical ? x1 - 5 : x1}
        y1={vertical ? y1 : y1 - 5}
        x2={vertical ? x1 + 5 : x1}
        y2={vertical ? y1 : y1 + 5}
        stroke={color}
        strokeWidth={2}
      />
      <line
        x1={vertical ? x2 - 5 : x2}
        y1={vertical ? y2 : y2 - 5}
        x2={vertical ? x2 + 5 : x2}
        y2={vertical ? y2 : y2 + 5}
        stroke={color}
        strokeWidth={2}
      />
      <text
        x={vertical ? midX + 12 : midX}
        y={vertical ? midY : midY - 8}
        textAnchor={vertical ? 'start' : 'middle'}
        dominantBaseline={vertical ? 'middle' : 'auto'}
        fontSize={14}
        fontWeight={700}
        fill={color}
      >
        {label}
      </text>
    </g>
  );
}

/**
 * Wall segment (top-down view).
 */
function Wall({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={WALL_EDGE} strokeWidth={6} />
  );
}

/**
 * Glass panel (top-down view).
 */
function Panel({
  x1,
  y1,
  x2,
  y2,
  highlighted = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  highlighted?: boolean;
}) {
  const color = highlighted ? ACCENT : INK;
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={3}
      strokeOpacity={highlighted ? 1 : 0.6}
    />
  );
}

/**
 * Alcove door diagrams (wall-to-wall, single door).
 */
function AlcoveDoorDiagram({ measurement }: { measurement: string }) {
  const W = 320;
  const H = 240;
  const wallDepth = 60;
  const leftWallX = 40;
  const rightWallX = 280;
  const doorY = wallDepth + 40;

  if (measurement === 'width-floor') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="template-diagram">
        {/* Walls */}
        <Wall x1={leftWallX} y1={wallDepth} x2={leftWallX} y2={H - 40} />
        <Wall x1={rightWallX} y1={wallDepth} x2={rightWallX} y2={H - 40} />

        {/* Door (muted) */}
        <Panel x1={leftWallX} y1={doorY} x2={rightWallX} y2={doorY} highlighted={false} />

        {/* Width measurement (highlighted) */}
        <Dim x1={leftWallX} y1={H - 30} x2={rightWallX} y2={H - 30} label="Width" />

        {/* Instruction */}
        <text x={W / 2} y={30} textAnchor="middle" fontSize={13} fill={INK}>
          Measure wall to wall at floor level
        </text>
      </svg>
    );
  }

  if (measurement === 'height') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="template-diagram">
        {/* Walls (side view) */}
        <Wall x1={40} y1={60} x2={40} y2={200} />
        <Wall x1={280} y1={60} x2={280} y2={200} />

        {/* Glass height line */}
        <line x1={80} y1={80} x2={240} y2={80} stroke={ACCENT} strokeWidth={2} strokeDasharray="5 3" />

        {/* Height measurement */}
        <Dim x1={W / 2} y1={80} x2={W / 2} y2={200} label="Height" vertical />

        {/* Instruction */}
        <text x={W / 2} y={30} textAnchor="middle" fontSize={13} fill={INK}>
          Floor to top of glass
        </text>
      </svg>
    );
  }

  return null;
}

/**
 * Alcove panel+door diagrams (wall-to-wall, panel beside door).
 */
function AlcovePanelDoorDiagram({ measurement }: { measurement: string }) {
  const W = 320;
  const H = 240;
  const wallDepth = 60;
  const leftWallX = 40;
  const rightWallX = 280;
  const panelSplit = 140;
  const glassY = wallDepth + 40;

  if (measurement === 'width-floor') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="template-diagram">
        {/* Walls */}
        <Wall x1={leftWallX} y1={wallDepth} x2={leftWallX} y2={H - 40} />
        <Wall x1={rightWallX} y1={wallDepth} x2={rightWallX} y2={H - 40} />

        {/* Panel (muted) */}
        <Panel x1={leftWallX} y1={glassY} x2={panelSplit} y2={glassY} highlighted={false} />

        {/* Door (muted) */}
        <Panel x1={panelSplit} y1={glassY} x2={rightWallX} y2={glassY} highlighted={false} />

        {/* Width measurement (highlighted) */}
        <Dim x1={leftWallX} y1={H - 30} x2={rightWallX} y2={H - 30} label="Width" />

        {/* Instruction */}
        <text x={W / 2} y={30} textAnchor="middle" fontSize={13} fill={INK}>
          Total width wall to wall
        </text>
      </svg>
    );
  }

  return <AlcoveDoorDiagram measurement={measurement} />;
}

/**
 * Walk-in diagrams (one panel, open on one side).
 */
function WalkInDiagram({ measurement }: { measurement: string }) {
  const W = 320;
  const H = 240;
  const wallDepth = 60;
  const leftWallX = 40;
  const panelEnd = 240;
  const glassY = wallDepth + 40;

  if (measurement === 'width-floor') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="template-diagram">
        {/* Left wall */}
        <Wall x1={leftWallX} y1={wallDepth} x2={leftWallX} y2={H - 40} />

        {/* Panel */}
        <Panel x1={leftWallX} y1={glassY} x2={panelEnd} y2={glassY} highlighted={false} />

        {/* Width measurement */}
        <Dim x1={leftWallX} y1={H - 30} x2={panelEnd} y2={H - 30} label="Panel width" />

        {/* Open gap indicator */}
        <text x={panelEnd + 30} y={glassY + 5} fontSize={12} fill={MUTED}>
          Open
        </text>

        {/* Instruction */}
        <text x={W / 2} y={30} textAnchor="middle" fontSize={13} fill={INK}>
          Wall to end of panel
        </text>
      </svg>
    );
  }

  return <AlcoveDoorDiagram measurement={measurement} />;
}

/**
 * Walk-in with return diagrams (L-shaped, panel + return).
 */
function WalkInReturnDiagram({ measurement, runIndex = 0 }: { measurement: string; runIndex?: number }) {
  const W = 320;
  const H = 240;
  const leftWallX = 60;
  const panelEnd = 240;
  const returnY = 100;
  const returnEnd = 180;

  if (measurement === 'width-floor' && runIndex === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="template-diagram">
        {/* Left wall */}
        <Wall x1={leftWallX} y1={40} x2={leftWallX} y2={returnY} />

        {/* Main panel (highlighted) */}
        <Panel x1={leftWallX} y1={returnY} x2={panelEnd} y2={returnY} highlighted={true} />

        {/* Return panel (muted) */}
        <Panel x1={panelEnd} y1={returnY} x2={panelEnd} y2={returnEnd} highlighted={false} />

        {/* Width measurement */}
        <Dim x1={leftWallX} y1={returnY + 40} x2={panelEnd} y2={returnY + 40} label="Front width" />

        {/* Instruction */}
        <text x={W / 2} y={30} textAnchor="middle" fontSize={13} fill={INK}>
          Main panel width
        </text>
      </svg>
    );
  }

  if (measurement === 'width-floor' && runIndex === 1) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="template-diagram">
        {/* Left wall */}
        <Wall x1={leftWallX} y1={40} x2={leftWallX} y2={returnY} />

        {/* Main panel (muted) */}
        <Panel x1={leftWallX} y1={returnY} x2={panelEnd} y2={returnY} highlighted={false} />

        {/* Return panel (highlighted) */}
        <Panel x1={panelEnd} y1={returnY} x2={panelEnd} y2={returnEnd} highlighted={true} />

        {/* Return width measurement */}
        <Dim x1={panelEnd + 20} y1={returnY} x2={panelEnd + 20} y2={returnEnd} label="Return" vertical />

        {/* Instruction */}
        <text x={W / 2} y={30} textAnchor="middle" fontSize={13} fill={INK}>
          Return panel depth
        </text>
      </svg>
    );
  }

  return <WalkInDiagram measurement={measurement} />;
}

/**
 * Corner door+return diagrams (L-shaped with door on front).
 */
function CornerDoorReturnDiagram({ measurement, runIndex = 0 }: { measurement: string; runIndex?: number }) {
  const W = 320;
  const H = 240;
  const leftWallX = 60;
  const rightWallX = 260;
  const frontY = 100;
  const returnY = 180;

  if (measurement === 'width-floor' && runIndex === 0) {
    // Return panel measurement
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="template-diagram">
        {/* Walls */}
        <Wall x1={leftWallX} y1={40} x2={leftWallX} y2={frontY} />
        <Wall x1={rightWallX} y1={frontY} x2={rightWallX} y2={H - 40} />

        {/* Return panel (highlighted) */}
        <Panel x1={leftWallX} y1={frontY} x2={leftWallX} y2={returnY} highlighted={true} />

        {/* Door (muted) */}
        <Panel x1={leftWallX} y1={frontY} x2={rightWallX} y2={frontY} highlighted={false} />

        {/* Return measurement */}
        <Dim x1={leftWallX - 30} y1={frontY} x2={leftWallX - 30} y2={returnY} label="Return" vertical />

        {/* Instruction */}
        <text x={W / 2} y={30} textAnchor="middle" fontSize={13} fill={INK}>
          Side panel depth
        </text>
      </svg>
    );
  }

  if (measurement === 'width-floor' && runIndex === 1) {
    // Front door measurement
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="template-diagram">
        {/* Walls */}
        <Wall x1={leftWallX} y1={40} x2={leftWallX} y2={frontY} />
        <Wall x1={rightWallX} y1={frontY} x2={rightWallX} y2={H - 40} />

        {/* Return panel (muted) */}
        <Panel x1={leftWallX} y1={frontY} x2={leftWallX} y2={returnY} highlighted={false} />

        {/* Door (highlighted) */}
        <Panel x1={leftWallX} y1={frontY} x2={rightWallX} y2={frontY} highlighted={true} />

        {/* Front measurement */}
        <Dim x1={leftWallX} y1={frontY + 40} x2={rightWallX} y2={frontY + 40} label="Front width" />

        {/* Instruction */}
        <text x={W / 2} y={30} textAnchor="middle" fontSize={13} fill={INK}>
          Wall to wall across front
        </text>
      </svg>
    );
  }

  return <WalkInReturnDiagram measurement={measurement} runIndex={runIndex} />;
}

/**
 * Over-bath diagram (shorter bath screen).
 */
function OverBathDiagram({ measurement }: { measurement: string }) {
  const W = 320;
  const H = 240;
  const bathLeft = 40;
  const bathRight = 280;
  const screenEnd = 160;
  const bathY = 150;

  if (measurement === 'width-floor') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="template-diagram">
        {/* Bath edge (wall) */}
        <Wall x1={bathLeft} y1={bathY} x2={bathRight} y2={bathY} />

        {/* Screen panel */}
        <Panel x1={bathLeft} y1={bathY} x2={screenEnd} y2={bathY} highlighted={false} />

        {/* Width measurement */}
        <Dim x1={bathLeft} y1={bathY - 40} x2={screenEnd} y2={bathY - 40} label="Screen width" />

        {/* Instruction */}
        <text x={W / 2} y={30} textAnchor="middle" fontSize={13} fill={INK}>
          Bath edge to end of screen
        </text>
      </svg>
    );
  }

  if (measurement === 'height') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="template-diagram">
        {/* Bath (side view) */}
        <rect x={60} y={160} width={200} height={30} fill={WALL} stroke={WALL_EDGE} strokeWidth={2} />

        {/* Screen height */}
        <line x1={160} y1={70} x2={160} y2={160} stroke={ACCENT} strokeWidth={3} />

        {/* Height measurement */}
        <Dim x1={200} y1={70} x2={200} y2={160} label="Height" vertical />

        {/* Instruction */}
        <text x={W / 2} y={30} textAnchor="middle" fontSize={13} fill={INK}>
          Top of bath to top of screen
        </text>
      </svg>
    );
  }

  return null;
}

/**
 * Generic wall measurement diagram (works for all templates).
 */
function WallMeasurementDiagram({ wallSide }: { wallSide: 'start' | 'end' }) {
  const W = 320;
  const H = 240;
  const wallX = wallSide === 'start' ? 60 : 260;
  const laserX = wallSide === 'start' ? wallX + 40 : wallX - 40;
  const gapTopMm = wallSide === 'start' ? 32 : 28;
  const gapBottomMm = wallSide === 'start' ? 40 : 36;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="template-diagram">
      {/* Wall (leaning slightly) */}
      <line
        x1={wallSide === 'start' ? wallX : wallX - 8}
        y1={60}
        x2={wallSide === 'start' ? wallX + 8 : wallX}
        y2={180}
        stroke={WALL_EDGE}
        strokeWidth={6}
      />

      {/* Laser line (vertical) */}
      <line x1={laserX} y1={50} x2={laserX} y2={190} stroke={ACCENT} strokeWidth={2} strokeDasharray="7 5" />
      <text x={laserX} y={40} textAnchor="middle" fontSize={11} fontWeight={600} fill={ACCENT}>
        laser
      </text>

      {/* Gap at top */}
      <Dim
        x1={wallSide === 'start' ? wallX : wallX - 8}
        y1={70}
        x2={laserX}
        y2={70}
        label="Top"
      />

      {/* Gap at bottom */}
      <Dim
        x1={wallSide === 'start' ? wallX + 8 : wallX}
        y1={170}
        x2={laserX}
        y2={170}
        label="Bottom"
      />

      {/* Instruction */}
      <text x={W / 2} y={220} textAnchor="middle" fontSize={13} fill={INK}>
        Measure gaps from laser line to {wallSide} wall
      </text>
    </svg>
  );
}

/**
 * Main router for template-specific diagrams.
 */
export function TemplateDiagram({ templateId, measurement, runIndex = 0, className }: TemplateDiagramProps) {
  const props = { measurement, runIndex };

  // Wall measurements use generic diagram
  if (measurement === 'wall-start') {
    return <WallMeasurementDiagram wallSide="start" />;
  }
  if (measurement === 'wall-end') {
    return <WallMeasurementDiagram wallSide="end" />;
  }

  // Route to template-specific diagrams
  switch (templateId) {
    case 'alcove-door':
      return <AlcoveDoorDiagram {...props} />;

    case 'alcove-panel-door':
      return <AlcovePanelDoorDiagram {...props} />;

    case 'walk-in':
      return <WalkInDiagram {...props} />;

    case 'walk-in-return':
      return <WalkInReturnDiagram {...props} />;

    case 'corner-door-return':
      return <CornerDoorReturnDiagram {...props} />;

    case 'corner-panel-door-return':
      // Similar to corner-door-return but with extra panel
      return <CornerDoorReturnDiagram {...props} />;

    case 'three-sided':
      // Three runs, complex - use alcove as base for now
      return <AlcoveDoorDiagram {...props} />;

    case 'over-bath':
      return <OverBathDiagram {...props} />;

    default:
      return (
        <svg viewBox="0 0 320 240" className={className}>
          <text x={160} y={120} textAnchor="middle" fontSize={14} fill={INK}>
            Diagram for {templateId} coming soon
          </text>
        </svg>
      );
  }
}

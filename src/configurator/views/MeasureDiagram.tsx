/**
 * How-to-measure diagrams.
 *
 * These are the most important pictures in the product. Custom Showers cuts
 * to whatever the customer types, so the only defence against a wrong number
 * is the customer understanding what the number is before they go and get it.
 *
 * Deliberately plain: a grey bathroom, one blue thing to do, one label. The
 * temptation is to draw a realistic shower — but a realistic drawing buries
 * the measurement in detail, and the customer is looking at this on a phone,
 * in a bathroom, holding a tape in the other hand.
 *
 * Colours come from CSS variables rather than hex so the figures invert
 * properly in dark mode along with the rest of the page.
 */

export type MeasureFigure =
  | 'mark-tray'
  | 'mark-tiles'
  | 'width-floor'
  | 'width-top'
  | 'height'
  | 'wall-laser'
  | 'wall-level'
  | 'wall-packers'
  | 'floor-level';

interface MeasureDiagramProps {
  figure: MeasureFigure;
  className?: string;
}

/**
 * Captions live outside the drawing.
 *
 * They started as <text> inside the SVG and were clipped at every width that
 * mattered — SVG text does not wrap, so a caption that fits the viewBox at
 * 320px is cut in half at 210px, which is exactly the size these render at on
 * a phone. As HTML they reflow.
 */
export const FIGURE_CAPTIONS: Record<MeasureFigure, string> = {
  'mark-tray':
    'Run masking tape along the front of the tray and draw a sharpie line 10mm in from the edge. That is where the channel and door will stand. Set your laser to the line.',
  'mark-tiles':
    'Pick the grout line the glass will cover, put masking tape at each end and mark the line with a sharpie. Set your laser to it.',
  'width-floor': 'Along your sharpie line, wall to wall — to the tiles, not the plaster behind them.',
  'width-top': 'The same measurement again, at the height the glass will reach.',
  height:
    'Masking tape on the wall where the top of the glass will be, marked with a sharpie. Measure from the tray up to the mark.',
  'wall-laser':
    'Set the laser to a true vertical a little off the wall, then measure straight across from the line to the wall — once near the floor, once near the top. We work the rest out from those two numbers.',
  'wall-level':
    'Hold a long level flat against the wall with the bubble centred. One end will touch, so that reading is 0 — measure the gap at the other end.',
  'wall-packers':
    'Easier than reading a tape: slide glazing packers into the gap behind the level until they are snug, then add up the thicknesses printed on them. The touching end is 0.',
  'floor-level':
    'Rest a level across the opening. If one end lifts, measure the gap underneath — that is the fall.',
};

const WALL = 'hsl(var(--muted-foreground) / 0.25)';
const WALL_EDGE = 'hsl(var(--muted-foreground) / 0.55)';
const INK = 'hsl(var(--muted-foreground))';
const ACCENT = 'hsl(var(--primary))';

/** Dimension line with a tick at each end. */
function Dim({
  x1,
  y1,
  x2,
  y2,
  label,
  vertical = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  vertical?: boolean;
}) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={ACCENT} strokeWidth={2} />
      {/* End ticks, drawn across the line's direction. */}
      <line
        x1={vertical ? x1 - 5 : x1}
        y1={vertical ? y1 : y1 - 5}
        x2={vertical ? x1 + 5 : x1}
        y2={vertical ? y1 : y1 + 5}
        stroke={ACCENT}
        strokeWidth={2}
      />
      <line
        x1={vertical ? x2 - 5 : x2}
        y1={vertical ? y2 : y2 - 5}
        x2={vertical ? x2 + 5 : x2}
        y2={vertical ? y2 : y2 + 5}
        stroke={ACCENT}
        strokeWidth={2}
      />
      <text
        x={vertical ? midX + 10 : midX}
        y={vertical ? midY : midY - 8}
        textAnchor={vertical ? 'start' : 'middle'}
        dominantBaseline={vertical ? 'middle' : 'auto'}
        fontSize={13}
        fontWeight={700}
        fill={ACCENT}
      >
        {label}
      </text>
    </g>
  );
}

/**
 * A spirit level held plumb against a leaning wall.
 *
 * Drawn touching at the top and standing off at the bottom, because that is
 * what the customer will actually see — and the gap at the loose end is the
 * number we are asking them for.
 */
function SpiritLevel() {
  return (
    <g className="md-slide-in">
      <rect x={70} y={16} width={15} height={156} rx={2} fill={ACCENT} fillOpacity={0.18} />
      <rect
        x={70}
        y={16}
        width={15}
        height={156}
        rx={2}
        fill="none"
        stroke={ACCENT}
        strokeWidth={1.5}
      />
      {/* Bubble vial, centred and reading true. */}
      <rect x={73} y={84} width={9} height={22} rx={4.5} fill="hsl(var(--background))" stroke={ACCENT} strokeWidth={1} />
      <circle cx={77.5} cy={95} r={3} fill={ACCENT} className="md-settle" />
      <text x={92} y={30} fontSize={11} fontWeight={600} fill={ACCENT}>
        level
      </text>
    </g>
  );
}

/** The room the measurement happens in: two walls and a floor. */
function Room({ leftLean = 0, rightLean = 0, floorFall = 0 }) {
  // Lean is applied at the top, so the wall face is a slanted line. Values are
  // exaggerated by the caller — a real 4mm lean would be invisible here.
  const leftTop = 40 + leftLean;
  const rightTop = 280 - rightLean;
  const floorLeft = 180;
  const floorRight = 180 + floorFall;

  return (
    <g>
      {/* Left wall. */}
      <path d={`M 0 0 L ${leftTop} 0 L ${40} ${floorLeft} L 0 ${floorLeft} Z`} fill={WALL} />
      <line x1={leftTop} y1={0} x2={40} y2={floorLeft} stroke={WALL_EDGE} strokeWidth={2} />
      {/* Right wall. */}
      <path
        d={`M ${rightTop} 0 L 320 0 L 320 ${floorRight} L 280 ${floorRight} Z`}
        fill={WALL}
      />
      <line x1={rightTop} y1={0} x2={280} y2={floorRight} stroke={WALL_EDGE} strokeWidth={2} />
      {/* Floor. */}
      <line x1={0} y1={floorLeft} x2={320} y2={floorRight} stroke={WALL_EDGE} strokeWidth={2} />
    </g>
  );
}

export function MeasureDiagram({ figure, className }: MeasureDiagramProps) {
  return (
    <svg
      viewBox="0 0 320 220"
      className={['md-anim', className].filter(Boolean).join(' ')}
      role="img"
      aria-label={FIGURE_LABELS[figure]}
    >
      {FIGURES[figure]}
    </svg>
  );
}

/**
 * The customer's own opening, drawn back to them.
 *
 * This is the last gate before the enquiry is sent, and it catches what the
 * arithmetic cannot: a lean recorded on the wrong wall, or in the wrong
 * direction. Both produce numbers that cross-check perfectly and a shape that
 * is obviously wrong the moment you look at it.
 *
 * Leans are exaggerated — a real 5mm over 2000mm is a quarter of a degree and
 * would draw as a straight line. The exaggeration is stated on the figure,
 * because a customer who thinks we are about to cut *this* shape would quite
 * reasonably panic.
 */
export function OpeningPreview({
  widthAtFloorMm,
  widthAtTopMm,
  heightMm,
  leftLeanMm,
  rightLeanMm,
  floorFallMm,
  floorLowEnd,
  className,
}: {
  widthAtFloorMm: number;
  widthAtTopMm: number;
  heightMm: number;
  /** Signed: positive leans into the opening at the top. */
  leftLeanMm: number;
  rightLeanMm: number;
  floorFallMm: number;
  floorLowEnd: 'left' | 'right' | null;
  className?: string;
}) {
  const W = 320;
  const H = 240;
  const pad = 46;

  const scale = Math.min(
    (W - pad * 2) / Math.max(widthAtFloorMm, widthAtTopMm, 1),
    (H - pad * 2) / Math.max(heightMm, 1)
  );

  const EXAGGERATION = 8;
  const ex = (mm: number) => mm * scale * EXAGGERATION;

  const floorW = widthAtFloorMm * scale;
  const topW = widthAtTopMm * scale;
  const h = heightMm * scale;

  const cx = W / 2;
  const baseY = pad + h;

  // Floor fall tilts the base line; the opening sits on it.
  const fall = ex(floorFallMm);
  const leftBaseY = floorLowEnd === 'left' ? baseY + fall : baseY;
  const rightBaseY = floorLowEnd === 'right' ? baseY + fall : baseY;

  const blx = cx - floorW / 2;
  const brx = cx + floorW / 2;
  // Top corners move by the exaggerated lean rather than by the measured top
  // width, so the drawing shows which wall is doing it.
  const tlx = blx + ex(leftLeanMm);
  const trx = brx - ex(rightLeanMm);
  const tly = leftBaseY - h;
  const try_ = rightBaseY - h;

  const anythingOut = leftLeanMm !== 0 || rightLeanMm !== 0 || floorFallMm !== 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="Your opening as we understand it">
      <path
        d={`M ${tlx} ${tly} L ${trx} ${try_} L ${brx} ${rightBaseY} L ${blx} ${leftBaseY} Z`}
        fill={ACCENT}
        fillOpacity={0.08}
        stroke={ACCENT}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* A true rectangle behind it, so the out-of-true reads as a difference. */}
      {anythingOut && (
        <rect
          x={cx - floorW / 2}
          y={baseY - h}
          width={floorW}
          height={h}
          fill="none"
          stroke={INK}
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.5}
        />
      )}

      <text x={cx} y={tly - 12} textAnchor="middle" fontSize={12} fontWeight={700} fill={ACCENT}>
        {widthAtTopMm}
      </text>
      <text
        x={cx}
        y={Math.max(leftBaseY, rightBaseY) + 20}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill={ACCENT}
      >
        {widthAtFloorMm}
      </text>
      <text
        x={Math.min(blx, tlx) - 8}
        y={baseY - h / 2}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={12}
        fontWeight={700}
        fill={ACCENT}
      >
        {heightMm}
      </text>

      {anythingOut && (
        <text x={cx} y={H - 6} textAnchor="middle" fontSize={10} fill={INK}>
          Lean shown {EXAGGERATION}× so you can see it — dashed line is square
        </text>
      )}
    </svg>
  );
}

const FIGURE_LABELS: Record<MeasureFigure, string> = {
  'mark-tray': 'Marking where the glass will stand, 10mm in from the edge of the tray',
  'mark-tiles': 'Marking where the glass will stand, along a grout line',
  'width-floor': 'Measuring the width of the opening along the floor',
  'width-top': 'Measuring the width of the opening at the top of the glass',
  height: 'Measuring from the floor up to the top of the glass',
  'wall-laser': 'Finding how far a wall leans using a laser plumb line',
  'wall-level': 'Finding how far a wall leans using a spirit level',
  'wall-packers': 'Finding how far a wall leans using glazing packers',
  'floor-level': 'Finding how far the floor falls across the opening',
};


/** Masking tape: the colour of the real thing, so it reads before the label does. */
const TAPE = 'hsl(45 70% 72%)';
const TAPE_EDGE = 'hsl(40 45% 55%)';
/** The laser's line. Red, because that is what they will see on the wall. */
const LASER = 'hsl(0 85% 55%)';
/** Tape measure blade. */
const BLADE = 'hsl(45 90% 60%)';

/**
 * A tape measure that runs out along a line.
 *
 * The case sits still and the blade extends from it, which is the movement
 * the customer will actually make — then the dimension appears once the tape
 * has reached the far side.
 */
function TapeRun({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <g>
      <rect x={x1 + 1} y={y - 13} width={20} height={18} rx={4} fill={ACCENT} />
      <circle cx={x1 + 11} cy={y - 4} r={4} fill="hsl(var(--background))" />
      <rect
        className="md-extend-x"
        x={x1 + 21}
        y={y - 1}
        width={x2 - x1 - 21}
        height={6}
        fill={BLADE}
        stroke={TAPE_EDGE}
        strokeWidth={0.5}
      />
    </g>
  );
}

/** Seen from above: back wall, two side walls, and whatever is between them. */
function PlanRoom() {
  return (
    <g>
      <rect x={0} y={0} width={320} height={16} fill={WALL} />
      <rect x={0} y={0} width={40} height={220} fill={WALL} />
      <rect x={280} y={0} width={40} height={220} fill={WALL} />
      <path d="M40 220V16H280V220" fill="none" stroke={WALL_EDGE} strokeWidth={2} />
      <text x={160} y={12} textAnchor="middle" fontSize={10} fill={INK}>
        seen from above
      </text>
    </g>
  );
}

const FIGURES: Record<MeasureFigure, JSX.Element> = {
  'mark-tray': (
    <>
      <PlanRoom />
      {/* The tray, with its front edge where the bathroom floor starts. */}
      <rect x={40} y={16} width={240} height={158} fill="hsl(var(--background))" stroke={WALL_EDGE} strokeWidth={2} />
      <circle cx={160} cy={92} r={9} fill="none" stroke={WALL_EDGE} strokeWidth={1.5} />
      <line x1={0} y1={174} x2={320} y2={174} stroke={WALL_EDGE} strokeWidth={2} />
      <text x={160} y={196} textAnchor="middle" fontSize={10} fill={INK}>
        edge of the tray
      </text>

      <g className="md-step-1">
        <rect x={42} y={146} width={236} height={24} fill={TAPE} stroke={TAPE_EDGE} strokeWidth={0.75} />
        <text x={50} y={141} fontSize={11} fontWeight={600} fill={INK}>
          masking tape
        </text>
      </g>
      {/* 10mm, drawn much wider than 10mm so there is something to see. */}
      <line className="md-draw" x1={44} y1={160} x2={276} y2={160} stroke="hsl(var(--foreground))" strokeWidth={2.5} strokeLinecap="round" />
      <g className="md-step-3">
        <line x1={44} y1={160} x2={276} y2={160} stroke={LASER} strokeWidth={1.5} />
        <rect x={250} y={120} width={22} height={16} rx={3} fill="hsl(var(--foreground))" />
        <line x1={261} y1={136} x2={261} y2={160} stroke={LASER} strokeWidth={1.5} strokeDasharray="3 2" />
        <text x={246} y={131} textAnchor="end" fontSize={11} fontWeight={600} fill={LASER}>
          laser on the line
        </text>
      </g>
      <g className="md-result">
        <Dim x1={60} y1={160} x2={60} y2={174} label="" vertical />
        <text x={70} y={213} fontSize={12} fontWeight={700} fill={ACCENT}>
          10mm in — the glass goes here
        </text>
        <line x1={68} y1={204} x2={62} y2={176} stroke={ACCENT} strokeWidth={1} />
      </g>
    </>
  ),

  'mark-tiles': (
    <>
      <PlanRoom />
      {/* A tiled floor: the glass line follows a grout joint, so the channel
          hides it rather than cutting a tile in half. */}
      {[40, 70, 100, 130, 160, 190].map((y) => (
        <line key={`h${y}`} x1={40} y1={y + 16} x2={280} y2={y + 16} stroke={WALL_EDGE} strokeWidth={0.75} />
      ))}
      {[70, 100, 130, 160, 190, 220, 250].map((x) => (
        <line key={`v${x}`} x1={x} y1={16} x2={x} y2={220} stroke={WALL_EDGE} strokeWidth={0.75} />
      ))}

      <g className="md-step-1">
        <line x1={40} y1={146} x2={280} y2={146} stroke={ACCENT} strokeWidth={3} strokeOpacity={0.35} />
        <rect x={70} y={124} width={180} height={16} rx={3} fill="hsl(var(--background))" />
        <text x={160} y={136} textAnchor="middle" fontSize={11} fontWeight={600} fill={ACCENT}>
          the grout line the glass will cover
        </text>
      </g>
      <g className="md-step-2">
        <rect x={42} y={137} width={40} height={18} fill={TAPE} stroke={TAPE_EDGE} strokeWidth={0.75} />
        <rect x={238} y={137} width={40} height={18} fill={TAPE} stroke={TAPE_EDGE} strokeWidth={0.75} />
        <line x1={46} y1={146} x2={78} y2={146} stroke="hsl(var(--foreground))" strokeWidth={2.5} strokeLinecap="round" />
        <line x1={242} y1={146} x2={274} y2={146} stroke="hsl(var(--foreground))" strokeWidth={2.5} strokeLinecap="round" />
      </g>
      <g className="md-step-3">
        <line x1={44} y1={146} x2={276} y2={146} stroke={LASER} strokeWidth={1.5} />
        <rect x={150} y={178} width={22} height={16} rx={3} fill="hsl(var(--foreground))" />
        <line x1={161} y1={178} x2={161} y2={146} stroke={LASER} strokeWidth={1.5} strokeDasharray="3 2" />
        <rect x={176} y={179} width={92} height={15} rx={3} fill="hsl(var(--background))" />
        <text x={180} y={190} fontSize={11} fontWeight={600} fill={LASER}>
          laser on the line
        </text>
      </g>
    </>
  ),

  'width-floor': (
    <>
      <Room />
      <TapeRun x1={40} x2={280} y={170} />
      <g className="md-result">
        <Dim x1={40} y1={146} x2={280} y2={146} label="A" />
      </g>
    </>
  ),

  'width-top': (
    <>
      <Room />
      <line x1={30} y1={46} x2={290} y2={46} stroke={INK} strokeWidth={1.5} strokeDasharray="5 4" />
      <TapeRun x1={42} x2={278} y={52} />
      <g className="md-result">
        <Dim x1={43} y1={82} x2={277} y2={82} label="B" />
        <text x={160} y={104} textAnchor="middle" fontSize={11} fill={INK}>
          top of the glass
        </text>
      </g>
    </>
  ),

  height: (
    <>
      <Room />
      <g className="md-step-1">
        <rect x={136} y={22} width={48} height={16} fill={TAPE} stroke={TAPE_EDGE} strokeWidth={0.75} />
        <text x={192} y={34} fontSize={11} fontWeight={600} fill={INK}>
          masking tape
        </text>
      </g>
      <line className="md-draw" x1={140} y1={30} x2={180} y2={30} stroke="hsl(var(--foreground))" strokeWidth={2.5} strokeLinecap="round" />
      <rect className="md-extend-y" x={157} y={30} width={6} height={150} fill={BLADE} stroke={TAPE_EDGE} strokeWidth={0.5} />
      <rect x={150} y={162} width={20} height={18} rx={4} fill={ACCENT} />
      <g className="md-result">
        <Dim x1={112} y1={30} x2={112} y2={180} label="C" vertical />
      </g>
    </>
  ),

  'wall-laser': (
    <>
      <Room leftLean={30} />
      {/* A true vertical, set a little off the wall so there is something to
          measure at both ends. Two readings in, lean and direction out. */}
      <g className="md-laser-in">
        <line x1={104} y1={10} x2={104} y2={186} stroke={LASER} strokeWidth={2} strokeDasharray="7 5" />
        <rect x={94} y={186} width={20} height={14} rx={3} fill="hsl(var(--foreground))" />
        <text x={110} y={22} fontSize={11} fontWeight={600} fill={LASER}>
          laser
        </text>
      </g>
      <g className="md-step-3">
        <Dim x1={72} y1={40} x2={104} y2={40} label="" />
        <text x={88} y={32} textAnchor="middle" fontSize={11} fontWeight={700} fill={ACCENT}>
          top
        </text>
      </g>
      <g className="md-result">
        <Dim x1={43} y1={158} x2={104} y2={158} label="" />
        <text x={73} y={150} textAnchor="middle" fontSize={11} fontWeight={700} fill={ACCENT}>
          bottom
        </text>
      </g>
    </>
  ),

  'wall-level': (
    <>
      <Room leftLean={30} />
      <SpiritLevel />
      {/* Held against the wall, the level touches at the top: that reading is
          zero, and the gap at the foot is the whole lean. */}
      <g className="md-result">
        <text x={92} y={48} fontSize={11} fontWeight={700} fill={ACCENT}>
          top 0
        </text>
        <Dim x1={44} y1={150} x2={70} y2={150} label="" />
        <text x={57} y={142} textAnchor="middle" fontSize={11} fontWeight={700} fill={ACCENT}>
          bottom
        </text>
      </g>
    </>
  ),

  'wall-packers': (
    <>
      <Room leftLean={30} />
      <SpiritLevel />
      <g>
        {[0, 1, 2].map((i) => (
          <rect
            key={i}
            className="md-packer"
            x={44 + i * 9}
            y={140}
            width={8}
            height={20}
            rx={1}
            fill={ACCENT}
            fillOpacity={0.3 + i * 0.22}
            stroke={ACCENT}
            strokeWidth={1}
          />
        ))}
      </g>
      <g className="md-result">
        <text x={92} y={48} fontSize={11} fontWeight={700} fill={ACCENT}>
          top 0
        </text>
        <text x={88} y={155} fontSize={11} fontWeight={700} fill={ACCENT}>
          3 x 2mm = 6mm
        </text>
      </g>
    </>
  ),

  'floor-level': (
    <>
      <Room floorFall={26} />
      {/* Laid down it follows the floor; lifted at the low end until the
          bubble centres, the gap underneath is the fall. */}
      <g className="md-lift">
        <rect x={44} y={170} width={232} height={9} rx={2} fill={ACCENT} fillOpacity={0.2} />
        <line x1={44} y1={174} x2={276} y2={174} stroke={ACCENT} strokeWidth={2} />
        <circle cx={160} cy={174} r={5} fill="none" stroke={ACCENT} strokeWidth={1.5} />
      </g>
      <g className="md-result">
        <Dim x1={272} y1={180} x2={272} y2={204} label="" vertical />
        <text x={262} y={196} textAnchor="end" fontSize={11} fontWeight={700} fill={ACCENT}>
          fall
        </text>
      </g>
    </>
  ),
};

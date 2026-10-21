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
  'width-floor': 'Tape flat on the floor, from wall to wall.',
  'width-top': 'The same measurement again, at the height the glass will reach.',
  height: 'Floor or tray up to a grout line above the shower head.',
  'wall-laser':
    'Set a laser to a true vertical a little off the wall, then measure straight across from the line to the wall — once near the floor, once near the top. We work the rest out from those two numbers.',
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
    <g>
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
      <circle cx={77.5} cy={95} r={3} fill={ACCENT} />
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
      className={className}
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
  'width-floor': 'Measuring the width of the opening along the floor',
  'width-top': 'Measuring the width of the opening at the top of the glass',
  height: 'Measuring from the floor up to the top of the glass',
  'wall-laser': 'Finding how far a wall leans using a laser plumb line',
  'wall-level': 'Finding how far a wall leans using a spirit level',
  'wall-packers': 'Finding how far a wall leans using glazing packers',
  'floor-level': 'Finding how far the floor falls across the opening',
};

const FIGURES: Record<MeasureFigure, JSX.Element> = {
  'width-floor': (
    <>
      <Room />
      <Dim x1={40} y1={168} x2={280} y2={168} label="A" />
    </>
  ),

  'width-top': (
    <>
      <Room />
      <line x1={30} y1={46} x2={290} y2={46} stroke={INK} strokeWidth={1.5} strokeDasharray="5 4" />
      <Dim x1={43} y1={46} x2={277} y2={46} label="B" />
      <text x={160} y={70} textAnchor="middle" fontSize={11} fill={INK}>
        top of the glass
      </text>
    </>
  ),

  height: (
    <>
      <Room />
      <line x1={60} y1={30} x2={260} y2={30} stroke={INK} strokeWidth={1.5} strokeDasharray="5 4" />
      <Dim x1={160} y1={30} x2={160} y2={180} label="C" vertical />
    </>
  ),

  'wall-laser': (
    <>
      <Room leftLean={30} />
      {/* A true vertical, set a little off the wall so there is something to
          measure at both ends. Two readings in, lean and direction out. */}
      <line x1={104} y1={10} x2={104} y2={186} stroke={ACCENT} strokeWidth={2} strokeDasharray="7 5" />
      <text x={110} y={22} fontSize={11} fontWeight={600} fill={ACCENT}>
        laser
      </text>
      <Dim x1={72} y1={40} x2={104} y2={40} label="" />
      <text x={88} y={32} textAnchor="middle" fontSize={11} fontWeight={700} fill={ACCENT}>
        top
      </text>
      <Dim x1={43} y1={158} x2={104} y2={158} label="" />
      <text x={73} y={150} textAnchor="middle" fontSize={11} fontWeight={700} fill={ACCENT}>
        bottom
      </text>
    </>
  ),

  'wall-level': (
    <>
      <Room leftLean={30} />
      <SpiritLevel />
      {/* Held against the wall, the level touches at the top: that reading is
          zero, and the gap at the foot is the whole lean. */}
      <text x={92} y={48} fontSize={11} fontWeight={700} fill={ACCENT}>
        top 0
      </text>
      <Dim x1={44} y1={150} x2={70} y2={150} label="" />
      <text x={57} y={142} textAnchor="middle" fontSize={11} fontWeight={700} fill={ACCENT}>
        bottom
      </text>
    </>
  ),

  'wall-packers': (
    <>
      <Room leftLean={30} />
      <SpiritLevel />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
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
      <text x={92} y={48} fontSize={11} fontWeight={700} fill={ACCENT}>
        top 0
      </text>
      <text x={88} y={155} fontSize={11} fontWeight={700} fill={ACCENT}>
        3 x 2mm = 6mm
      </text>
    </>
  ),

  'floor-level': (
    <>
      <Room floorFall={26} />
      {/* A true horizontal resting on the high end. */}
      <rect x={44} y={170} width={232} height={9} rx={2} fill={ACCENT} fillOpacity={0.2} />
      <line x1={44} y1={174} x2={276} y2={174} stroke={ACCENT} strokeWidth={2} />
      <circle cx={160} cy={174} r={5} fill="none" stroke={ACCENT} strokeWidth={1.5} />
      <Dim x1={272} y1={180} x2={272} y2={204} label="" vertical />
      <text x={262} y={196} textAnchor="end" fontSize={11} fontWeight={700} fill={ACCENT}>
        fall
      </text>
    </>
  ),
};

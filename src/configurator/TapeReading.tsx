/**
 * How to read millimetres off a tape — the one thing most first-time
 * measurers have never had to do. Most UK tapes print centimetres in large
 * numbers with millimetre ticks between them, so "90" on the blade is 900mm.
 */

export function TapeReading() {
  // A section of blade from 88cm to 91.5cm, drawn at 30px per cm.
  const startCm = 88;
  const pxPerMm = 3;
  const left = 10;
  const ticks = Array.from({ length: 36 }, (_, i) => i); // 0..35 mm from 880
  const readingMm = 6; // pointer sits at 886mm

  return (
    <figure className="space-y-2">
      <svg viewBox="0 0 300 120" className="h-auto w-full" role="img" aria-labelledby="tape-reading-title">
        <title id="tape-reading-title">
          A tape measure blade marked 88, 89, 90 and 91, with an arrow pointing six small ticks past 88,
          which reads 886 millimetres.
        </title>
        {/* Blade */}
        <rect x="0" y="20" width="300" height="60" rx="3" fill="#facc15" stroke="#a16207" strokeWidth="1" />
        {ticks.map((mm) => {
          const x = left + mm * pxPerMm * 2.6;
          const isCm = mm % 10 === 0;
          const isHalf = mm % 5 === 0;
          return (
            <g key={mm}>
              <line
                x1={x}
                y1="20"
                x2={x}
                y2={20 + (isCm ? 30 : isHalf ? 20 : 12)}
                stroke="#1c1917"
                strokeWidth={isCm ? 1.6 : 0.9}
              />
              {isCm && (
                <text x={x + 3} y="72" fontSize="16" fontWeight="700" fill="#b91c1c" fontFamily="sans-serif">
                  {startCm + mm / 10}
                </text>
              )}
            </g>
          );
        })}
        {/* Reading pointer */}
        <line
          x1={left + readingMm * pxPerMm * 2.6}
          y1="8"
          x2={left + readingMm * pxPerMm * 2.6}
          y2="94"
          stroke="#2563eb"
          strokeWidth="2"
        />
        <text
          x={left + readingMm * pxPerMm * 2.6}
          y="112"
          fontSize="13"
          fontWeight="700"
          textAnchor="middle"
          fill="#2563eb"
          fontFamily="sans-serif"
        >
          886mm
        </text>
      </svg>
      <figcaption className="text-sm text-muted-foreground">
        The big numbers are centimetres. Add a zero to get millimetres (88 → 880), then count the small
        ticks past it — each one is 1mm. Here that’s 880 + 6 = <strong>886mm</strong>.
      </figcaption>
    </figure>
  );
}

interface HandleProps {
  x?: number;
  y?: number;
  orientation?: 'left' | 'right';
}

export function Handle({ x = 0, y = 0, orientation = 'left' }: HandleProps) {
  const offsetX = orientation === 'right' ? -12 : 12;
  const handleWidth = 3;
  const handleHeight = 40;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Handle bar */}
      <rect
        x={offsetX}
        y="0"
        width={handleWidth}
        height={handleHeight}
        rx="1.5"
        fill="#B8B8B8"
        stroke="#888888"
        strokeWidth="0.5"
      />
      {/* Handle highlight */}
      <rect
        x={offsetX + 0.5}
        y="2"
        width="1"
        height={handleHeight - 4}
        rx="0.5"
        fill="#D8D8D8"
        opacity="0.6"
      />
    </g>
  );
}

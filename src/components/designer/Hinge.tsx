interface HingeProps {
  x?: number;
  y?: number;
  orientation?: 'left' | 'right' | '90-degree';
  type?: 'wall' | 'glass' | '90-degree';
}

export function Hinge({ x = 0, y = 0, orientation = 'left', type = 'wall' }: HingeProps) {
  const squareSize = 14;
  const squareWidth = 8;
  const gap = 2;
  let offsetX = 0;
  
  // Handle 90-degree hinges (for angled panel connections)
  if (type === '90-degree') {
    // Match the same angle as the panel's bottom channel
    // Panel goes left by 80 and up by 40, ratio = 40/80 = 0.5
    const angleRatio = 0.5;
    const returnBoxWidth = 7.2; // Keep the angled box the same size
    const verticalOffset = returnBoxWidth * angleRatio; // Proportional to width
    
    if (orientation === 'right') {
      // Right-oriented hinge: mirror of the left one
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Square on door panel - vertical edge */}
          <rect
            x={-squareWidth}
            y="0"
            width={squareWidth}
            height={squareSize}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="1"
          />
          
          {/* Parallelogram on return panel - angled like the bottom channel (mirrored) */}
          <path
            d={`
              M 0 ${squareSize}
              L ${returnBoxWidth} ${squareSize - verticalOffset}
              L ${returnBoxWidth} ${0 - verticalOffset}
              L 0 0
              Z
            `}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="1"
          />
        </g>
      );
    }
    
    // Left-oriented hinge (default)
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Square on door panel - vertical edge */}
        <rect
          x={0}
          y="0"
          width={squareWidth}
          height={squareSize}
          fill="#A0A0A0"
          stroke="#707070"
          strokeWidth="1"
        />
        
        {/* Parallelogram on return panel - angled like the bottom channel */}
        <path
          d={`
            M 0 ${squareSize}
            L ${-returnBoxWidth} ${squareSize - verticalOffset}
            L ${-returnBoxWidth} ${0 - verticalOffset}
            L 0 0
            Z
          `}
          fill="#A0A0A0"
          stroke="#707070"
          strokeWidth="1"
        />
      </g>
    );
  }
  
  // Handle 90-degree glass-to-glass hinges (for angled panel to door connection)
  if (orientation === '90-degree' && type === 'glass') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Square on door panel - vertical edge */}
        <rect
          x={0}
          y="0"
          width={squareWidth}
          height={squareSize}
          fill="#A0A0A0"
          stroke="#707070"
          strokeWidth="1"
        />
        
        {/* Second square on return panel - extends perpendicular at 90 degrees */}
        <rect
          x={0}
          y={-squareSize - gap}
          width={squareWidth}
          height={squareSize}
          fill="#A0A0A0"
          stroke="#707070"
          strokeWidth="1"
        />
      </g>
    );
  }
  
  if (type === 'wall') {
    // For wall type, align the hinge edge with the glass edge
    offsetX = orientation === 'left' ? 0 : -squareWidth;
  } else {
    // For glass type, center the gap between the two squares at the glass seam
    // Total width is: squareWidth + gap + squareWidth
    offsetX = -(squareWidth + gap / 2);
  }
  
  if (type === 'wall') {
    // Single square for glass-to-wall
    return (
      <g transform={`translate(${x + offsetX}, ${y})`}>
        <rect
          x="0"
          y="0"
          width={squareWidth}
          height={squareSize}
          fill="#A0A0A0"
          stroke="#707070"
          strokeWidth="1"
        />
      </g>
    );
  }
  
  // Two squares for glass-to-glass
  return (
    <g transform={`translate(${x + offsetX}, ${y})`}>
      {/* Left square */}
      <rect
        x="0"
        y="0"
        width={squareWidth}
        height={squareSize}
        fill="#A0A0A0"
        stroke="#707070"
        strokeWidth="1"
      />
      
      {/* Right square */}
      <rect
        x={squareWidth + gap}
        y="0"
        width={squareWidth}
        height={squareSize}
        fill="#A0A0A0"
        stroke="#707070"
        strokeWidth="1"
      />
    </g>
  );
}

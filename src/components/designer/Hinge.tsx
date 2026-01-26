interface HingeProps {
  x?: number;
  y?: number;
  orientation?: 'left' | 'right' | '90-degree';
  type?: 'wall' | 'glass' | '90-degree' | '135-degree' | 'return-fixed' | 'return-dual';
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
      // Right-oriented hinge: square on left (door), parallelogram on right (return panel)
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Parallelogram on return panel - extending to the right */}
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

          {/* Label - positioned to the right */}
          <text x={returnBoxWidth + 5} y={squareSize / 2 + 3} fontSize="8" fill="#666" fontFamily="Arial, sans-serif">90</text>
        </g>
      );
    }

    // Left-oriented hinge (default)
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Parallelogram on return panel - angled like the bottom channel, drawn first (behind) */}
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

        {/* Square on door panel - vertical edge, drawn second (in front) */}
        <rect
          x={0}
          y="0"
          width={squareWidth}
          height={squareSize}
          fill="#A0A0A0"
          stroke="#707070"
          strokeWidth="1"
        />

        {/* Label - positioned to the left */}
        <text x={-returnBoxWidth - 15} y={squareSize / 2 + 3} fontSize="8" fill="#666" fontFamily="Arial, sans-serif">90</text>
      </g>
    );
  }

  // Handle 135-degree hinges (for quadrant return panels)
  if (type === '135-degree') {
    // For 135-degree angle - going back towards the wall
    // This creates a hinge that connects the return panel at an obtuse angle
    // Match the panel's angle: depth * 20 horizontal = -depth * 10 vertical
    // ratio = 10/20 = 0.5
    const returnBoxWidth = 7.2;
    const verticalOffset = returnBoxWidth * 0.5; // Match the panel's isometric angle

    if (orientation === 'left') {
      // Left return panel - angled back to the left
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Parallelogram on return panel - angled back towards wall */}
          <path
            d={`
              M 0 0
              L ${-returnBoxWidth} ${-verticalOffset}
              L ${-returnBoxWidth} ${squareSize - verticalOffset}
              L 0 ${squareSize}
              Z
            `}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="1"
          />

          {/* Label - positioned to the left */}
          <text x={-returnBoxWidth - 15} y={squareSize / 2} fontSize="8" fill="#666" fontFamily="Arial, sans-serif">90</text>
        </g>
      );
    } else {
      // Right return panel - angled back to the right
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Parallelogram on return panel - angled back towards wall */}
          <path
            d={`
              M 0 0
              L ${returnBoxWidth} ${-verticalOffset}
              L ${returnBoxWidth} ${squareSize - verticalOffset}
              L 0 ${squareSize}
              Z
            `}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="1"
          />

          {/* Label - positioned to the right */}
          <text x={returnBoxWidth + 5} y={squareSize / 2} fontSize="8" fill="#666" fontFamily="Arial, sans-serif">90</text>
        </g>
      );
    }
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

  // Handle return-fixed hinges (for return panel + fixed panel configurations)
  if (type === 'return-fixed') {
    // This is for configurations like Return Left + Door + Return Right
    // The parallelogram represents the angled return panel, rectangle is the vertical door
    // Orientation indicates which direction the return panel angles
    const returnBoxWidth = 7.2;
    const angleRatio = 0.5;
    const verticalOffset = returnBoxWidth * angleRatio;

    if (orientation === 'left') {
      // Return panel angles to the left (backward and left)
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Square on door panel - vertical edge, drawn first (behind) */}
          <rect
            x={0}
            y="0"
            width={squareWidth}
            height={squareSize}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="1"
          />

          {/* Parallelogram on return panel - angled backward to the left, drawn second (in front) */}
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

          {/* Label - positioned to the left */}
          <text x={-returnBoxWidth - 15} y={squareSize / 2 + 3} fontSize="8" fill="#666" fontFamily="Arial, sans-serif">90</text>
        </g>
      );
    } else if (orientation === 'right') {
      // Return panel angles to the right (backward and right)
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Parallelogram on return panel - angled backward to the right, drawn first (behind) */}
          <path
            d={`
              M ${-squareWidth} ${squareSize}
              L ${-squareWidth + returnBoxWidth} ${squareSize - verticalOffset}
              L ${-squareWidth + returnBoxWidth} ${0 - verticalOffset}
              L ${-squareWidth} 0
              Z
            `}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="1"
          />

          {/* Square on door panel - vertical edge, drawn second (in front) */}
          <rect
            x={-squareWidth}
            y="0"
            width={squareWidth}
            height={squareSize}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="1"
          />

          {/* Label - positioned to the right */}
          <text x={returnBoxWidth + 5} y={squareSize / 2 + 3} fontSize="8" fill="#666" fontFamily="Arial, sans-serif">90</text>
        </g>
      );
    }
  }

  // Handle return-dual hinges (for Return Left + Door + Return Right only)
  if (type === 'return-dual') {
    const returnBoxWidth = 7.2;
    const angleRatio = 0.5;
    const verticalOffset = returnBoxWidth * angleRatio;

    if (orientation === 'left') {
      // Return panel angles to the left (backward and left)
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Square on door panel - vertical edge, drawn first (behind) - OFFSET TO RIGHT */}
          <rect
            x={8}
            y="0"
            width={squareWidth}
            height={squareSize}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="1"
          />

          {/* Parallelogram on return panel - angled backward to the left, drawn second (in front) */}
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

          {/* Label - positioned to the left */}
          <text x={-returnBoxWidth - 15} y={squareSize / 2 + 3} fontSize="8" fill="#666" fontFamily="Arial, sans-serif">90</text>
        </g>
      );
    } else if (orientation === 'right') {
      // Return panel angles to the right (backward and right)
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Parallelogram on return panel - angled backward to the right, drawn first (behind) */}
          <path
            d={`
              M ${-squareWidth} ${squareSize}
              L ${-squareWidth + returnBoxWidth} ${squareSize - verticalOffset}
              L ${-squareWidth + returnBoxWidth} ${0 - verticalOffset}
              L ${-squareWidth} 0
              Z
            `}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="1"
          />

          {/* Square on door panel - vertical edge, drawn second (in front) - OFFSET TO LEFT */}
          <rect
            x={-squareWidth - 8}
            y="0"
            width={squareWidth}
            height={squareSize}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="1"
          />

          {/* Label - positioned to the right */}
          <text x={returnBoxWidth + 5} y={squareSize / 2 + 3} fontSize="8" fill="#666" fontFamily="Arial, sans-serif">90</text>
        </g>
      );
    }
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

        {/* Label - positioned to the right */}
        <text x={squareWidth + 5} y={squareSize / 2 + 3} fontSize="8" fill="#666" fontFamily="Arial, sans-serif">wg</text>
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

      {/* Label - positioned to the right */}
      <text x={squareWidth * 2 + gap + 5} y={squareSize / 2 + 3} fontSize="8" fill="#666" fontFamily="Arial, sans-serif">gg</text>
    </g>
  );
}

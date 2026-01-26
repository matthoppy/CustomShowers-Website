interface PanelDoorProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  orientation?: 'front' | 'left' | 'right';
}

export function PanelDoor({
  width = 80,
  height = 260,
  x = 0,
  y = 0,
  orientation = 'front'
}: PanelDoorProps) {
  const depth = 4;

  if (orientation === 'front') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Main front face - slightly darker to distinguish from fixed */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="#A8C7DC"
          fillOpacity="0.45"
          stroke="#6B9DC4"
          strokeWidth="1.5"
        />
      </g>
    );
  }

  if (orientation === 'left') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Side face (left perspective) */}
        <path
          d={`M 0 0 L -${depth * 20} -${depth * 10} L -${depth * 20} ${height - depth * 10} L 0 ${height} Z`}
          fill="#9CBDD6"
          fillOpacity="0.5"
          stroke="#6B9DC4"
          strokeWidth="1.5"
        />
        {/* Top edge */}
        <path
          d={`M 0 0 L -${depth * 20} -${depth * 10} L ${width - depth * 20} -${depth * 10} L ${width} 0 Z`}
          fill="#A8C7DC"
          fillOpacity="0.45"
          stroke="#6B9DC4"
          strokeWidth="1"
        />
        {/* Front face */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="#A8C7DC"
          fillOpacity="0.45"
          stroke="#6B9DC4"
          strokeWidth="1.5"
          opacity="0.9"
        />
      </g>
    );
  }

  // orientation === 'right'
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Side face */}
      <path
        d={`M ${width} 0 L ${width + depth * 20} -${depth * 10} L ${width + depth * 20} ${height - depth * 10} L ${width} ${height} Z`}
        fill="#8CB3CC"
        fillOpacity="0.55"
        stroke="#6B9DC4"
        strokeWidth="1.5"
      />
      {/* Top edge */}
      <path
        d={`M 0 0 L ${depth * 20} -${depth * 10} L ${width + depth * 20} -${depth * 10} L ${width} 0 Z`}
        fill="#9CBDD6"
        fillOpacity="0.5"
        stroke="#6B9DC4"
        strokeWidth="1"
      />
      {/* Front face */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="#A8C7DC"
        fillOpacity="0.45"
        stroke="#6B9DC4"
        strokeWidth="1.5"
        opacity="0.9"
      />
    </g>
  );
}

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
          fill="#B5CEB9"
          stroke="#8B9D8F"
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
          fill="#A8C4AD"
          stroke="#8B9D8F"
          strokeWidth="1.5"
        />
        {/* Top edge */}
        <path
          d={`M 0 0 L -${depth * 20} -${depth * 10} L ${width - depth * 20} -${depth * 10} L ${width} 0 Z`}
          fill="#B5CEB9"
          stroke="#8B9D8F"
          strokeWidth="1"
        />
        {/* Front face */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="#B5CEB9"
          stroke="#8B9D8F"
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
        fill="#9BB49F"
        stroke="#8B9D8F"
        strokeWidth="1.5"
      />
      {/* Top edge */}
      <path
        d={`M 0 0 L ${depth * 20} -${depth * 10} L ${width + depth * 20} -${depth * 10} L ${width} 0 Z`}
        fill="#A8C4AD"
        stroke="#8B9D8F"
        strokeWidth="1"
      />
      {/* Front face */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="#B5CEB9"
        stroke="#8B9D8F"
        strokeWidth="1.5"
        opacity="0.9"
      />
    </g>
  );
}

interface PanelFixedProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  orientation?: 'front' | 'left' | 'right';
  channels?: ('bottom' | 'left' | 'right' | 'top')[];
}

export function PanelFixed({ 
  width = 80, 
  height = 260, 
  x = 0, 
  y = 0,
  orientation = 'front',
  channels = []
}: PanelFixedProps) {
  const depth = 4;
  const channelThickness = 2;
  
  if (orientation === 'front') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Main front face */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="#C5D9C9"
          stroke="#8B9D8F"
          strokeWidth="1.5"
        />
        
        {/* Bottom channel - runs through continuously */}
        {channels.includes('bottom') && (
          <rect
            x="0"
            y={height - channelThickness}
            width={width}
            height={channelThickness}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="0.5"
          />
        )}
        
        {/* Left channel - sits on top of bottom channel */}
        {channels.includes('left') && (
          <rect
            x="0"
            y="0"
            width={channelThickness}
            height={channels.includes('bottom') ? height - channelThickness : height}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="0.5"
          />
        )}
        
        {/* Right channel - sits on top of bottom channel */}
        {channels.includes('right') && (
          <rect
            x={width - channelThickness}
            y="0"
            width={channelThickness}
            height={channels.includes('bottom') ? height - channelThickness : height}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="0.5"
          />
        )}
      </g>
    );
  }
  
  if (orientation === 'left') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Side face - angled to the LEFT */}
        <path
          d={`M 0 0 L ${-depth * 20} -${depth * 10} L ${-depth * 20} ${height - depth * 10} L 0 ${height} Z`}
          fill="#B5CEB9"
          stroke="#8B9D8F"
          strokeWidth="1.5"
        />
        
        {/* Bottom channel on angled panel */}
        {channels.includes('bottom') && (
          <path
            d={`M 0 ${height} L ${-depth * 20} ${height - depth * 10} L ${-depth * 20} ${height - depth * 10 - channelThickness} L 0 ${height - channelThickness} Z`}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="0.5"
          />
        )}
        
        {/* Left side channel (vertical edge at back wall) on angled panel */}
        {channels.includes('left') && (
          <path
            d={`M ${-depth * 20} -${depth * 10} L ${-depth * 20 + channelThickness} -${depth * 10} L ${-depth * 20 + channelThickness} ${channels.includes('bottom') ? height - depth * 10 - channelThickness : height - depth * 10} L ${-depth * 20} ${channels.includes('bottom') ? height - depth * 10 - channelThickness : height - depth * 10} Z`}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="0.5"
          />
        )}
      </g>
    );
  }
  
  // orientation === 'right'
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Side face - angled back at 90 degrees */}
      <path
        d={`M 0 0 L ${depth * 20} -${depth * 10} L ${depth * 20} ${height - depth * 10} L 0 ${height} Z`}
        fill="#A8C4AD"
        stroke="#8B9D8F"
        strokeWidth="1.5"
      />
      
      {/* Bottom channel on side face */}
      {channels.includes('bottom') && (
        <path
          d={`M 0 ${height} L ${depth * 20} ${height - depth * 10} L ${depth * 20} ${height - depth * 10 - channelThickness} L 0 ${height - channelThickness} Z`}
          fill="#A0A0A0"
          stroke="#707070"
          strokeWidth="0.5"
        />
      )}
      
      {/* Right side channel (vertical edge at back wall) on angled panel */}
      {channels.includes('right') && (
        <path
          d={`M ${depth * 20} -${depth * 10} L ${depth * 20 - channelThickness} -${depth * 10} L ${depth * 20 - channelThickness} ${channels.includes('bottom') ? height - depth * 10 - channelThickness : height - depth * 10} L ${depth * 20} ${channels.includes('bottom') ? height - depth * 10 - channelThickness : height - depth * 10} Z`}
          fill="#A0A0A0"
          stroke="#707070"
          strokeWidth="0.5"
        />
      )}
    </g>
  );
}

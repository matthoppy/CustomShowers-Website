interface ChannelProps {
  width?: number;
  x?: number;
  y?: number;
  type?: 'top' | 'bottom';
}

export function Channel({ 
  width = 80, 
  x = 0, 
  y = 0,
  type = 'top'
}: ChannelProps) {
  const depth = 4;
  const channelHeight = 6;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Channel front face */}
      <rect
        x="0"
        y="0"
        width={width}
        height={channelHeight}
        fill="#A0A0A0"
        stroke="#707070"
        strokeWidth="1"
      />
      {/* Channel side (depth) */}
      <path
        d={`M 0 0 L -${depth} -${depth} L ${width - depth} -${depth} L ${width} 0 Z`}
        fill="#888888"
        stroke="#707070"
        strokeWidth="0.5"
      />
      {/* Channel detail line */}
      <line
        x1="0"
        y1={channelHeight / 2}
        x2={width}
        y2={channelHeight / 2}
        stroke="#606060"
        strokeWidth="0.5"
      />
    </g>
  );
}

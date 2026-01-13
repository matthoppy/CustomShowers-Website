import { PanelFixed } from './PanelFixed';
import { PanelDoor } from './PanelDoor';
import { Hinge } from './Hinge';
import { Handle } from './Handle';
import { Channel } from './Channel';

export type ShowerTemplateType = 
  | 'single-door' 
  | 'double-door' 
  | 'left-panel' 
  | 'right-panel' 
  | 'three-panel' 
  | 'corner-left' 
  | 'corner-right' 
  | '90-return' 
  | '90-return-left' 
  | '90-return-right' 
  | 'angled-ceiling';

interface ShowerConfigurationProps {
  type: ShowerTemplateType;
  width?: number;
  height?: number;
}

export function ShowerConfiguration({ 
  type, 
  width = 320, 
  height = 400 
}: ShowerConfigurationProps) {
  const panelHeight = 260;
  const panelWidth = 90;
  const startX = (width - panelWidth) / 2;
  const startY = (height - panelHeight) / 2 + 20;

  const renderConfiguration = () => {
    switch (type) {
      case 'single-door':
        return (
          <>
            <PanelDoor width={panelWidth} height={panelHeight} x={startX} y={startY} />
            <Hinge x={startX} y={startY + 30} orientation="left" type="wall" />
            <Hinge x={startX} y={startY + 220} orientation="left" type="wall" />
            <Handle x={startX + panelWidth} y={startY + panelHeight / 2 - 20 + panelHeight * 0.10} orientation="right" />
          </>
        );

      case 'double-door':
        return (
          <>
            <PanelDoor width={panelWidth} height={panelHeight} x={startX - panelWidth / 2} y={startY} />
            <PanelFixed width={panelWidth} height={panelHeight} x={startX + panelWidth / 2} y={startY} channels={['bottom', 'right']} />
            <Hinge x={startX - panelWidth / 2} y={startY + 30} orientation="left" type="wall" />
            <Hinge x={startX - panelWidth / 2} y={startY + 220} orientation="left" type="wall" />
            <Handle x={startX - panelWidth / 2 + panelWidth} y={startY + panelHeight / 2 - 20 + panelHeight * 0.10} orientation="right" />
          </>
        );

      case 'left-panel':
        return (
          <>
            <PanelDoor width={panelWidth} height={panelHeight} x={startX - panelWidth / 2} y={startY} />
            <PanelFixed width={panelWidth} height={panelHeight * 0.75} x={startX + panelWidth / 2} y={startY} channels={['bottom', 'right']} />
            <Hinge x={startX - panelWidth / 2} y={startY + 30} orientation="left" type="wall" />
            <Hinge x={startX - panelWidth / 2} y={startY + 220} orientation="left" type="wall" />
            <Handle x={startX - panelWidth / 2 + panelWidth} y={startY + panelHeight / 2 - 20 + panelHeight * 0.10} orientation="right" />
          </>
        );

      case 'right-panel':
        return (
          <>
            <PanelDoor width={panelWidth} height={panelHeight} x={startX - panelWidth / 2} y={startY} />
            {/* Custom stepped fixed panel - full height on left, notched down on right */}
            <g transform={`translate(${startX + panelWidth / 2}, ${startY})`}>
              {/* Main glass panel with stepped shape */}
              <path
                d={`M 0 0 L ${panelWidth} 0 L ${panelWidth} ${panelHeight * 0.75} L ${panelWidth / 2} ${panelHeight * 0.75} L ${panelWidth / 2} ${panelHeight} L 0 ${panelHeight} Z`}
                fill="#C5D9C9"
                stroke="#8B9D8F"
                strokeWidth="1.5"
              />
              {/* Bottom channel - runs continuously across both sections */}
              <rect
                x="0"
                y={panelHeight - 2}
                width={panelWidth / 2}
                height={2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
              <rect
                x={panelWidth / 2}
                y={panelHeight * 0.75 - 2}
                width={panelWidth / 2}
                height={2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
              {/* Right channel on notched section */}
              <rect
                x={panelWidth - 2}
                y="0"
                width={2}
                height={panelHeight * 0.75 - 2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
              {/* Vertical channel on step - sits on bottom channel */}
              <rect
                x={panelWidth / 2}
                y={panelHeight * 0.75}
                width={2}
                height={panelHeight * 0.25 - 2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
            </g>
            <Hinge x={startX - panelWidth / 2} y={startY + 30} orientation="left" type="wall" />
            <Hinge x={startX - panelWidth / 2} y={startY + 220} orientation="left" type="wall" />
            <Handle x={startX - panelWidth / 2 + panelWidth} y={startY + panelHeight / 2 - 20 + panelHeight * 0.10} orientation="right" />
          </>
        );

      case 'three-panel':
        return (
          <>
            <PanelFixed width={panelWidth * 0.6} height={panelHeight} x={startX - panelWidth * 0.8} y={startY} channels={['bottom', 'left']} />
            <PanelDoor width={panelWidth * 0.8} height={panelHeight} x={startX - panelWidth * 0.2} y={startY} />
            <PanelFixed width={panelWidth * 0.6} height={panelHeight} x={startX + panelWidth * 0.6} y={startY} channels={['bottom', 'right']} />
            <Hinge x={startX - panelWidth * 0.2} y={startY + 30} orientation="left" type="glass" />
            <Hinge x={startX - panelWidth * 0.2} y={startY + 220} orientation="left" type="glass" />
            <Handle x={startX + panelWidth * 0.6} y={startY + panelHeight / 2 - 20} orientation="right" />
          </>
        );

      case 'corner-left':
        return (
          <>
            <PanelFixed width={panelWidth * 0.6} height={panelHeight * 0.75} x={startX - panelWidth * 0.8} y={startY} channels={['bottom', 'left']} />
            <PanelDoor width={panelWidth * 0.8} height={panelHeight} x={startX - panelWidth * 0.2} y={startY} />
            <PanelFixed width={panelWidth * 0.6} height={panelHeight * 0.75} x={startX + panelWidth * 0.6} y={startY} channels={['bottom', 'right']} />
            <Hinge x={startX - panelWidth * 0.2} y={startY + 30} orientation="left" type="glass" />
            <Hinge x={startX - panelWidth * 0.2} y={startY + 220} orientation="left" type="wall" />
            <Handle x={startX + panelWidth * 0.6} y={startY + panelHeight / 2 - 20 + panelHeight * 0.10} orientation="right" />
          </>
        );

      case 'corner-right':
        return (
          <>
            {/* Left fixed panel with stepped notch - flipped: notched on left, full height on right */}
            <g transform={`translate(${startX - panelWidth * 0.8}, ${startY})`}>
              <path
                d={`M 0 ${panelHeight * 0.75} L 0 0 L ${panelWidth * 0.6} 0 L ${panelWidth * 0.6} ${panelHeight} L ${panelWidth * 0.3} ${panelHeight} L ${panelWidth * 0.3} ${panelHeight * 0.75} Z`}
                fill="#C5D9C9"
                stroke="#8B9D8F"
                strokeWidth="1.5"
              />
              {/* Bottom channel - runs continuously across both sections */}
              <rect
                x="0"
                y={panelHeight * 0.75 - 2}
                width={panelWidth * 0.3}
                height={2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
              <rect
                x={panelWidth * 0.3}
                y={panelHeight - 2}
                width={panelWidth * 0.3}
                height={2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
              {/* Left channel - at wall edge, only on tall section */}
              <rect
                x="0"
                y="0"
                width={2}
                height={panelHeight * 0.75 - 2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
              {/* Right channel - full height */}
              <rect
                x={panelWidth * 0.6 - 2}
                y="0"
                width={2}
                height={panelHeight - 2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
              {/* Vertical channel on step - sits on bottom channel */}
              <rect
                x={panelWidth * 0.3}
                y={panelHeight * 0.75}
                width={2}
                height={panelHeight * 0.25 - 2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
            </g>
            
            <PanelDoor width={panelWidth * 0.8} height={panelHeight} x={startX - panelWidth * 0.2} y={startY} />
            
            {/* Right fixed panel with stepped notch - flipped: full height on left, notched on right */}
            <g transform={`translate(${startX + panelWidth * 0.6}, ${startY})`}>
              <path
                d={`M 0 0 L ${panelWidth * 0.6} 0 L ${panelWidth * 0.6} ${panelHeight * 0.75} L ${panelWidth * 0.3} ${panelHeight * 0.75} L ${panelWidth * 0.3} ${panelHeight} L 0 ${panelHeight} Z`}
                fill="#C5D9C9"
                stroke="#8B9D8F"
                strokeWidth="1.5"
              />
              {/* Bottom channel - runs continuously across both sections */}
              <rect
                x="0"
                y={panelHeight - 2}
                width={panelWidth * 0.3}
                height={2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
              <rect
                x={panelWidth * 0.3}
                y={panelHeight * 0.75 - 2}
                width={panelWidth * 0.3}
                height={2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
              {/* Left channel - full height */}
              <rect
                x="0"
                y="0"
                width={2}
                height={panelHeight - 2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
              {/* Right channel - at wall edge, only on tall section */}
              <rect
                x={panelWidth * 0.6 - 2}
                y="0"
                width={2}
                height={panelHeight * 0.75 - 2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
              {/* Vertical channel on step - sits on bottom channel */}
              <rect
                x={panelWidth * 0.3}
                y={panelHeight * 0.75}
                width={2}
                height={panelHeight * 0.25 - 2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
            </g>
            
            <Hinge x={startX - panelWidth * 0.2} y={startY + 30} orientation="left" type="glass" />
            <Hinge x={startX - panelWidth * 0.2} y={startY + 220} orientation="left" type="glass" />
            <Handle x={startX + panelWidth * 0.6} y={startY + panelHeight / 2 - 20 + panelHeight * 0.10} orientation="right" />
          </>
        );

      case '90-return':
        return (
          <>
            {/* Front door panel */}
            <PanelDoor
              width={panelWidth}
              height={panelHeight}
              x={startX}
              y={startY}
            />
            
            {/* Wall hinges on the left side of the door */}
            <Hinge x={startX} y={startY + 40} orientation="left" type="wall" />
            <Hinge x={startX} y={startY + panelHeight - 52} orientation="left" type="wall" />
            
            {/* Handle on the right side of the door */}
            <Handle x={startX + panelWidth} y={startY + panelHeight / 2 - 20} orientation="right" />
            
            {/* Return panel angled back at 90 degrees - positioned to touch door's right edge */}
            <PanelFixed 
              width={panelWidth * 0.8} 
              height={panelHeight} 
              x={startX + panelWidth} 
              y={startY} 
              orientation="right"
              channels={['bottom', 'right']}
            />
          </>
        );

      case '90-return-left':
        return (
          <>
            {/* Door panel */}
            <PanelDoor
              width={panelWidth}
              height={panelHeight}
              x={startX}
              y={startY}
            />
            
            {/* Wall hinges on the left side of the door */}
            <Hinge x={startX} y={startY + 40} orientation="left" type="wall" />
            <Hinge x={startX} y={startY + panelHeight - 52} orientation="left" type="wall" />
            
            {/* Handle on the right side of the door */}
            <Handle x={startX + panelWidth} y={startY + panelHeight / 2 - 20} orientation="right" />
            
            {/* Return panel angled back at 90 degrees - goes off to the left */}
            <PanelFixed 
              width={panelWidth * 0.8} 
              height={panelHeight} 
              x={startX} 
              y={startY} 
              orientation="left"
              channels={['bottom', 'left']}
            />
            
            {/* 90-degree hinges along the seam between door and angled panel */}
            <Hinge x={startX} y={startY + 40} orientation="left" type="90-degree" />
            <Hinge x={startX} y={startY + panelHeight - 52} orientation="left" type="90-degree" />
          </>
        );

      case '90-return-right':
        return (
          <>
            {/* Door panel */}
            <PanelDoor
              width={panelWidth}
              height={panelHeight}
              x={startX}
              y={startY}
            />
            
            {/* Handle on the left side of the door */}
            <Handle x={startX} y={startY + panelHeight / 2 - 20} orientation="left" />
            
            {/* Return panel angled back at 90 degrees - goes off to the right */}
            <PanelFixed 
              width={panelWidth * 0.8} 
              height={panelHeight} 
              x={startX + panelWidth} 
              y={startY} 
              orientation="right"
              channels={['bottom', 'right']}
            />
            
            {/* 90-degree hinges along the seam between door and angled panel */}
            <Hinge x={startX + panelWidth} y={startY + 40} orientation="right" type="90-degree" />
            <Hinge x={startX + panelWidth} y={startY + panelHeight - 52} orientation="right" type="90-degree" />
          </>
        );

      case 'angled-ceiling':
        return (
          <>
            {/* Front door panel */}
            <PanelDoor
              width={panelWidth}
              height={panelHeight}
              x={startX}
              y={startY}
            />
            
            {/* Wall hinges on the left side of the door */}
            <Hinge x={startX} y={startY + 40} orientation="left" type="wall" />
            <Hinge x={startX} y={startY + panelHeight - 52} orientation="left" type="wall" />
            
            {/* Handle on the right side of the door */}
            <Handle x={startX + panelWidth} y={startY + panelHeight / 2 - 20} orientation="right" />
            
            {/* Fixed panel with angled top edge (ceiling slope) */}
            <g transform={`translate(${startX + panelWidth}, ${startY})`}>
              {/* Main glass panel with angled top */}
              <path
                d={`M 0 0 L ${panelWidth * 0.8} ${panelHeight * 0.4} L ${panelWidth * 0.8} ${panelHeight} L 0 ${panelHeight} Z`}
                fill="#C5D9C9"
                stroke="#8B9D8F"
                strokeWidth="1.5"
              />
              {/* Bottom channel */}
              <rect
                x="0"
                y={panelHeight - 2}
                width={panelWidth * 0.8}
                height={2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
              {/* Right channel */}
              <rect
                x={panelWidth * 0.8 - 2}
                y={panelHeight * 0.4}
                width={2}
                height={panelHeight * 0.6 - 2}
                fill="#A0A0A0"
                stroke="#707070"
                strokeWidth="0.5"
              />
              {/* Angled top channel (follows ceiling slope) */}
              <line
                x1="0"
                y1="0"
                x2={panelWidth * 0.8}
                y2={panelHeight * 0.4}
                stroke="#707070"
                strokeWidth="2"
                fill="none"
              />
            </g>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {renderConfiguration()}
    </svg>
  );
}

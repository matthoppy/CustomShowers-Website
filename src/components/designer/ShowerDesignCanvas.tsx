/**
 * Shower Design Canvas Component
 * 2D top-down view of shower design with door, hinges, handles, and swing arcs
 */

import type { ShowerTemplate } from '@/lib/templates';
import Door_Hinged, { type DoorSwingVariant } from './Door_Hinged';

type DoorSwing = 'in' | 'out' | 'in-out';
type HingeType = 'geneva' | 'vienna' | 'bellagio';
type HandleType = 'knob' | 'pull';
type ThresholdType = 'standard' | 'low-profile' | 'flush';

interface ShowerDesignCanvasProps {
  template: ShowerTemplate;
  doorSwing: DoorSwing;
  hingeType: HingeType;
  handleType: HandleType;
  thresholdType: ThresholdType;
  width?: number;
  height?: number;
}

/**
 * Convert door swing string to Door_Hinged variant
 */
function mapSwingToVariant(swing: DoorSwing): DoorSwingVariant {
  switch (swing) {
    case 'in':
      return 'In';
    case 'out':
      return 'Out';
    case 'in-out':
      return 'InOut_180';
    default:
      return 'Out';
  }
}

export default function ShowerDesignCanvas({
  template,
  doorSwing,
  hingeType,
  handleType,
  thresholdType,
  width = 800,
  height = 600,
}: ShowerDesignCanvasProps) {
  // Get template dimensions from defaultMeasurements (in mm)
  const templateWidthMm = template.defaultMeasurements?.width || 1000;
  const templateHeightMm = template.defaultMeasurements?.height || 2000;
  
  // Convert mm to pixels (1mm = 0.3px for better fit in canvas)
  const scale = Math.min(
    (width * 0.8) / templateWidthMm,
    (height * 0.8) / templateHeightMm
  );
  
  const templateWidth = templateWidthMm * scale;
  const templateHeight = templateHeightMm * scale;
  
  // Center the design in the canvas
  const offsetX = (width - templateWidth) / 2;
  const offsetY = (height - templateHeight) / 2;
  
  // Find door panel from template
  const doorPanel = template.panels.find(p => p.type === 'door');
  if (!doorPanel) {
    return <div className="text-center text-slate-600 p-8">No door panel found in template</div>;
  }
  
  // Door dimensions (from panel dimensions, which are percentages)
  const doorWidthPercent = doorPanel.dimensions[0]; // width %
  const doorHeightPercent = doorPanel.dimensions[1]; // height %
  const doorWidth = (templateWidth * doorWidthPercent) / 100;
  const doorHeight = (templateHeight * doorHeightPercent) / 100;
  
  // Door position (from panel position, which is percentage)
  const doorXPercent = doorPanel.position[0]; // x position %
  const doorYPercent = doorPanel.position[1]; // y position %
  const doorX = offsetX + (templateWidth * doorXPercent) / 100;
  const doorY = offsetY + (templateHeight * doorYPercent) / 100;
  
  // Hinge positions (250mm from top and bottom)
  const hingeOffsetMm = 250;
  const hingeOffset = hingeOffsetMm * scale;
  const topHingeY = doorY + hingeOffset;
  const bottomHingeY = doorY + doorHeight - hingeOffset;
  const hingeX = doorX; // Hinges on the door edge (left side for right-opening door)
  
  // Map door swing to Door_Hinged variant
  const doorSwingVariant = mapSwingToVariant(doorSwing);
  
  return (
    <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 rounded-lg overflow-hidden" style={{ width, height }}>
      <svg width={width} height={height} className="absolute inset-0">
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Fixed glass panels */}
        {template.panels
          ?.filter(panel => panel.type === 'fixed')
          .map((panel, idx) => {
            const panelXPercent = panel.position[0];
            const panelYPercent = panel.position[1];
            const panelWidthPercent = panel.dimensions[0];
            const panelHeightPercent = panel.dimensions[1];
            
            const panelX = offsetX + (templateWidth * panelXPercent) / 100;
            const panelY = offsetY + (templateHeight * panelYPercent) / 100;
            const panelWidth = (templateWidth * panelWidthPercent) / 100;
            const panelHeight = (templateHeight * panelHeightPercent) / 100;
            
            return (
              <g key={`panel-${idx}`}>
                <rect
                  x={panelX}
                  y={panelY}
                  width={panelWidth}
                  height={panelHeight}
                  fill="rgba(200, 220, 240, 0.3)"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                />
                {/* Glass edge indicator */}
                <line
                  x1={panelX + panelWidth}
                  y1={panelY}
                  x2={panelX + panelWidth}
                  y2={panelY + panelHeight}
                  stroke="#60a5fa"
                  strokeWidth="2"
                />
              </g>
            );
          })}
        
        {/* Door_Hinged Component */}
        <Door_Hinged
          x={doorX}
          y={doorY}
          width={doorWidth}
          height={doorHeight}
          swing={doorSwingVariant}
          handleType={handleType}
          hingeX={hingeX}
          topHingeY={topHingeY}
          bottomHingeY={bottomHingeY}
        />
        
        {/* Threshold */}
        <rect
          x={offsetX}
          y={offsetY + templateHeight}
          width={templateWidth}
          height="8"
          fill="#78716c"
          stroke="#57534e"
          strokeWidth="1"
        />
      </svg>
      
      {/* Labels overlay */}
      <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-2 rounded shadow-sm text-xs">
        <div className="font-semibold mb-1">Template: {template.name}</div>
        <div className="text-muted-foreground">
          Door Swing: {doorSwing.toUpperCase()} | Hinges: {hingeType} | Handle: {handleType}
        </div>
      </div>
    </div>
  );
}

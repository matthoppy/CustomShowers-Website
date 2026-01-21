/**
 * Shower Configuration with Dimension Lines
 * Wraps ShowerConfiguration and adds dimension lines with editable measurements
 */

import { ShowerConfiguration, type ShowerTemplateType } from './ShowerConfiguration';
import { DimensionLines } from './DimensionLines';
import { ShowerOverlays } from './ShowerOverlays';

interface ShowerConfigurationWithDimensionsProps {
  type: ShowerTemplateType;
  width?: number;
  height?: number;
  /** Door swing direction */
  doorSwing?: 'in' | 'out' | 'in-out';
  /** Floor rake value in mm */
  floorRake?: number;
  /** Floor rake direction */
  floorRakeDirection?: 'none' | 'left' | 'right';
  /** Left wall rake value in mm */
  leftWallRake?: number;
  /** Left wall rake direction */
  leftWallRakeDirection?: 'none' | 'in' | 'out';
  /** Notches array */
  notches?: Array<{
    panel: 'panel-door' | 'panel-fixed' | 'panel-return';
    corner: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
    widthMm: number;
    heightMm: number;
  }>;
  /** Callback when dimensions change */
  onDimensionsChange?: (width: number, height: number) => void;
  /** Callback when door swing changes */
  onDoorSwingChange?: (swing: 'in' | 'out' | 'in-out') => void;
  /** Callback when notch is clicked */
  onNotchClick?: (notchIndex: number) => void;
  /** Callback when panel area is clicked (for adding notches) */
  onPanelClick?: (x: number, y: number) => void;
  /** Callback when notch is added */
  onNotchAdd?: (notch: {
    panel: 'panel-door' | 'panel-fixed' | 'panel-return';
    corner: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
    widthMm: number;
    heightMm: number;
  }) => void;
  /** Whether dimensions are editable */
  editable?: boolean;
  /** Whether interactive */
  interactive?: boolean;
}

export function ShowerConfigurationWithDimensions({
  type,
  width = 900,
  height = 2000,
  doorSwing = 'out',
  floorRake = 0,
  floorRakeDirection = 'none',
  leftWallRake = 0,
  leftWallRakeDirection = 'none',
  notches = [],
  onDimensionsChange,
  onDoorSwingChange,
  onNotchClick,
  onPanelClick,
  onNotchAdd,
  editable = true,
  interactive = false,
}: ShowerConfigurationWithDimensionsProps) {
  // Use props directly - dimensions are controlled by parent
  const displayWidth = width;
  const displayHeight = height;

  // Calculate panel dimensions based on template type
  const panelHeight = 260;
  const panelWidth = 90;
  const startX = (width - panelWidth) / 2;
  const startY = (height - panelHeight) / 2 + 20;

  // Calculate actual panel positions for dimension lines
  const getPanelDimensions = () => {
    switch (type) {
      case 'single-door':
        return {
          x: startX,
          y: startY,
          width: panelWidth,
          height: panelHeight,
        };
      case 'double-door':
        return {
          x: startX - panelWidth / 2,
          y: startY,
          width: panelWidth * 2,
          height: panelHeight,
        };
      case 'left-panel':
        return {
          x: startX - panelWidth / 2,
          y: startY,
          width: panelWidth * 1.5,
          height: panelHeight,
        };
      case 'right-panel':
        return {
          x: startX - panelWidth / 2,
          y: startY,
          width: panelWidth * 1.5,
          height: panelHeight,
        };
      case 'three-panel':
        return {
          x: startX - panelWidth * 0.8,
          y: startY,
          width: panelWidth * 2,
          height: panelHeight,
        };
      case 'corner-left':
      case 'corner-right':
        return {
          x: startX - panelWidth * 0.8,
          y: startY,
          width: panelWidth * 2,
          height: panelHeight,
        };
      case '90-return':
      case '90-return-left':
      case '90-return-right':
        return {
          x: startX,
          y: startY,
          width: panelWidth * 1.8,
          height: panelHeight,
        };
      case 'angled-ceiling':
        return {
          x: startX,
          y: startY,
          width: panelWidth * 1.8,
          height: panelHeight,
        };
      default:
        return {
          x: startX,
          y: startY,
          width: panelWidth,
          height: panelHeight,
        };
    }
  };

  const panelDims = getPanelDimensions();

  const handleWidthChange = (newWidth: number) => {
    onDimensionsChange?.(newWidth, displayHeight);
  };

  const handleHeightChange = (newHeight: number) => {
    onDimensionsChange?.(displayWidth, newHeight);
  };

  return (
    <div className="relative inline-block" style={{ width: width, height: height + 80 }}>
      {/* Shower Configuration SVG */}
      <div className="absolute top-0 left-0" style={{ width: width, height: height }}>
        <ShowerConfiguration type={type} width={width} height={height} />
      </div>
      
      {/* Dimension Lines and Overlays SVG Overlay */}
      <svg 
        width={width} 
        height={height + 80} 
        viewBox={`0 0 ${width} ${height + 80}`}
        className="absolute top-0 left-0"
        style={{ pointerEvents: editable ? 'auto' : 'none' }}
      >
        <DimensionLines
          x={panelDims.x}
          y={panelDims.y}
          width={panelDims.width}
          height={panelDims.height}
          widthValue={displayWidth}
          heightValue={displayHeight}
          onWidthChange={editable ? handleWidthChange : undefined}
          onHeightChange={editable ? handleHeightChange : undefined}
          editable={editable}
        />
        <ShowerOverlays
          x={panelDims.x}
          y={panelDims.y}
          width={panelDims.width}
          height={panelDims.height}
          doorSwing={doorSwing}
          floorRake={floorRake}
          floorRakeDirection={floorRakeDirection}
          leftWallRake={leftWallRake}
          leftWallRakeDirection={leftWallRakeDirection}
          notches={notches}
          onDoorSwingChange={interactive ? onDoorSwingChange : undefined}
          onNotchClick={interactive ? onNotchClick : undefined}
          onPanelClick={interactive ? (clickX, clickY) => {
            // Determine which corner was clicked
            const centerX = panelDims.x + panelDims.width / 2;
            const centerY = panelDims.y + panelDims.height / 2;
            const cornerX = clickX < centerX ? 'left' : 'right';
            const cornerY = clickY < centerY ? 'top' : 'bottom';
            const corner = `${cornerY}-${cornerX}` as 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
            
            if (onNotchAdd) {
              onNotchAdd({
                panel: 'panel-door',
                corner,
                widthMm: 60,
                heightMm: 40,
              });
            }
          } : undefined}
          interactive={interactive}
        />
      </svg>
    </div>
  );
}

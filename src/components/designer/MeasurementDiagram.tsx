/**
 * Measurement Diagram Component
 * 2D top-down or front view of shower with measurement points
 */

import { useState } from 'react';
import MeasurementPoint from './MeasurementPoint';
import type { ShowerTemplate } from '@/lib/templates';
import type { MeasurementPoint as MeasurementPointType } from '@/lib/measurements';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MeasurementDiagramProps {
  template: ShowerTemplate;
  measurements: MeasurementPointType[];
  onUpdateMeasurement: (measurement: MeasurementPointType) => void;
}

type ViewMode = 'top' | 'front';

export default function MeasurementDiagram({
  template,
  measurements,
  onUpdateMeasurement,
}: MeasurementDiagramProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('front');

  const toggleView = () => {
    setViewMode((prev) => (prev === 'top' ? 'front' : 'top'));
  };

  /**
   * Render glass panels in 2D
   */
  const renderPanels = () => {
    return template.panels.map((panel) => {
      // Convert 3D panel definition to 2D representation
      const isVerticalView = viewMode === 'front';

      // Calculate panel position and size based on view mode
      let x, y, width, height;

      if (isVerticalView) {
        // Front view (looking at shower from outside)
        x = panel.position[0];
        y = 20; // Fixed Y for front view
        width = panel.dimensions[0];
        height = panel.dimensions[1];
      } else {
        // Top view (bird's eye)
        x = panel.position[0];
        y = panel.position[2] || 0;
        width = panel.dimensions[0];
        height = 20; // Depth representation
      }

      // Determine fill color based on panel type
      const fillColor =
        panel.type === 'door'
          ? 'rgba(163, 230, 200, 0.4)' // Lighter for door
          : 'rgba(163, 230, 200, 0.6)'; // Darker for fixed panel

      const strokeColor = panel.type === 'door' ? '#4ade80' : '#22c55e';

      return (
        <g key={panel.id}>
          <rect
            x={`${x}%`}
            y={`${y}%`}
            width={`${width}%`}
            height={`${height}%`}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
            rx="2"
          />
          {/* Panel label */}
          <text
            x={`${x + width / 2}%`}
            y={`${y + height / 2}%`}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-current text-foreground/50"
          >
            {panel.type === 'door' ? 'Door' : 'Panel'}
          </text>
        </g>
      );
    });
  };

  /**
   * Render dimension lines
   */
  const renderDimensionLines = () => {
    return measurements.map((measurement, idx) => {
      const pos = measurement.position;

      // Determine line orientation
      const isHorizontal = measurement.orientation === 'horizontal';

      if (isHorizontal) {
        // Horizontal dimension line
        return (
          <g key={`dim-${idx}`}>
            <line
              x1={`${pos[0] - 10}%`}
              y1={`${pos[1]}%`}
              x2={`${pos[0] + 10}%`}
              y2={`${pos[1]}%`}
              stroke="currentColor"
              strokeWidth="1"
              className="text-muted-foreground"
            />
            {/* End markers */}
            <line
              x1={`${pos[0] - 10}%`}
              y1={`${pos[1] - 1}%`}
              x2={`${pos[0] - 10}%`}
              y2={`${pos[1] + 1}%`}
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted-foreground"
            />
            <line
              x1={`${pos[0] + 10}%`}
              y1={`${pos[1] - 1}%`}
              x2={`${pos[0] + 10}%`}
              y2={`${pos[1] + 1}%`}
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted-foreground"
            />
          </g>
        );
      } else {
        // Vertical dimension line
        return (
          <g key={`dim-${idx}`}>
            <line
              x1={`${pos[0]}%`}
              y1={`${pos[1] - 10}%`}
              x2={`${pos[0]}%`}
              y2={`${pos[1] + 10}%`}
              stroke="currentColor"
              strokeWidth="1"
              className="text-muted-foreground"
            />
            {/* End markers */}
            <line
              x1={`${pos[0] - 1}%`}
              y1={`${pos[1] - 10}%`}
              x2={`${pos[0] + 1}%`}
              y2={`${pos[1] - 10}%`}
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted-foreground"
            />
            <line
              x1={`${pos[0] - 1}%`}
              y1={`${pos[1] + 10}%`}
              x2={`${pos[0] + 1}%`}
              y2={`${pos[1] + 10}%`}
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted-foreground"
            />
          </g>
        );
      }
    });
  };

  /**
   * Render wall indicators
   */
  const renderWalls = () => {
    // Show walls based on template configuration
    const walls = [];

    // Left wall (for inline/corner)
    if (template.category === 'inline' || template.category === 'corner') {
      walls.push(
        <line
          key="wall-left"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
          stroke="currentColor"
          strokeWidth="4"
          className="text-foreground/30"
        />
      );
    }

    // Right wall (for inline)
    if (template.category === 'inline') {
      walls.push(
        <line
          key="wall-right"
          x1="100%"
          y1="0%"
          x2="100%"
          y2="100%"
          stroke="currentColor"
          strokeWidth="4"
          className="text-foreground/30"
        />
      );
    }

    // Back wall (for corner)
    if (template.category === 'corner') {
      walls.push(
        <line
          key="wall-back"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
          stroke="currentColor"
          strokeWidth="4"
          className="text-foreground/30"
        />
      );
    }

    return walls;
  };

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <div className="mt-0.5">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Please enter the measurements for your Shower. The image will update to reflect your changes as you make them.
            </p>
          </div>
        </div>
      </div>

      {/* Diagram container */}
      <div className="relative border-2 border-border rounded-lg bg-muted/30 p-8" style={{ minHeight: '500px' }}>
        {/* View mode toggle */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleView}
            className="gap-2"
          >
            <RotateCw className="w-4 h-4" />
            {viewMode === 'front' ? 'Front View' : 'Top View'}
          </Button>
        </div>

        {/* SVG Diagram */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ minHeight: '400px' }}
        >
          {/* Background grid (optional) */}
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-muted-foreground/10"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Walls */}
          {renderWalls()}

          {/* Glass panels */}
          {renderPanels()}

          {/* Dimension lines */}
          {renderDimensionLines()}
        </svg>

        {/* Measurement points overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative w-full h-full">
            {measurements.map((measurement) => (
              <div key={measurement.id} className="pointer-events-auto">
                <MeasurementPoint
                  measurement={measurement}
                  onUpdate={onUpdateMeasurement}
                  position={measurement.position}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Measurement summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        {measurements.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between p-3 bg-muted rounded-lg"
          >
            <span className="text-muted-foreground">{m.label}:</span>
            <span className="font-semibold">{m.value}mm</span>
          </div>
        ))}
      </div>
    </div>
  );
}

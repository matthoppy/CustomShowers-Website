/**
 * 3D Shower Preview Component
 * Renders shower design with glass panels and hardware using React Three Fiber
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import type { ShowerTemplate } from '@/lib/templates';
import type { HardwareFinish, GlassType } from '@/types';

interface ShowerPreview3DProps {
  template: ShowerTemplate;
  glassType?: GlassType;
  hardwareFinish?: HardwareFinish;
  showHardware?: boolean;
  width?: number;
  height?: number;
}

/**
 * Glass panel material colors
 */
const GLASS_MATERIALS: Record<GlassType, { color: string; opacity: number; roughness: number }> = {
  clear: { color: '#e8f4f8', opacity: 0.3, roughness: 0.1 },
  frosted: { color: '#f0f8ff', opacity: 0.6, roughness: 0.5 },
  tinted: { color: '#b8d8e8', opacity: 0.5, roughness: 0.2 },
};

/**
 * Hardware finish colors
 */
const HARDWARE_COLORS: Record<HardwareFinish, string> = {
  chrome: '#c0c0c0',
  'brushed-nickel': '#8c8c7a',
  'matte-black': '#1a1a1a',
  gold: '#d4af37',
};

/**
 * Glass Panel Component
 */
function GlassPanel({
  position,
  rotation,
  dimensions,
  glassType = 'clear',
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  dimensions: [number, number, number];
  glassType: GlassType;
}) {
  const material = GLASS_MATERIALS[glassType];

  // Convert percentage dimensions to actual 3D units
  const width = dimensions[0] / 100;
  const height = dimensions[1] / 100;
  const depth = 0.008; // 8mm glass thickness in meters

  return (
    <mesh
      position={position}
      rotation={rotation.map((r) => (r * Math.PI) / 180) as [number, number, number]}
    >
      <boxGeometry args={[width, height, depth]} />
      <meshPhysicalMaterial
        color={material.color}
        transparent
        opacity={material.opacity}
        roughness={material.roughness}
        metalness={0.1}
        transmission={0.9}
        thickness={depth}
        envMapIntensity={1}
      />
    </mesh>
  );
}

/**
 * Hardware Component (hinges, handles, clamps)
 */
function Hardware({
  type,
  position,
  finish = 'chrome',
}: {
  type: 'hinge' | 'handle' | 'clamp';
  position: [number, number, number];
  finish: HardwareFinish;
}) {
  const color = HARDWARE_COLORS[finish];

  // Different geometries for different hardware types
  const getGeometry = () => {
    switch (type) {
      case 'hinge':
        return <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />;
      case 'handle':
        return <boxGeometry args={[0.02, 0.3, 0.02]} />;
      case 'clamp':
        return <boxGeometry args={[0.03, 0.03, 0.02]} />;
      default:
        return <sphereGeometry args={[0.01]} />;
    }
  };

  return (
    <mesh position={position}>
      {getGeometry()}
      <meshStandardMaterial color={color} metalness={0.9} roughness={0.3} />
    </mesh>
  );
}

/**
 * Shower enclosure from template
 */
function ShowerEnclosure({
  template,
  glassType = 'clear',
  hardwareFinish = 'chrome',
  showHardware = true,
}: {
  template: ShowerTemplate;
  glassType: GlassType;
  hardwareFinish: HardwareFinish;
  showHardware: boolean;
}) {
  return (
    <group>
      {/* Render glass panels */}
      {template.panels.map((panel) => (
        <GlassPanel
          key={panel.id}
          position={panel.position}
          rotation={panel.rotation}
          dimensions={panel.dimensions}
          glassType={glassType}
        />
      ))}

      {/* Render hardware */}
      {showHardware &&
        template.hardware.map((hw, idx) => {
          // Find the panel this hardware is attached to
          const panel = template.panels.find((p) => p.id === hw.panelId);
          if (!panel) return null;

          // Calculate hardware position based on panel position and hardware position percentages
          const panelWidth = panel.dimensions[0] / 100;
          const panelHeight = panel.dimensions[1] / 100;

          // Convert hardware position from percentage to actual position
          const hwX = panel.position[0] + (hw.position[0] / 100) * panelWidth - panelWidth / 2;
          const hwY = panel.position[1] + (hw.position[1] / 100) * panelHeight - panelHeight / 2;
          const hwZ = panel.position[2];

          return (
            <Hardware
              key={`${hw.panelId}-${idx}`}
              type={hw.type}
              position={[hwX, hwY, hwZ]}
              finish={hardwareFinish}
            />
          );
        })}

      {/* Floor plane for reference */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
    </group>
  );
}

/**
 * Main 3D Preview Component
 */
export default function ShowerPreview3D({
  template,
  glassType = 'clear',
  hardwareFinish = 'chrome',
  showHardware = true,
  width = 400,
  height = 400,
}: ShowerPreview3DProps) {
  return (
    <div
      style={{ width, height }}
      className="rounded-lg overflow-hidden border border-border bg-muted"
    >
      <Canvas shadows>
        <Suspense fallback={null}>
          {/* Camera */}
          <PerspectiveCamera makeDefault position={[2, 1.5, 2]} fov={50} />

          {/* Lights */}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={0.8}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-5, 5, 2]} intensity={0.3} />

          {/* Shower enclosure */}
          <ShowerEnclosure
            template={template}
            glassType={glassType}
            hardwareFinish={hardwareFinish}
            showHardware={showHardware}
          />

          {/* Controls */}
          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.5}
            minDistance={2}
            maxDistance={4}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

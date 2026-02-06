import { useState } from 'react';
import { ShowerConfiguration, type DoorVariant } from './components/designer/ShowerConfiguration';
import { Square1Configurator } from './components/designer/Square1Configurator';

export default function App() {
  // Track door variant for each configuration
  const [doorVariants, setDoorVariants] = useState<Record<string, DoorVariant>>({
    // Inline
    'single': 'right',
    'panel-and-door': 'right',
    'door-and-panel': 'right',
    'center-door': 'right',
    // Square
    'l-left': 'right',
    'l-right': 'right',
    'fixed-door-return-left': 'right',
    'door-fixed-return-right': 'right',
    'fixed-door-return-right': 'right',
    'dual-return': 'right',
    'return-door-fixed-left': 'right',
    'return-door-fixed-right': 'right',
    'return-left-fixed-door-fixed': 'right',
    'return-left-fixed-door-fixed-return-right': 'right',
    'return-left-fixed-door-return-right': 'right',
    'return-left-door-fixed-return-right': 'right',
    'back-return-left-door': 'right',
    'door-return-right-back': 'right',
    'back-return-left-fixed-door': 'right',
    'door-fixed-return-right-back': 'right',
    'back-return-left-door-fixed': 'right',
    'fixed-door-return-right-back': 'right',
    'back-return-left-fixed-door-fixed': 'right',
    'fixed-door-fixed-return-right-back': 'right',
    // Quadrant
    'quadrant-return-left-door': 'right',
    'quadrant-door-return-right': 'right',
  });

  // Track clamp mode (channel or clamps)
  const [useClampsMode, setUseClampsMode] = useState<boolean>(false);

  // Define configurations by category
  const inlineConfigurations = [
    {
      baseType: 'fixed-panel',
      label: 'Fixed Panel',
      hasVariants: false
    },
    {
      baseType: 'single',
      label: 'Single Door',
      hasVariants: true
    },
    {
      baseType: 'panel-and-door',
      label: 'Fixed + Door',
      hasVariants: true
    },
    {
      baseType: 'door-and-panel',
      label: 'Door + Fixed',
      hasVariants: true
    },
    {
      baseType: 'center-door',
      label: 'Center Door',
      hasVariants: true
    },
  ];

  const squareConfigurations = [
    {
      baseType: 'l-left',
      label: 'Return Left + Door',
      hasVariants: true
    },
    {
      baseType: 'l-right',
      label: 'Door + Return Right',
      hasVariants: true
    },
    {
      baseType: 'fixed-door-return-left',
      label: 'Return Left + Fixed + Door',
      hasVariants: true
    },
    {
      baseType: 'door-fixed-return-right',
      label: 'Door + Fixed + Return Right',
      hasVariants: true
    },
    {
      baseType: 'return-door-fixed-left',
      label: 'Return Left + Door + Fixed',
      hasVariants: true
    },
    {
      baseType: 'return-door-fixed-right',
      label: 'Fixed + Door + Return Right',
      hasVariants: true
    },
    {
      baseType: 'return-left-fixed-door-fixed',
      label: 'Return Left + Fixed + Door + Fixed',
      hasVariants: true
    },
    {
      baseType: 'fixed-door-return-right',
      label: 'Fixed + Door + Fixed + Return Right',
      hasVariants: true
    },
    {
      baseType: 'dual-return',
      label: 'Return Left + Door + Return Right',
      hasVariants: true
    },
    {
      baseType: 'return-left-fixed-door-fixed-return-right',
      label: 'Return Left + Fixed + Door + Fixed + Return Right',
      hasVariants: true
    },
    {
      baseType: 'return-left-fixed-door-return-right',
      label: 'Return Left + Fixed + Door + Return Right',
      hasVariants: true
    },
    {
      baseType: 'return-left-door-fixed-return-right',
      label: 'Return Left + Door + Fixed + Return Right',
      hasVariants: true
    },
    {
      baseType: 'back-return-left-door',
      label: 'Back + Return Left + Door',
      hasVariants: true
    },
    {
      baseType: 'door-return-right-back',
      label: 'Door + Return Right + Back',
      hasVariants: true
    },
    {
      baseType: 'back-return-left-fixed-door',
      label: 'Back + Return Left + Fixed + Door',
      hasVariants: true
    },
    {
      baseType: 'door-fixed-return-right-back',
      label: 'Door + Fixed + Return Right + Back',
      hasVariants: true
    },
    {
      baseType: 'back-return-left-door-fixed',
      label: 'Back + Return Left + Door + Fixed',
      hasVariants: true
    },
    {
      baseType: 'fixed-door-return-right-back',
      label: 'Fixed + Door + Return Right + Back',
      hasVariants: true
    },
    {
      baseType: 'back-return-left-fixed-door-fixed',
      label: 'Back + Return Left + Fixed + Door + Fixed',
      hasVariants: true
    },
    {
      baseType: 'fixed-door-fixed-return-right-back',
      label: 'Fixed + Door + Fixed + Return Right + Back',
      hasVariants: true
    },
  ];

  const quadrantConfigurations = [
    {
      baseType: 'quadrant-return-left-door',
      label: 'Return Left + Door',
      hasVariants: true
    },
    {
      baseType: 'quadrant-door-return-right',
      label: 'Door + Return Right',
      hasVariants: true
    },
  ];

  const handleVariantChange = (baseType: string, variant: DoorVariant) => {
    setDoorVariants(prev => ({
      ...prev,
      [baseType]: variant
    }));
  };

  const renderVariantSelector = (baseType: string) => {
    const currentVariant = doorVariants[baseType] || 'right';

    return (
      <div className="flex gap-1 justify-center">
        <button
          onClick={() => handleVariantChange(baseType, 'left')}
          className={`px-3 py-1 text-xs rounded transition-colors ${currentVariant === 'left'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Left
        </button>
        <button
          onClick={() => handleVariantChange(baseType, 'right')}
          className={`px-3 py-1 text-xs rounded transition-colors ${currentVariant === 'right'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Right
        </button>
        <button
          onClick={() => handleVariantChange(baseType, 'double')}
          className={`px-3 py-1 text-xs rounded transition-colors ${currentVariant === 'double'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Double
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="mb-2">Shower Panel Configurations</h1>
          <p className="text-gray-600">SVG-based templates with reusable components</p>

          {/* Channel/Clamps Toggle */}
          <div className="mt-6 flex gap-2 justify-center items-center">
            <span className="text-sm text-gray-600 mr-2">Fixed Panel Mounting:</span>
            <button
              onClick={() => setUseClampsMode(false)}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${!useClampsMode
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Channel
            </button>
            <button
              onClick={() => setUseClampsMode(true)}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${useClampsMode
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Clamps
            </button>
          </div>
        </div>

        {/* Inline Configurations */}
        <div className="mb-12">
          <h2 className="mb-6 text-gray-800">Inline Configurations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {inlineConfigurations.map((config) => (
              <div
                key={`inline-${config.baseType}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-center text-gray-700 mb-2">{config.label}</h3>
                  {config.hasVariants && renderVariantSelector(config.baseType)}
                </div>
                <div className="p-6 flex items-center justify-center bg-white">
                  <ShowerConfiguration
                    category="inline"
                    baseType={config.baseType}
                    doorVariant={config.hasVariants ? doorVariants[config.baseType] : undefined}
                    mountingType={useClampsMode ? 'clamps' : 'channel'}
                    width={280}
                    height={360}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Square Configurations */}
        <div className="mb-12">
          <h2 className="mb-6 text-gray-800">Square Configurations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {squareConfigurations.map((config) => (
              <div
                key={`square-${config.baseType}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-center text-gray-700 mb-2">{config.label}</h3>
                  {config.hasVariants && renderVariantSelector(config.baseType)}
                </div>
                <div className="p-6 flex items-center justify-center bg-white">
                  {config.baseType === 'square-v1-beta' ? (
                    <Square1Configurator onBackToCategory={() => { }} />
                  ) : (
                    <ShowerConfiguration
                      category="square"
                      baseType={config.baseType}
                      doorVariant={config.hasVariants ? doorVariants[config.baseType] : undefined}
                      mountingType={useClampsMode ? 'clamps' : 'channel'}
                      width={280}
                      height={360}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrant Configurations - Placeholder */}
        <div className="mb-12">
          <h2 className="mb-6 text-gray-800">Quadrant Configurations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quadrantConfigurations.map((config) => (
              <div
                key={`quadrant-${config.baseType}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-center text-gray-700 mb-2">{config.label}</h3>
                  {config.hasVariants && renderVariantSelector(config.baseType)}
                </div>
                <div className="p-6 flex items-center justify-center bg-white">
                  <ShowerConfiguration
                    category="quadrant"
                    baseType={config.baseType}
                    doorVariant={config.hasVariants ? doorVariants[config.baseType] : undefined}
                    mountingType={useClampsMode ? 'clamps' : 'channel'}
                    width={280}
                    height={360}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="mb-4">Component Details</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <h3 className="mb-2 text-gray-900">Available Components:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li><code className="bg-gray-100 px-2 py-0.5 rounded">PanelFixed</code> - Fixed glass panel</li>
                <li><code className="bg-gray-100 px-2 py-0.5 rounded">PanelDoor</code> - Movable door panel</li>
                <li><code className="bg-gray-100 px-2 py-0.5 rounded">Hinge</code> - Square hinges (wall or glass-to-glass)</li>
                <li><code className="bg-gray-100 px-2 py-0.5 rounded">Handle</code> - Door handle (inset 12px)</li>
                <li><code className="bg-gray-100 px-2 py-0.5 rounded">Channel</code> - 2px inline channels</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-gray-900">Categories:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Inline</strong> - Single wall installations with various door configurations</li>
                <li><strong>Square</strong> - Corner and L-shaped enclosures (coming soon)</li>
                <li><strong>Quadrant</strong> - Neo-angle and curved designs (coming soon)</li>
              </ul>
              <h3 className="mt-4 mb-2 text-gray-900">Door Variants:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>Left - Door opens from left side</li>
                <li>Right - Door opens from right side</li>
                <li>Double - Two doors that open outward</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

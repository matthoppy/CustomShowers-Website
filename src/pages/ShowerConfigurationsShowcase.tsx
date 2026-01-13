import { ShowerConfiguration } from '@/components/designer/ShowerConfiguration';

export default function ShowerConfigurationsShowcase() {
  const configurations = [
    { type: 'single-door' as const, label: 'Single Door' },
    { type: 'double-door' as const, label: 'Door with Sidelight' },
    { type: 'left-panel' as const, label: 'Door with Short Sidelight' },
    { type: 'right-panel' as const, label: 'Fixed Panel Notch' },
    { type: 'three-panel' as const, label: 'Three Panel' },
    { type: 'corner-left' as const, label: 'Centre Door Short Sidelights' },
    { type: 'corner-right' as const, label: 'Centre Door Notched Sidelights' },
    { type: '90-return' as const, label: '90° Return with Sidelight' },
    { type: '90-return-left' as const, label: '90° Return Left' },
    { type: '90-return-right' as const, label: '90° Return Right' },
    { type: 'angled-ceiling' as const, label: 'Angled Ceiling' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Shower Panel Configurations</h1>
          <p className="text-gray-600 text-lg">SVG-based templates with reusable components</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {configurations.map((config) => (
            <div
              key={config.type}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-center text-gray-700 font-semibold">{config.label}</h3>
              </div>
              <div className="p-6 flex items-center justify-center bg-white">
                <ShowerConfiguration type={config.type} width={280} height={360} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Component Details</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <h3 className="mb-2 text-gray-900 font-semibold">Available Components:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li><code className="bg-gray-100 px-2 py-0.5 rounded">PanelFixed</code> - Fixed glass panel with 3D depth</li>
                <li><code className="bg-gray-100 px-2 py-0.5 rounded">PanelDoor</code> - Movable door panel</li>
                <li><code className="bg-gray-100 px-2 py-0.5 rounded">Hinge</code> - Door hinge hardware</li>
                <li><code className="bg-gray-100 px-2 py-0.5 rounded">Handle</code> - Door handle</li>
                <li><code className="bg-gray-100 px-2 py-0.5 rounded">Channel</code> - Top/bottom channels</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-gray-900 font-semibold">Features:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>Isometric 3D perspective using SVG paths and rects</li>
                <li>Reusable components with customizable props</li>
                <li>Multiple orientation options (front, left, right)</li>
                <li>Glass panel styling with depth effects</li>
                <li>Hardware details (hinges, handles, channels)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

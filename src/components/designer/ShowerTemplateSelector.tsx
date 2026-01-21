/**
 * Shower Template Selector Component
 * Displays all available shower configurations for selection
 */

import { ShowerConfiguration, type ShowerTemplateType } from './ShowerConfiguration';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface ShowerTemplateSelectorProps {
  onSelect: (type: ShowerTemplateType) => void;
  selectedType?: ShowerTemplateType;
}

const templateNames: Record<ShowerTemplateType, string> = {
  'single-door': 'Single Door',
  'double-door': 'Door with Sidelight',
  'left-panel': 'Door with Short Sidelight',
  'right-panel': 'Fixed Panel Notch',
  'three-panel': 'Three Panel',
  'corner-left': 'Centre Door Short Sidelights',
  'corner-right': 'Centre Door Notched Sidelights',
  '90-return': '90° Return with Sidelight',
  '90-return-left': '90° Return Left',
  '90-return-right': '90° Return Right',
  'angled-ceiling': 'Angled Ceiling',
};

export default function ShowerTemplateSelector({
  onSelect,
  selectedType,
}: ShowerTemplateSelectorProps) {
  const templates: ShowerTemplateType[] = [
    'single-door',
    'double-door',
    'left-panel',
    'right-panel',
    'three-panel',
    'corner-left',
    'corner-right',
    '90-return',
    '90-return-left',
    '90-return-right',
    'angled-ceiling',
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {templates.map((type) => {
        const isSelected = selectedType === type;
        return (
          <Card
            key={type}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              isSelected ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelect(type)}
          >
            <CardContent className="p-4">
              <div className="aspect-square mb-3 bg-slate-50 rounded flex items-center justify-center">
                <ShowerConfiguration type={type} width={200} height={200} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{templateNames[type]}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

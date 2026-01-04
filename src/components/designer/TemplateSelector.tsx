/**
 * Template Selector Component
 * Grid of shower templates for customer selection
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { SHOWER_TEMPLATES, type ShowerTemplate } from '@/lib/templates';
import ShowerPreview3D from './ShowerPreview3D';
import type { ConfigurationType } from '@/types';

interface TemplateSelectorProps {
  onSelect: (template: ShowerTemplate) => void;
  selectedTemplateId?: string;
  filterCategory?: ConfigurationType;
}

export default function TemplateSelector({
  onSelect,
  selectedTemplateId,
  filterCategory,
}: TemplateSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filter templates by category if specified
  const templates = filterCategory
    ? SHOWER_TEMPLATES.filter((t) => t.category === filterCategory)
    : SHOWER_TEMPLATES;

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<ConfigurationType, ShowerTemplate[]>);

  const categoryNames: Record<ConfigurationType, string> = {
    inline: 'Inline Showers',
    corner: 'Corner Showers',
    wetroom: 'Wetroom / Walk-In',
    'walk-in': 'Walk-In with Door',
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-xl font-bold text-foreground uppercase">
            {categoryNames[category as ConfigurationType]}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoryTemplates.map((template) => {
              const isSelected = selectedTemplateId === template.id;
              const isHovered = hoveredId === template.id;

              return (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-primary shadow-lg'
                      : 'hover:shadow-md hover:border-primary/50'
                  }`}
                  onMouseEnter={() => setHoveredId(template.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelect(template)}
                >
                  <CardContent className="p-4">
                    {/* 3D Preview */}
                    <div className="relative mb-3">
                      <ShowerPreview3D
                        template={template}
                        glassType="clear"
                        hardwareFinish="chrome"
                        showHardware={true}
                        width={300}
                        height={250}
                      />

                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Template info */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground">
                        {template.name}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Select button */}
                      {(isHovered || isSelected) && (
                        <Button
                          className="w-full mt-2"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                        >
                          {isSelected ? 'Selected' : 'Select Design'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

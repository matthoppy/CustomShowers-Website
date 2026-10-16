/**
 * Photo marking — tap to mark corners and enter a known measurement.
 */

import { useRef, useState, useEffect } from 'react';
import { Undo, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Point {
  x: number;
  y: number;
}

interface PhotoMarkingProps {
  photoDataUrl: string;
  onComplete: (corners: Point[], knownWidthMm: number) => void;
  onBack: () => void;
}

export function PhotoMarking({ photoDataUrl, onComplete, onBack }: PhotoMarkingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [corners, setCorners] = useState<Point[]>([]);
  const [knownWidthMm, setKnownWidthMm] = useState('');
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgDimensions({ width: img.width, height: img.height });
      updateCanvas();
    };
    img.src = photoDataUrl;
  }, [photoDataUrl]);

  useEffect(() => {
    updateCanvas();
  }, [corners, imgDimensions, displayDimensions]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && imgDimensions.width > 0) {
        const containerWidth = containerRef.current.clientWidth;
        const aspectRatio = imgDimensions.height / imgDimensions.width;
        const displayWidth = Math.min(containerWidth, imgDimensions.width);
        const displayHeight = displayWidth * aspectRatio;
        setDisplayDimensions({ width: displayWidth, height: displayHeight });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imgDimensions]);

  const updateCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || displayDimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = displayDimensions.width;
    canvas.height = displayDimensions.height;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, displayDimensions.width, displayDimensions.height);

      if (corners.length > 0) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#2563eb';

        corners.forEach((corner, i) => {
          const x = corner.x * displayDimensions.width;
          const y = corner.y * displayDimensions.height;

          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${i + 1}`, x, y);

          ctx.fillStyle = '#2563eb';
        });

        if (corners.length > 1) {
          ctx.strokeStyle = '#2563eb';
          ctx.setLineDash([8, 4]);
          ctx.beginPath();
          corners.forEach((corner, i) => {
            const x = corner.x * displayDimensions.width;
            const y = corner.y * displayDimensions.height;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          if (corners.length === 4) {
            ctx.closePath();
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    };
    img.src = photoDataUrl;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (corners.length >= 4) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    setCorners([...corners, { x, y }]);
  };

  const handleUndo = () => {
    setCorners(corners.slice(0, -1));
  };

  const handleReset = () => {
    setCorners([]);
  };

  const canProceed = corners.length === 4 && knownWidthMm.trim() !== '' && parseInt(knownWidthMm, 10) > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Back
        </Button>
        <h2 className="text-2xl font-bold">Mark the opening corners</h2>
        <p className="mt-2 text-muted-foreground">
          Tap the four corners of your shower opening in order (top-left, top-right, bottom-right,
          bottom-left).
        </p>
      </div>

      <div ref={containerRef} className="space-y-4">
        <div className="overflow-hidden rounded-lg border bg-muted">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onTouchStart={handleCanvasClick}
            className="w-full cursor-crosshair touch-none"
            style={{ display: 'block', maxWidth: '100%' }}
            aria-label="Photo canvas for marking corners"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">
            {corners.length === 0 && 'Tap the top-left corner'}
            {corners.length === 1 && 'Now the top-right corner'}
            {corners.length === 2 && 'Now the bottom-right corner'}
            {corners.length === 3 && 'Finally, the bottom-left corner'}
            {corners.length === 4 && '✓ All corners marked'}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndo}
              disabled={corners.length === 0}
            >
              <Undo className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Undo</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              disabled={corners.length === 0}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Reset</span>
            </Button>
          </div>
        </div>
      </div>

      {corners.length === 4 && (
        <div className="space-y-4 rounded-lg border bg-card p-4 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="known-width">
              Enter one known measurement to scale the photo (mm)
            </Label>
            <Input
              id="known-width"
              type="number"
              placeholder="e.g. 900"
              value={knownWidthMm}
              onChange={(e) => setKnownWidthMm(e.target.value)}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Typically the opening width across the top or bottom. We'll use this to suggest
              configurations that fit your space.
            </p>
          </div>

          <Button
            onClick={() => onComplete(corners, parseInt(knownWidthMm, 10))}
            disabled={!canProceed}
            className="w-full"
          >
            Continue to suggestions
          </Button>
        </div>
      )}
    </div>
  );
}

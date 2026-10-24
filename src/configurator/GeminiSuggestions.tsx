/**
 * Optional AI photo analysis suggestions.
 *
 * Shows readings extracted from measurement photos with confidence scores.
 * User can click to apply a suggested value, but nothing is auto-filled.
 */

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Loader2, Sparkles } from 'lucide-react';
import { analysePhotos, formatReading, type GeminiAnalyseResponse, type GeminiReading } from './gemini';
import type { Photo } from './photos';
import { GeminiTurnstile } from './GeminiTurnstile';

export function GeminiSuggestions({
  photos,
  onApplyReading,
}: {
  photos: Photo[];
  onApplyReading?: (reading: GeminiReading) => void;
}) {
  const [analysis, setAnalysis] = useState<GeminiAnalyseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);

  const handleAnalyse = async () => {
    if (photos.length === 0 || !turnstileToken) return;

    setLoading(true);
    setAnalysis(null);

    try {
      // Convert Photo objects to File/Blob for analysis
      const files = await Promise.all(
        photos.slice(0, 4).map(async (photo) => {
          const response = await fetch(photo.previewUrl);
          const blob = await response.blob();
          return blob;
        })
      );

      const result = await analysePhotos(files, turnstileToken);
      setAnalysis(result);

      // Reset Turnstile widget for next use (tokens are single-use)
      const resetWidget = (turnstileRef.current as HTMLDivElement & { resetWidget?: () => void })?.resetWidget;
      if (resetWidget) {
        resetWidget();
      }
      setHasToken(false);
    } catch (err) {
      setAnalysis({
        available: false,
        reason: 'Failed to analyse photos',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTurnstileToken = (token: string | null) => {
    setTurnstileToken(token);
    setHasToken(!!token);
  };

  // Hide panel gracefully if unavailable
  if (photos.length === 0 || (analysis && !analysis.available)) {
    return null;
  }

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900 dark:bg-purple-950/20">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
          AI Photo Analysis
        </h4>
      </div>

      {!analysis && !loading && (
        <div className="space-y-3">
          <p className="text-xs text-purple-700 dark:text-purple-300">
            Have AI check your measurement photos for visible readings. Suggestions are advisory only
            — you can accept or ignore them.
          </p>

          <div ref={turnstileRef}>
            <GeminiTurnstile onToken={handleTurnstileToken} />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAnalyse}
            disabled={!hasToken}
            className="border-purple-300 bg-white hover:bg-purple-50 dark:border-purple-700 dark:bg-purple-950"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Analyse {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analysing photos...
        </div>
      )}

      {analysis && analysis.available && (
        <div className="space-y-3">
          {analysis.readings && analysis.readings.length > 0 ? (
            <>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                Found {analysis.readings.length} measurement{analysis.readings.length !== 1 ? 's' : ''}. Confidence shown for each.
              </p>
              <div className="space-y-2">
                {analysis.readings.map((reading, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded border border-purple-200 bg-white p-2 dark:border-purple-800 dark:bg-purple-950/50"
                  >
                    <div className="flex-1 text-xs">
                      <p className="font-medium text-purple-900 dark:text-purple-100">
                        {formatReading(reading)}
                      </p>
                      <p className="text-purple-600 dark:text-purple-400">{reading.source}</p>
                    </div>
                    {onApplyReading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onApplyReading(reading)}
                        className="h-auto px-2 py-1 text-xs"
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Accept
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-purple-600 dark:text-purple-400">
              No measurements detected in the photos.
            </p>
          )}
          {analysis.notes && (
            <p className="text-xs italic text-purple-600 dark:text-purple-400">{analysis.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

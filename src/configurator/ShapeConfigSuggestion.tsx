/**
 * Optional AI room photo configuration suggestion for the Shape step.
 *
 * Shows suggested template based on room photo analysis with confidence score.
 * User must explicitly click Accept to apply the suggestion.
 * Advisory only: never auto-changes the selected configuration.
 */

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Sparkles, Upload } from 'lucide-react';
import { suggestConfiguration, type GeminiSuggestResponse } from './gemini';
import { mapGeminiToTemplate, getTemplateById, type TemplateSuggestion } from './mapGeminiToTemplate';
import { GeminiTurnstile } from './GeminiTurnstile';
import type { ShowerTemplate } from './templates';

interface ShapeConfigSuggestionProps {
  onAcceptTemplate: (template: ShowerTemplate) => void;
}

export function ShapeConfigSuggestion({ onAcceptTemplate }: ShapeConfigSuggestionProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<TemplateSuggestion | null>(null);
  const [geminiNotes, setGeminiNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (file: File | undefined) => {
    if (!file) return;

    // Clear previous suggestion when new photo selected
    setSuggestion(null);
    setGeminiNotes(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setPhoto(file);
  };

  const handleAnalyse = async () => {
    if (!photo || !turnstileToken) return;

    setLoading(true);
    setSuggestion(null);
    setGeminiNotes(null);

    try {
      const result: GeminiSuggestResponse = await suggestConfiguration([photo], turnstileToken);

      // Reset Turnstile widget for next use (tokens are single-use)
      const resetWidget = (turnstileRef.current as HTMLDivElement & { resetWidget?: () => void })
        ?.resetWidget;
      if (resetWidget) {
        resetWidget();
      }
      setHasToken(false);

      if (result.available && result.config) {
        const mapped = mapGeminiToTemplate(result.config);
        setSuggestion(mapped);
        setGeminiNotes(result.notes || null);
      } else {
        // Hide panel when response is unavailable or errors
        setSuggestion(null);
        setGeminiNotes(null);
      }
    } catch (err) {
      // Hide panel on error
      setSuggestion(null);
      setGeminiNotes(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!suggestion?.templateId) return;

    const template = getTemplateById(suggestion.templateId);
    if (template) {
      onAcceptTemplate(template);
    }
  };

  const handleTurnstileToken = (token: string | null) => {
    setTurnstileToken(token);
    setHasToken(!!token);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setSuggestion(null);
    setGeminiNotes(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900 dark:bg-purple-950/20">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
          AI Room Photo Suggestion
        </h4>
      </div>

      <p className="mb-3 text-xs text-purple-700 dark:text-purple-300">
        Upload a photo of your bathroom and get a suggested configuration. This is advisory only —
        you can accept or ignore the suggestion.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
      />

      {!photo && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="border-purple-300 bg-white hover:bg-purple-50 dark:border-purple-700 dark:bg-purple-950"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload room photo
        </Button>
      )}

      {photo && photoPreview && !suggestion && !loading && (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <img
              src={photoPreview}
              alt="Room photo"
              className="h-20 w-20 shrink-0 rounded object-cover"
            />
            <div className="flex-1 space-y-2">
              <p className="text-xs text-purple-700 dark:text-purple-300">
                Photo ready. Analyse to get a configuration suggestion.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemovePhoto}
                className="h-auto px-2 py-1 text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400"
              >
                Remove photo
              </Button>
            </div>
          </div>

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
            Analyse photo
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analysing photo...
        </div>
      )}

      {suggestion && suggestion.templateId && (
        <div className="space-y-3">
          <div className="rounded border border-purple-200 bg-white p-3 dark:border-purple-800 dark:bg-purple-950/50">
            <div className="mb-2">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                {getTemplateById(suggestion.templateId)?.name}
              </p>
              <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                {getTemplateById(suggestion.templateId)?.description}
              </p>
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              <p>Confidence: {Math.round(suggestion.confidence * 100)}%</p>
              <p className="mt-1">{suggestion.notes}</p>
              {geminiNotes && <p className="mt-1 italic">{geminiNotes}</p>}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAccept}
            className="border-purple-300 bg-white hover:bg-purple-50 dark:border-purple-700 dark:bg-purple-950"
          >
            <Check className="mr-2 h-4 w-4" />
            Accept suggestion
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemovePhoto}
            className="ml-2 h-auto px-2 py-1 text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400"
          >
            Try another photo
          </Button>
        </div>
      )}
    </div>
  );
}

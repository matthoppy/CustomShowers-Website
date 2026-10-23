/**
 * Start from a photo.
 *
 * Most people do not know what their shower is called, but they can take a
 * picture of it. This sends the picture to the layout worker, shows two or
 * three layouts that would suit the space with one recommended, and lets the
 * customer correct the one they pick in plain words — "it needs a door on the
 * right". The photo and anything they asked for go to the workshop with the
 * enquiry.
 *
 * Nothing here is final: it only sets the shape. Sizes come from measuring,
 * and the price is set by hand.
 */

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Check, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { createPhoto, releasePhoto, type Photo } from './photos';
import {
  layoutToTemplate,
  refineLayout,
  suggestFromPhoto,
  templateToLayout,
  type LayoutSuggestion,
  type PhotoLayoutRecord,
} from './photoLayout';
import type { ShowerTemplate } from './templates';
import { TemplateThumbnail } from './views/TemplateThumbnail';
import type { ConfiguratorState } from './types';

type Phase = 'idle' | 'reading' | 'choosing' | 'refining';

interface PhotoStartProps {
  endpoint: string;
  accent: string;
  state: ConfiguratorState;
  photo: Photo | undefined;
  record: PhotoLayoutRecord | null;
  onPhoto: (photo: Photo | null) => void;
  /** Apply a shape and remember what it was based on. */
  onApply: (template: ShowerTemplate, record: PhotoLayoutRecord) => void;
}

export function PhotoStart({ endpoint, accent, state, photo, record, onPhoto, onApply }: PhotoStartProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>(record ? 'refining' : 'idle');
  const [suggestions, setSuggestions] = useState<LayoutSuggestion[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [instruction, setInstruction] = useState('');
  const [updates, setUpdates] = useState<{ asked: string; answer: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const read = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPhase('reading');
    const next = await createPhoto(file, 'space');
    if (!next) {
      setError('We could not open that photo. Try another one.');
      setPhase('idle');
      return;
    }
    releasePhoto(photo);
    onPhoto(next);

    const res = await suggestFromPhoto(endpoint, next.content);
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Something went wrong. Try again.');
      setPhase('idle');
      return;
    }
    if (res.data.suggestions.length === 0) {
      setError(res.data.message ?? 'We could not see a shower space in that photo.');
      setPhase('idle');
      return;
    }
    setSuggestions(res.data.suggestions);
    setChosen(null);
    setUpdates([]);
    setPhase('choosing');
  };

  const choose = (i: number) => {
    const s = suggestions[i];
    setChosen(i);
    onApply(layoutToTemplate(s.layout, s.title), { title: s.title, notes: s.notes, requests: [] });
    setPhase('refining');
  };

  const refine = async () => {
    const asked = instruction.trim();
    if (!asked || !record) return;
    setBusy(true);
    setError(null);
    const res = await refineLayout(endpoint, templateToLayout(state), asked, photo?.content ?? null);
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Something went wrong. Try again.');
      return;
    }
    onApply(layoutToTemplate(res.data.layout, record.title), {
      title: record.title,
      // The latest read of the job replaces the old one, but anything the
      // customer asked for is kept, in order.
      notes: res.data.notes.length ? res.data.notes : record.notes,
      requests: [...record.requests, asked],
    });
    setUpdates((u) => [...u, { asked, answer: res.data.summary }]);
    setInstruction('');
  };

  const reset = () => {
    releasePhoto(photo);
    onPhoto(null);
    setSuggestions([]);
    setChosen(null);
    setUpdates([]);
    setError(null);
    setPhase('idle');
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="sr-only"
      onChange={(e) => {
        void read(e.target.files?.[0]);
        e.target.value = '';
      }}
    />
  );

  if (phase === 'idle') {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        {fileInput}
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Camera className="h-5 w-5" />
          </span>
          <div className="min-w-0 space-y-2">
            <p className="font-semibold">Not sure which one? Start with a photo</p>
            <p className="text-sm text-muted-foreground">
              Stand in the bathroom doorway and take one picture showing the floor, both walls and
              where the shower head is. We will suggest the layouts that suit it.
            </p>
            {error && <p className="text-sm text-red-700 dark:text-red-300">{error}</p>}
            <Button type="button" onClick={() => inputRef.current?.click()}>
              <Camera className="mr-2 h-4 w-4" />
              Add a photo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      {fileInput}
      <div className="flex items-center gap-3">
        {photo && (
          <img
            src={photo.previewUrl}
            alt="Your shower space"
            className="h-16 w-16 shrink-0 rounded object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Your photo</p>
          <p className="text-xs text-muted-foreground">
            It goes to us with your design, so we can check the layout before we price it.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={reset} aria-label="Use a different photo">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {phase === 'reading' && (
        <div className="flex items-center gap-3 rounded bg-muted/60 px-3 py-4 text-sm" role="status">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Looking at your shower space…
        </div>
      )}

      {phase === 'choosing' && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Layouts that would suit it</p>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              aria-pressed={chosen === i}
              className={`flex w-full gap-3 rounded-lg border p-3 text-left transition-colors ${
                chosen === i ? 'border-foreground bg-muted' : 'hover:bg-muted/50'
              }`}
            >
              <span className="shrink-0">
                <TemplateThumbnail
                  {...(() => {
                    const t = layoutToTemplate(s.layout, s.title);
                    return { panels: t.panels, junctions: t.junctions };
                  })()}
                  width={96}
                  height={72}
                  accent={accent}
                />
              </span>
              <span className="min-w-0 space-y-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{s.title}</span>
                  {i === 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                      Recommended
                    </span>
                  )}
                </span>
                <span className="block text-sm text-muted-foreground">{s.why}</span>
              </span>
            </button>
          ))}
          <p className="text-xs text-muted-foreground">
            None of these right? Pick the closest — you can tell us what to change next.
          </p>
        </div>
      )}

      {phase === 'refining' && record && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded bg-muted/60 px-3 py-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              Using <strong>{record.title}</strong>. The drawing shows it — check it matches your
              bathroom.
            </span>
          </div>

          {updates.length > 0 && (
            <ul className="space-y-2 text-sm">
              {updates.map((u, i) => (
                <li key={i} className="space-y-1 rounded border px-3 py-2">
                  <p className="text-muted-foreground">You asked: “{u.asked}”</p>
                  <p>{u.answer}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="photo-change">Anything to change?</Label>
            <Textarea
              id="photo-change"
              rows={2}
              maxLength={500}
              placeholder="e.g. It needs a door on the right — that's where the shower head is"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-700 dark:text-red-300">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={refine} disabled={busy || !instruction.trim()}>
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {busy ? 'Updating…' : 'Update the layout'}
            </Button>
            {suggestions.length > 1 && (
              <Button type="button" variant="outline" onClick={() => setPhase('choosing')}>
                See the other layouts
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Happy with it? Tap Next to measure. Anything you write here comes to us too.
          </p>
        </div>
      )}
    </div>
  );
}

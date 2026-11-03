/**
 * The site's pictures.
 *
 * Every picture on the home page has a slot: the hero, the two beside the
 * About text, and the gallery strip in order. Replace one, change its
 * description, reorder the gallery, then Publish: the dashboard commits the
 * files and the manifest to the repository as you, and the site redeploys in
 * about a minute. Nothing changes on the live site until you publish.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Check, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { imageUrl, type SiteImage, type SiteImages } from '@/content/siteImages';
import { useAdmin } from '../auth';
import type { PublishResult, SiteImagesState } from '../api/types';
import { ErrorNote, Loading, PageHeader, formatBytes } from '../ui';

/** Big enough for a full-width hero on a retina screen, small enough to keep the repo sane. */
const MAX_EDGE_PX = 2000;
const JPEG_QUALITY = 0.84;

interface Staged {
  path: string;
  contentBase64: string;
  previewUrl: string;
  bytes: number;
}

async function toJpeg(file: File): Promise<{ base64: string; previewUrl: string; bytes: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not read that image.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const base64 = dataUrl.split(',')[1] || '';
  return { base64, previewUrl: dataUrl, bytes: Math.ceil((base64.length * 3) / 4) };
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'picture';
}

export function Pictures() {
  const { api, user } = useAdmin();
  const [state, setState] = useState<SiteImagesState | null>(null);
  const [manifest, setManifest] = useState<SiteImages | null>(null);
  const [staged, setStaged] = useState<Record<string, Staged>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<PublishResult | null>(null);

  const load = () => {
    setError(null);
    api
      .siteImages()
      .then((s) => {
        setState(s);
        setManifest(structuredClone(s.manifest));
        setStaged({});
      })
      .catch((e: Error) => setError(e.message));
  };
  useEffect(load, [api]);

  const dirty = useMemo(() => !!state && !!manifest && (Object.keys(staged).length > 0 || JSON.stringify(manifest) !== JSON.stringify(state.manifest)), [state, manifest, staged]);

  /** Files that were in a slot before and are not in any slot now, under the managed folder. */
  const removals = useMemo(() => {
    if (!state || !manifest) return [];
    const now = new Set([manifest.hero, ...manifest.about, ...manifest.gallery].map((i) => i.src));
    const before = [state.manifest.hero, ...state.manifest.about, ...state.manifest.gallery].map((i) => i.src);
    return before.filter((src) => !now.has(src) && src.startsWith('/images/site/')).map((src) => `public${src}`);
  }, [state, manifest]);

  const previewOf = (img: SiteImage) => staged[`public${img.src}`]?.previewUrl || `${state?.siteOrigin || ''}${imageUrl(img)}`;

  const replace = async (slotName: string, current: SiteImage, file: File): Promise<SiteImage> => {
    const { base64, previewUrl, bytes } = await toJpeg(file);
    const name = `${slug(slotName)}-${Date.now().toString(36)}.jpg`;
    const src = `/images/site/${name}`;
    setStaged((s) => ({ ...s, [`public${src}`]: { path: `public${src}`, contentBase64: base64, previewUrl, bytes } }));
    return { src, alt: current.alt, v: (current.v || 1) + 1 };
  };

  const update = (fn: (m: SiteImages) => SiteImages) => setManifest((m) => (m ? fn(structuredClone(m)) : m));

  const publish = async () => {
    if (!manifest) return;
    setPublishing(true);
    setError(null);
    try {
      const used = new Set([manifest.hero, ...manifest.about, ...manifest.gallery].map((i) => `public${i.src}`));
      const files = Object.values(staged)
        .filter((s) => used.has(s.path))
        .map((s) => ({ path: s.path, contentBase64: s.contentBase64 }));
      const result = await api.publishImages({ manifest, files, removals, message: message || undefined });
      setPublished(result);
      setMessage('');
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  if (error && !state) return <ErrorNote message={error} retry={load} />;
  if (!state || !manifest) return <Loading what="Reading the site's pictures" />;

  const changes = Object.keys(staged).length + removals.length + (JSON.stringify(manifest) !== JSON.stringify(state.manifest) ? 1 : 0);

  return (
    <div className="pb-24">
      <PageHeader
        title="Pictures"
        blurb={
          <>
            The pictures on the home page. Replace one, fix its description, reorder the gallery, then publish. Publishing commits to{' '}
            <span className="font-medium text-foreground">{state.repo}</span> as @{user?.login} and the site redeploys in about a minute.
          </>
        }
      />

      {published && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-800 dark:bg-emerald-950/40">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
          <div>
            <div className="font-medium">Published.</div>
            <div className="text-muted-foreground">
              Commit{' '}
              <a href={published.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                {published.sha.slice(0, 7)}
              </a>
              . Cloudflare Pages is building it now; the new pictures are live when the deployment on the{' '}
              <Link to="/admin/site" className="underline underline-offset-2">
                Site page
              </Link>{' '}
              shows success.
            </div>
          </div>
        </div>
      )}
      {error && <div className="mb-6"><ErrorNote message={error} /></div>}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Hero</h2>
        <p className="text-xs text-muted-foreground">The full-width picture behind the headline. Landscape, at least 2000px wide.</p>
        <SlotCard image={manifest.hero} preview={previewOf(manifest.hero)} staged={!!staged[`public${manifest.hero.src}`]} onAlt={(alt) => update((m) => ({ ...m, hero: { ...m.hero, alt } }))} onReplace={async (f) => { const next = await replace('hero', manifest.hero, f); update((m) => ({ ...m, hero: next })); }} wide />
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold">About</h2>
        <p className="text-xs text-muted-foreground">The two pictures beside the About text. Portrait or square crops work best.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {manifest.about.map((img, i) => (
            <SlotCard key={`${img.src}-${i}`} image={img} preview={previewOf(img)} staged={!!staged[`public${img.src}`]} onAlt={(alt) => update((m) => { m.about[i] = { ...m.about[i], alt }; return m; })} onReplace={async (f) => { const next = await replace(`about-${i + 1}`, img, f); update((m) => { m.about[i] = next; return m; }); }} />
          ))}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Gallery</h2>
            <p className="text-xs text-muted-foreground">The scrolling strip of projects, in this order.</p>
          </div>
          <AddButton onAdd={async (f) => { const next = await replace('gallery', { src: '', alt: '', v: 0 }, f); update((m) => ({ ...m, gallery: [...m.gallery, { ...next, alt: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') }] })); }} />
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {manifest.gallery.map((img, i) => (
            <li key={`${img.src}-${i}`}>
              <SlotCard
                image={img}
                preview={previewOf(img)}
                staged={!!staged[`public${img.src}`]}
                onAlt={(alt) => update((m) => { m.gallery[i] = { ...m.gallery[i], alt }; return m; })}
                onReplace={async (f) => { const next = await replace(`gallery-${i + 1}`, img, f); update((m) => { m.gallery[i] = next; return m; }); }}
                extra={
                  <div className="flex items-center gap-1">
                    <IconButton label="Move earlier" disabled={i === 0} onClick={() => update((m) => { [m.gallery[i - 1], m.gallery[i]] = [m.gallery[i], m.gallery[i - 1]]; return m; })}><ArrowUp className="h-3.5 w-3.5" /></IconButton>
                    <IconButton label="Move later" disabled={i === manifest.gallery.length - 1} onClick={() => update((m) => { [m.gallery[i + 1], m.gallery[i]] = [m.gallery[i], m.gallery[i + 1]]; return m; })}><ArrowDown className="h-3.5 w-3.5" /></IconButton>
                    <IconButton label="Remove from the gallery" disabled={manifest.gallery.length <= 1} onClick={() => update((m) => { m.gallery.splice(i, 1); return m; })}><Trash2 className="h-3.5 w-3.5 text-destructive" /></IconButton>
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      </section>

      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:pl-[calc(14rem+2rem)]">
            <span className="text-sm">
              <span className="font-semibold">{changes}</span> {changes === 1 ? 'change' : 'changes'} not yet on the site
            </span>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What changed (optional)" className="h-9 min-w-[12rem] flex-1" />
            <Button variant="outline" size="sm" onClick={load} disabled={publishing}>
              Discard
            </Button>
            <Button size="sm" onClick={publish} disabled={publishing}>
              {publishing ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Publishing
                </>
              ) : (
                <>
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Publish to the site
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SlotCard({ image, preview, staged, onAlt, onReplace, extra, wide = false }: { image: SiteImage; preview: string; staged: boolean; onAlt: (alt: string) => void; onReplace: (file: File) => Promise<void>; extra?: React.ReactNode; wide?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className={`relative bg-muted ${wide ? 'aspect-[21/9]' : 'aspect-[4/3]'}`}>
        <img src={preview} alt={image.alt} className="h-full w-full object-cover" loading="lazy" />
        {staged && <span className="absolute left-2 top-2 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">New, not published</span>}
      </div>
      <div className="space-y-2 p-3">
        <Input value={image.alt} onChange={(e) => onAlt(e.target.value)} placeholder="Describe the picture (for search engines and screen readers)" className="h-8 text-xs" aria-label="Picture description" />
        <div className="flex items-center justify-between gap-2">
          <input ref={input} type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setBusy(true); setProblem(null); try { await onReplace(f); } catch (err) { setProblem((err as Error).message); } finally { setBusy(false); if (input.current) input.current.value = ''; } }} />
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <ImagePlus className="mr-1.5 h-3 w-3" />}
            Replace
          </Button>
          {extra}
        </div>
        {problem && <p className="text-xs text-destructive">{problem}</p>}
        <p className="truncate text-[10px] text-muted-foreground">{image.src}</p>
      </div>
    </div>
  );
}

function AddButton({ onAdd }: { onAdd: (file: File) => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input ref={input} type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setBusy(true); try { await onAdd(f); } finally { setBusy(false); if (input.current) input.current.value = ''; } }} />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="mr-1.5 h-3.5 w-3.5" />}
        Add a picture
      </Button>
    </>
  );
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="rounded border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent">
      {children}
    </button>
  );
}

export { formatBytes };

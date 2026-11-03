/**
 * Website photos.
 *
 * The gallery on the site is a list of finished jobs, each with one or more
 * photos, filed under a type of work. This is where they are added, changed
 * and removed, built for a phone: pick the photos, tap the type, tap a couple
 * of chips to write the label, publish. Publishing uploads the photos and
 * commits them with the manifest in one go, as you; the site redeploys in a
 * minute or two. The two page pictures (hero, About) are changed the same
 * way, one at a time.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Camera, Check, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JOB_TYPES, allJobs, imageUrl, type JobTypeId, type SiteImage } from '@/content/siteImages';
import { useAdmin } from '../auth';
import { ApiError } from '../api/client';
import type { PhotoChange, SitePhotosState } from '../api/types';
import {
  AREAS,
  MAX_TITLE_LENGTH,
  WHAT,
  blobToBase64,
  composeTitle,
  isImageFile,
  photoSrc,
  photoWord,
  rememberPreview,
  shrink,
  typeName,
  type ShrunkPhoto,
} from '../photos';
import { useSheets, type ProgressHandle } from '../sheets';
import { Empty, ErrorNote, Loading, PageHeader } from '../ui';

// ── The manifest, shared by the screens for this visit ──────────────────────

let cache: SitePhotosState | null = null;
const TAB_KEY = 'admin:photos:tab';

function usePhotos() {
  const { api } = useAdmin();
  const [state, setState] = useState<SitePhotosState | null>(cache);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(() => {
    setError(null);
    api
      .sitePhotos()
      .then((s) => {
        cache = s;
        setState(s);
      })
      .catch((e: Error) => setError(e.message));
  }, [api]);
  useEffect(() => {
    if (!cache) reload();
  }, [reload]);
  const update = useCallback((next: SitePhotosState) => {
    cache = next;
    setState(next);
  }, []);
  return { state, error, reload, update };
}

function siteHost(state: SitePhotosState): string {
  try {
    return new URL(state.siteOrigin).host;
  } catch {
    return 'the website';
  }
}

function rememberTab(tab: string) {
  try {
    window.sessionStorage.setItem(TAB_KEY, tab);
  } catch {
    // fine without
  }
}

const isType = (s: string | undefined): s is JobTypeId => JOB_TYPES.some((t) => t.id === s);

// ── Home: the jobs, by type ──────────────────────────────────────────────────

export function PhotosHome() {
  const { state, error, reload } = usePhotos();
  const { user } = useAdmin();
  const [tab, setTab] = useState<'all' | JobTypeId>(() => {
    try {
      const saved = window.sessionStorage.getItem(TAB_KEY) ?? undefined;
      return isType(saved) ? saved : 'all';
    } catch {
      return 'all';
    }
  });

  if (error && !state) return <ErrorNote message={error} retry={reload} />;
  if (!state) return <Loading what="Loading the website photos" />;

  const jobs = allJobs(state.manifest);
  const rows = tab === 'all' ? jobs : jobs.filter((r) => r.type === tab);
  const counts = Object.fromEntries(JOB_TYPES.map((t) => [t.id, jobs.filter((j) => j.type === t.id).length])) as Record<JobTypeId, number>;
  const pick = (next: 'all' | JobTypeId) => {
    setTab(next);
    rememberTab(next);
  };

  return (
    <div className="mx-auto max-w-[640px] pb-28">
      <PageHeader title="Photos" blurb={<>The gallery on {siteHost(state)}: finished jobs, filed by type of work. Tap one to change it.</>} />

      {!state.canPublish && (
        <div className="mb-4">
          <ErrorNote message={`Signed in as ${user?.login || 'this account'}, but that GitHub account can’t update the website yet. Ask Matt to give it access to the repository.`} />
        </div>
      )}

      <nav aria-label="Filter by type" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        <Tab active={tab === 'all'} onClick={() => pick('all')} label="All" count={jobs.length} />
        {JOB_TYPES.map((t) => (
          <Tab key={t.id} active={tab === t.id} onClick={() => pick(t.id)} label={t.name} count={counts[t.id]} />
        ))}
      </nav>

      {rows.length ? (
        <ul className="divide-y border-y">
          {rows.map((r) => (
            <li key={`${r.type}-${r.index}-${r.job.photos[0]}`}>
              <Link to={`/admin/photos/${r.type}/${r.index}`} className="flex items-center gap-3.5 py-3 text-left">
                <img src={photoSrc(r.job.photos[0], state.siteOrigin)} alt="" loading="lazy" className="h-[76px] w-[76px] flex-none bg-muted object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.job.title || 'Untitled job'}</span>
                  <span className="block text-sm text-muted-foreground">
                    {tab === 'all' ? `${typeName(r.type)}, ` : ''}
                    {photoWord(r.job.photos.length)}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 flex-none text-muted-foreground/60" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty title={`No ${tab === 'all' ? '' : `${typeName(tab).toLowerCase()} `}jobs yet`} blurb="Add one with the button below: a few photos of a finished job, its type, and a label." />
      )}

      <section className="mt-10">
        <h2 className="text-base font-bold">Page pictures</h2>
        <p className="mb-3 text-sm text-muted-foreground">The picture behind the headline and the two beside the About text.</p>
        <ul className="grid grid-cols-3 gap-2">
          <SlotCard to="/admin/photos/page/hero" label="Hero" image={state.manifest.hero} siteOrigin={state.siteOrigin} />
          {state.manifest.about.map((img, i) => (
            <SlotCard key={`${img.src}-${i}`} to={`/admin/photos/page/about/${i}`} label={`About ${i + 1}`} image={img} siteOrigin={state.siteOrigin} />
          ))}
        </ul>
      </section>

      {state.canPublish && (
        <BottomBar>
          <Button asChild className="h-12 w-full text-base">
            <Link to="/admin/photos/new">
              <Plus className="h-5 w-5" />
              Add a job
            </Link>
          </Button>
        </BottomBar>
      )}
    </div>
  );
}

function Tab({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex-none whitespace-nowrap rounded-full border px-3.5 py-2 text-[15px] transition-colors duration-150 ${
        active ? 'border-primary bg-primary font-medium text-primary-foreground' : 'text-foreground hover:bg-muted'
      }`}
    >
      {label}
      <span className={`ml-1 ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{count}</span>
    </button>
  );
}

function SlotCard({ to, label, image, siteOrigin }: { to: string; label: string; image: SiteImage; siteOrigin: string }) {
  return (
    <li>
      <Link to={to} className="block">
        <img src={photoSrc(imageUrl(image), siteOrigin)} alt="" className="aspect-[4/3] w-full bg-muted object-cover" loading="lazy" />
        <span className="mt-1.5 block text-sm font-medium">{label}</span>
      </Link>
    </li>
  );
}

function BottomBar({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur lg:left-[14rem]">
      <div className="mx-auto flex max-w-[640px] flex-col gap-1.5 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        {hint && (
          <p className="text-center text-sm text-muted-foreground" role="status">
            {hint}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

function EditorTop({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <button type="button" onClick={onBack} className="-ml-2 flex min-h-[44px] items-center gap-1 pr-2 font-semibold text-primary">
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        Photos
      </button>
      <h1 className="flex-1 text-[17px] font-semibold">{title}</h1>
    </div>
  );
}

function Step({ id, title, help, children }: { id: string; title: string; help?: string; children: ReactNode }) {
  return (
    <section className="pt-6" aria-labelledby={id}>
      <h2 id={id} className="text-[19px] font-bold">
        {title}
      </h2>
      {help && <p className="mb-3.5 text-[15px] text-muted-foreground">{help}</p>}
      {children}
    </section>
  );
}

/** "a, b and c" */
function list(items: string[]): string {
  return items.join(', ').replace(/, ([^,]*)$/, ' and $1');
}

// ── Draft photos ─────────────────────────────────────────────────────────────

interface DraftPhoto {
  id: number;
  /** A photo already on the site. */
  path?: string;
  /** A new photo, once shrunk. */
  shrunk?: ShrunkPhoto;
  /** Still shrinking. */
  busy: boolean;
  /** The file's own object URL while it shrinks. */
  rawUrl?: string;
}

let nextPhotoId = 1;

function useDraftPhotos(initial: string[]) {
  const [photos, setPhotos] = useState<DraftPhoto[]>(() => initial.map((path) => ({ id: nextPhotoId++, path, busy: false })));
  const sheets = useSheets();

  const addFiles = useCallback(
    (files: FileList | File[] | null) => {
      const picked = Array.from(files || []).filter(isImageFile);
      if (!picked.length) return;
      const added = picked.map((file) => ({ id: nextPhotoId++, busy: true, rawUrl: URL.createObjectURL(file), file }));
      setPhotos((p) => [...p, ...added.map(({ id, busy, rawUrl }) => ({ id, busy, rawUrl }))]);
      // One at a time: shrinking several big phone photos at once runs a phone out of memory.
      added.reduce(
        (chain, a) =>
          chain.then(async () => {
            try {
              const shrunk = await shrink(a.file);
              setPhotos((p) => p.map((x) => (x.id === a.id ? { ...x, shrunk, busy: false, rawUrl: undefined } : x)));
            } catch (e) {
              setPhotos((p) => p.filter((x) => x.id !== a.id));
              sheets.toast((e as Error).message || 'One photo couldn’t be read. Try a JPEG or PNG.');
            } finally {
              URL.revokeObjectURL(a.rawUrl);
            }
          }),
        Promise.resolve()
      );
    },
    [sheets]
  );

  const remove = (id: number) =>
    setPhotos((p) => {
      const gone = p.find((x) => x.id === id);
      if (gone?.shrunk && !gone.path) URL.revokeObjectURL(gone.shrunk.url);
      return p.filter((x) => x.id !== id);
    });
  const makeCover = (id: number) =>
    setPhotos((p) => {
      const i = p.findIndex((x) => x.id === id);
      if (i <= 0) return p;
      const next = [...p];
      const [moved] = next.splice(i, 1);
      next.unshift(moved);
      return next;
    });
  return { photos, addFiles, remove, makeCover };
}

function previewOf(p: DraftPhoto, siteOrigin: string): string {
  if (p.shrunk) return p.shrunk.url;
  if (p.rawUrl) return p.rawUrl;
  return p.path ? photoSrc(p.path, siteOrigin) : '';
}

function PhotoPicker({ compact, onFiles, id }: { compact: boolean; onFiles: (f: FileList | null) => void; id: string }) {
  const [over, setOver] = useState(false);
  return (
    <label
      className={`relative flex cursor-pointer items-center justify-center gap-2 border-2 border-dashed text-primary transition-colors ${
        over ? 'border-primary bg-muted' : 'border-accent bg-muted/60'
      } ${compact ? 'min-h-[56px] px-4' : 'min-h-[180px] flex-col px-6 py-6 text-center'}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles(e.dataTransfer.files);
      }}
    >
      {compact ? <Plus className="h-5 w-5" aria-hidden="true" /> : <Camera className="h-10 w-10" aria-hidden="true" />}
      <strong className={compact ? 'text-base' : 'text-lg'}>{compact ? 'Add more photos' : 'Add photos'}</strong>
      {!compact && <small className="text-sm text-muted-foreground">Take a photo or choose from your library</small>}
      <input
        id={id}
        type="file"
        accept="image/*"
        multiple
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </label>
  );
}

function Thumbs({ photos, siteOrigin, onCover, onRemove }: { photos: DraftPhoto[]; siteOrigin: string; onCover: (id: number) => void; onRemove: (id: number) => void }) {
  return (
    <div className="mb-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((p, i) => (
        <div key={p.id} className={`relative aspect-square overflow-hidden bg-muted ${p.busy ? 'opacity-60' : ''}`}>
          <img src={previewOf(p, siteOrigin)} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
          <button
            type="button"
            className="absolute inset-0"
            aria-label={i === 0 ? `Photo ${i + 1}, the cover` : `Make photo ${i + 1} the cover`}
            onClick={() => onCover(p.id)}
          />
          {i === 0 && <span className="pointer-events-none absolute bottom-1.5 left-1.5 bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Cover</span>}
          {p.busy && (
            <span className="pointer-events-none absolute inset-x-0 bottom-1.5 text-center text-[11px] font-medium text-foreground" role="status">
              Preparing…
            </span>
          )}
          <button
            type="button"
            aria-label={`Remove photo ${i + 1}`}
            onClick={() => onRemove(p.id)}
            className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/70 text-background"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

function Chips({ options, value, onPick, name }: { options: string[]; value: string | null; onPick: (v: string | null) => void; name: string }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={name}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onPick(value === o ? null : o)}
          className={`min-h-[40px] rounded-full border px-3.5 text-[15px] transition-colors duration-150 ${
            value === o ? 'border-primary bg-muted font-semibold text-primary' : 'hover:bg-muted'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/** Upload the new photos one by one, telling the sheet how far along it is. */
async function uploadAll(api: ReturnType<typeof useAdmin>['api'], photos: DraftPhoto[], progress: ProgressHandle, steps: number): Promise<{ sha: string }[]> {
  const blobs: { sha: string }[] = [];
  for (let i = 0; i < photos.length; i++) {
    progress.update(`Uploading photo ${i + 1} of ${photos.length}`, i / steps);
    const base64 = await blobToBase64(photos[i].shrunk!.blob);
    const { sha } = await api.uploadPhoto(base64);
    blobs.push({ sha });
  }
  return blobs;
}

function failureText(e: unknown): string {
  if (e instanceof ApiError && e.conflict) return e.message;
  const detail = e instanceof Error && e.message ? ` (${e.message})` : '';
  return `Nothing was changed on the website. Check your signal and try again.${detail}`;
}

// ── A job: new or existing ───────────────────────────────────────────────────

export function JobEditor() {
  const { state, error, reload } = usePhotos();
  if (error && !state) return <ErrorNote message={error} retry={reload} />;
  if (!state) return <Loading what="Loading the website photos" />;
  return <JobEditorLoaded state={state} />;
}

function JobEditorLoaded({ state }: { state: SitePhotosState }) {
  const params = useParams<{ type?: string; index?: string }>();
  const navigate = useNavigate();
  const { api } = useAdmin();
  const { update } = usePhotos();
  const sheets = useSheets();

  const isNew = !params.type;
  const origType = isType(params.type) ? params.type : null;
  const origIndex = params.index != null ? Number(params.index) : -1;
  const orig = origType ? state.manifest.jobs[origType]?.[origIndex] : undefined;
  const origJson = useMemo(() => (orig ? JSON.stringify(orig) : null), [orig]);

  const savedTab = (() => {
    try {
      const t = window.sessionStorage.getItem(TAB_KEY) ?? undefined;
      return isType(t) ? t : null;
    } catch {
      return null;
    }
  })();

  const [type, setType] = useState<JobTypeId | null>(isNew ? savedTab : origType);
  const [title, setTitle] = useState(orig?.title || '');
  const [titleEdited, setTitleEdited] = useState(!isNew);
  const [what, setWhat] = useState<string | null>(null);
  const [where, setWhere] = useState<string | null>(null);
  const { photos, addFiles, remove, makeCover } = useDraftPhotos(orig?.photos || []);

  const dirty = isNew
    ? photos.length > 0 || !!title.trim()
    : !!orig &&
      (title.trim() !== orig.title ||
        type !== origType ||
        photos.length !== orig.photos.length ||
        photos.some((p, i) => p.path !== orig.photos[i]));

  const missing: string[] = [];
  if (!photos.length) missing.push('at least one photo');
  if (!type) missing.push('the type of work');
  if (!title.trim()) missing.push('a label');
  const canPublish = state.canPublish && !missing.length && (isNew || dirty);
  const hint = !state.canPublish
    ? 'This account can’t update the website.'
    : missing.length
      ? `Still needs ${list(missing)}.`
      : !isNew && !dirty
        ? 'No changes yet.'
        : undefined;

  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);

  const leave = () => navigate('/admin/photos');
  const back = async () => {
    if (!dirty) return leave();
    const yes = await sheets.confirm({ title: 'Discard this job?', text: 'Your photos and label won’t be saved.', action: 'Discard', danger: true });
    if (yes) leave();
  };

  const pickType = (t: JobTypeId) => {
    if (t !== type) {
      setType(t);
      setWhat(null);
      if (!titleEdited) setTitle(composeTitle(null, where));
    }
  };
  const pickWhat = (w: string | null) => {
    setWhat(w);
    setTitle(composeTitle(w, where));
    setTitleEdited(false);
  };
  const pickWhere = (w: string | null) => {
    setWhere(w);
    setTitle(composeTitle(what, w));
    setTitleEdited(false);
  };

  const publish = async (mode: 'save' | 'delete') => {
    if (mode === 'save' && photos.some((p) => p.busy)) {
      sheets.toast('Still preparing photos, one moment.');
      return;
    }
    const fresh = mode === 'save' ? photos.filter((p) => p.shrunk) : [];
    const steps = fresh.length + 1;
    const progress = sheets.progress(mode === 'delete' ? 'Deleting job' : 'Publishing', fresh.length ? 'Uploading photos' : 'Updating the website');
    try {
      const blobs = await uploadAll(api, fresh, progress, steps);
      progress.update('Updating the website', fresh.length / steps);
      const paths = photos.map((p) => p.path ?? `new:${fresh.indexOf(p)}`);
      let change: PhotoChange;
      if (mode === 'delete') change = { kind: 'job', mode: 'delete', origType: origType!, origIndex, origJson: origJson! };
      else if (isNew) change = { kind: 'job', mode: 'add', type: type!, title: title.trim(), photos: paths };
      else change = { kind: 'job', mode: 'update', type: type!, title: title.trim(), photos: paths, origType: origType!, origIndex, origJson: origJson! };
      const result = await api.publishPhotos({ change, blobs });
      result.newPaths.forEach((path, i) => rememberPreview(path, fresh[i].shrunk!.url));
      update({ ...state, manifest: result.manifest });
      progress.close();
      const landing = mode === 'delete' ? origType : type;
      if (landing && savedTab) rememberTab(landing);
      navigate('/admin/photos', { replace: true });
      const host = siteHost(state);
      await sheets.done(
        mode === 'delete' ? 'Job deleted' : 'Published',
        mode === 'delete' ? `It will disappear from ${host} in a minute or two.` : `It will be live on ${host} in a minute or two.`
      );
    } catch (e) {
      progress.close();
      await sheets.fail('Not published', failureText(e), 'Back to the job');
    }
  };

  const askDelete = async () => {
    const yes = await sheets.confirm({ title: 'Delete this job?', text: 'It will be removed from the website gallery.', action: 'Delete job', danger: true });
    if (yes) publish('delete');
  };

  if (!isNew && !orig) {
    return (
      <div className="mx-auto max-w-[640px]">
        <EditorTop title="Edit job" onBack={leave} />
        <Empty title="This job is not on the site any more" blurb="It may have been changed or removed on another device." action={<Button variant="outline" onClick={leave}>Back to Photos</Button>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] pb-36">
      <EditorTop title={isNew ? 'New job' : 'Edit job'} onBack={back} />

      <Step id="h-photos" title="Photos" help={photos.length ? 'Tap a photo to make it the cover. The cover is what shows in the gallery.' : 'Pick one or more photos of the finished job.'}>
        {photos.length > 0 && <Thumbs photos={photos} siteOrigin={state.siteOrigin} onCover={makeCover} onRemove={remove} />}
        <PhotoPicker id="job-photos" compact={photos.length > 0} onFiles={addFiles} />
      </Step>

      <Step id="h-type" title="Type of work" help="Which part of the gallery it goes in.">
        <div className="grid grid-cols-2 gap-2">
          {JOB_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={type === t.id}
              onClick={() => pickType(t.id)}
              className={`flex min-h-[60px] items-center justify-between gap-2 border px-3.5 py-2.5 text-left font-semibold transition-colors duration-150 ${
                type === t.id ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
              } ${t.id === 'other' && JOB_TYPES.length % 2 === 1 ? 'col-span-2' : ''}`}
            >
              {t.name}
              <Check className={`h-5 w-5 flex-none ${type === t.id ? '' : 'opacity-0'}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </Step>

      <Step id="h-label" title="Label" help="Tap to build it, or type your own. Customers see this on the website.">
        {type && (
          <>
            <p className="mb-2 text-[15px] font-semibold">What was it?</p>
            <Chips name="What was it?" options={WHAT[type]} value={what} onPick={pickWhat} />
          </>
        )}
        <p className="mb-2 text-[15px] font-semibold">Where?</p>
        <Chips name="Where?" options={AREAS} value={where} onPick={pickWhere} />
        <label htmlFor="job-title" className="mb-1.5 block text-[15px] font-semibold">
          Label on the website
        </label>
        <Input
          id="job-title"
          value={title}
          maxLength={MAX_TITLE_LENGTH}
          autoComplete="off"
          autoCapitalize="sentences"
          placeholder="e.g. Frameless enclosure in Fulham"
          className="h-[52px] text-[17px]"
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleEdited(true);
          }}
        />
      </Step>

      {!isNew && state.canPublish && (
        <section className="pt-8">
          <Button variant="destructive" className="h-[52px] w-full text-base" onClick={askDelete}>
            Delete this job
          </Button>
        </section>
      )}

      <BottomBar hint={hint}>
        <Button className="h-12 w-full text-base" disabled={!canPublish} onClick={() => publish('save')}>
          {isNew ? 'Publish to website' : 'Publish changes'}
        </Button>
      </BottomBar>
    </div>
  );
}

// ── A page picture: the hero, or one of the About pair ───────────────────────

export function SlotEditor() {
  const { state, error, reload } = usePhotos();
  if (error && !state) return <ErrorNote message={error} retry={reload} />;
  if (!state) return <Loading what="Loading the website photos" />;
  return <SlotEditorLoaded state={state} />;
}

function SlotEditorLoaded({ state }: { state: SitePhotosState }) {
  const params = useParams<{ slot?: string; index?: string }>();
  const navigate = useNavigate();
  const { api } = useAdmin();
  const { update } = usePhotos();
  const sheets = useSheets();
  const input = useRef<HTMLInputElement>(null);

  const slot = params.slot === 'about' ? 'about' : 'hero';
  const index = slot === 'about' ? Number(params.index || 0) : undefined;
  const current: SiteImage | undefined = slot === 'hero' ? state.manifest.hero : state.manifest.about[index ?? 0];
  const label = slot === 'hero' ? 'Hero picture' : `About picture ${(index ?? 0) + 1}`;

  const [alt, setAlt] = useState(current?.alt || '');
  const [fresh, setFresh] = useState<ShrunkPhoto | null>(null);
  const [busy, setBusy] = useState(false);

  const dirty = !!current && (alt !== current.alt || !!fresh);
  const canPublish = state.canPublish && dirty && !busy;
  const hint = !state.canPublish ? 'This account can’t update the website.' : !dirty ? 'No changes yet.' : undefined;

  const leave = () => navigate('/admin/photos');
  const back = async () => {
    if (!dirty) return leave();
    const yes = await sheets.confirm({ title: 'Discard these changes?', text: 'The new picture won’t be saved.', action: 'Discard', danger: true });
    if (yes) leave();
  };

  const pick = async (files: FileList | null) => {
    const file = Array.from(files || []).find(isImageFile);
    if (!file) return;
    setBusy(true);
    try {
      if (fresh) URL.revokeObjectURL(fresh.url);
      setFresh(await shrink(file));
    } catch (e) {
      sheets.toast((e as Error).message || 'That photo couldn’t be read. Try a JPEG or PNG.');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    const progress = sheets.progress('Publishing', fresh ? 'Uploading the picture' : 'Updating the website');
    try {
      const blobs = fresh ? await uploadAll(api, [{ id: 0, busy: false, shrunk: fresh }], progress, 2) : [];
      progress.update('Updating the website', fresh ? 0.5 : 0);
      const change: PhotoChange = { kind: 'slot', slot, index, alt, photo: fresh ? 'new:0' : null };
      const result = await api.publishPhotos({ change, blobs });
      if (fresh && result.newPaths[0]) rememberPreview(result.newPaths[0], fresh.url);
      update({ ...state, manifest: result.manifest });
      progress.close();
      navigate('/admin/photos', { replace: true });
      await sheets.done('Published', `It will be live on ${siteHost(state)} in a minute or two.`);
    } catch (e) {
      progress.close();
      await sheets.fail('Not published', failureText(e), 'Back to the picture');
    }
  };

  if (!current) {
    return (
      <div className="mx-auto max-w-[640px]">
        <EditorTop title={label} onBack={leave} />
        <Empty title="That page picture is not on the site" action={<Button variant="outline" onClick={leave}>Back to Photos</Button>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] pb-36">
      <EditorTop title={label} onBack={back} />

      <Step
        id="h-picture"
        title="Picture"
        help={slot === 'hero' ? 'The full-width picture behind the headline. Landscape, at least 2000px wide, works best.' : 'One of the two pictures beside the About text. Portrait or square works best.'}
      >
        <div className={`relative overflow-hidden bg-muted ${slot === 'hero' ? 'aspect-[21/9]' : 'aspect-[4/3]'}`}>
          <img src={fresh ? fresh.url : photoSrc(imageUrl(current), state.siteOrigin)} alt={alt} className={`h-full w-full object-cover ${busy ? 'opacity-60' : ''}`} />
          {fresh && <span className="absolute left-2 top-2 bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">New, not published</span>}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="mt-3 flex gap-2">
          <Button type="button" variant="outline" className="h-11 flex-1" disabled={busy} onClick={() => input.current?.click()}>
            <Camera className="h-4 w-4" />
            {busy ? 'Preparing…' : 'Replace picture'}
          </Button>
          {fresh && (
            <Button
              type="button"
              variant="ghost"
              className="h-11"
              onClick={() => {
                URL.revokeObjectURL(fresh.url);
                setFresh(null);
              }}
            >
              Keep the old one
            </Button>
          )}
        </div>
      </Step>

      <Step id="h-alt" title="Description" help="A few words saying what is in the picture, for search engines and screen readers. Customers don’t see it.">
        <Input id="slot-alt" value={alt} maxLength={200} className="h-[52px] text-[17px]" onChange={(e) => setAlt(e.target.value)} placeholder="e.g. Frameless glass shower enclosure" />
      </Step>

      <BottomBar hint={hint}>
        <Button className="h-12 w-full text-base" disabled={!canPublish} onClick={publish}>
          Publish changes
        </Button>
      </BottomBar>
    </div>
  );
}

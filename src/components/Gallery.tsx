import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { allJobs, JOB_TYPES, type JobTypeId } from "@/content/siteImages";

// The gallery: finished jobs from the manifest, filed by type of work. The
// strip shows each job's cover; opening one walks through all of its photos.
// Jobs are added, changed and removed from the admin dashboard, which commits
// the manifest.
const items = allJobs().map(({ type, job }) => ({ type, title: job.title, photos: job.photos }));
const filters: { id: "all" | JobTypeId; name: string }[] = [
  { id: "all", name: "All" },
  ...JOB_TYPES.filter((t) => items.some((i) => i.type === t.id)),
];

const IMAGE_WIDTH = 320;
/** Fewer covers than this sit still in the middle instead of looping. */
const MIN_FOR_LOOP = 5;

const Gallery = () => {
  const [filter, setFilter] = useState<"all" | JobTypeId>("all");
  const [view, setView] = useState<{ item: number; photo: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const scrollPosRef = useRef(0);

  const visible = useMemo(() => (filter === "all" ? items : items.filter((i) => i.type === filter)), [filter]);
  const loop = visible.length >= MIN_FOR_LOOP;
  const strip = loop ? [...visible, ...visible] : visible;

  useEffect(() => {
    isPausedRef.current = view !== null;
  }, [view]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    scrollPosRef.current = 0;
    container.scrollLeft = 0;
    if (!loop) return;

    let animationId: number;
    const scroll = () => {
      if (!isPausedRef.current) {
        scrollPosRef.current += 0.5;
        if (scrollPosRef.current >= container.scrollWidth / 2) {
          scrollPosRef.current = 0;
        }
        container.scrollLeft = scrollPosRef.current;
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [loop, filter]);

  const step = (dir: 1 | -1) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const limit = loop ? container.scrollWidth / 2 : Math.max(0, container.scrollWidth - container.clientWidth);
    scrollPosRef.current = Math.max(0, scrollPosRef.current + dir * IMAGE_WIDTH);
    if (loop && scrollPosRef.current >= limit) scrollPosRef.current = 0;
    if (!loop) scrollPosRef.current = Math.min(limit, scrollPosRef.current);
    container.scrollLeft = scrollPosRef.current;
  };

  /** One photo on from the current, through this job's photos and then into the next job. */
  const move = (dir: 1 | -1) => {
    setView((v) => {
      if (!v || !visible.length) return v;
      const current = visible[v.item];
      const photo = v.photo + dir;
      if (photo >= 0 && photo < current.photos.length) return { item: v.item, photo };
      const item = (v.item + dir + visible.length) % visible.length;
      return { item, photo: dir === 1 ? 0 : visible[item].photos.length - 1 };
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view === null) return;
      if (e.key === "Escape") setView(null);
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, visible]);

  const shown = view ? visible[view.item] : null;

  return (
    <section id="gallery" className="py-14 bg-primary">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4 uppercase">
            Our Projects
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Explore our portfolio of completed projects
          </p>
        </div>

        {/* Filters by type of work */}
        {filters.length > 2 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8" role="group" aria-label="Filter the gallery">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`border px-4 py-1.5 text-sm font-semibold uppercase tracking-wide transition-colors duration-200 ${
                  filter === f.id
                    ? "bg-primary-foreground text-primary border-primary-foreground"
                    : "border-primary-foreground/40 text-primary-foreground/80 hover:border-primary-foreground hover:text-primary-foreground"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}

        {/* Scrolling strip with arrows */}
        <div className="relative">
          <div className="overflow-x-hidden">
            <div ref={scrollContainerRef} className={`flex overflow-x-hidden ${loop ? "" : "justify-center"}`}>
              {strip.map((project, i) => (
                <div
                  key={`${project.photos[0]}-${i}`}
                  className="relative flex-shrink-0 w-80 h-60 overflow-hidden cursor-pointer group"
                  onClick={() => setView({ item: i % visible.length, photo: 0 })}
                >
                  <img
                    src={project.photos[0]}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  {project.photos.length > 1 && (
                    <span className="absolute top-3 right-3 bg-background/90 text-foreground text-xs font-semibold px-2 py-1">
                      {project.photos.length} photos
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {visible.length > 0 && (
            <>
              {/* Prev Arrow */}
              <button
                onClick={() => step(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 bg-white text-primary w-10 h-10 flex items-center justify-center shadow-lg hover:bg-white/90 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Next Arrow */}
              <button
                onClick={() => step(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 bg-white text-primary w-10 h-10 flex items-center justify-center shadow-lg hover:bg-white/90 transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lightbox: the job's photos, then on to the next job */}
      {view !== null && shown && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setView(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl leading-none hover:text-white/70 transition-colors"
            onClick={() => setView(null)}
            aria-label="Close"
          >
            &times;
          </button>
          <button
            className="absolute left-4 text-white text-5xl leading-none hover:text-white/70 transition-colors px-2"
            onClick={(e) => { e.stopPropagation(); move(-1); }}
            aria-label="Previous"
          >
            &#8249;
          </button>
          <img
            src={shown.photos[view.photo]}
            alt={shown.title}
            className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 text-white text-5xl leading-none hover:text-white/70 transition-colors px-2"
            onClick={(e) => { e.stopPropagation(); move(1); }}
            aria-label="Next"
          >
            &#8250;
          </button>
          <p className="absolute bottom-6 left-0 right-0 text-center text-white/80 text-sm">
            {shown.title}
            {shown.photos.length > 1 && <> &nbsp;·&nbsp; photo {view.photo + 1} of {shown.photos.length}</>}
            &nbsp;·&nbsp; {view.item + 1} / {visible.length}
          </p>
        </div>
      )}
    </section>
  );
};

export default Gallery;

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { imageUrl, siteImages } from "@/content/siteImages";

// The gallery strip, in the order the manifest lists it. Replace or reorder
// pictures from the admin dashboard, which commits the manifest.
const projects = siteImages.gallery.map((image) => ({ image: imageUrl(image), alt: image.alt }));

const IMAGE_WIDTH = 320;

const Gallery = () => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const scrollPosRef = useRef(0);

  useEffect(() => {
    isPausedRef.current = lightboxIndex !== null;
  }, [lightboxIndex]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

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
  }, []);

  const step = (dir: 1 | -1) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    scrollPosRef.current = Math.max(0, scrollPosRef.current + dir * IMAGE_WIDTH);
    if (scrollPosRef.current >= container.scrollWidth / 2) scrollPosRef.current = 0;
    container.scrollLeft = scrollPosRef.current;
  };

  const handleImageClick = (index: number) => {
    setLightboxIndex(index % projects.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i! + 1) % projects.length);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i! - 1 + projects.length) % projects.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex]);

  return (
    <section id="gallery" className="py-14 bg-primary">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4 uppercase">
            Our Projects
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Explore our portfolio of completed projects
          </p>
        </div>

        {/* Scrolling strip with arrows */}
        <div className="relative">
          <div className="overflow-x-hidden">
            <div ref={scrollContainerRef} className="flex overflow-x-hidden">
              {[...projects, ...projects].map((project, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-80 h-60 overflow-hidden cursor-pointer group"
                  onClick={() => handleImageClick(i)}
                >
                  <img
                    src={project.image}
                    alt={project.alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>

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
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl leading-none hover:text-white/70 transition-colors"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
          >
            &times;
          </button>
          <button
            className="absolute left-4 text-white text-5xl leading-none hover:text-white/70 transition-colors px-2"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + projects.length) % projects.length); }}
            aria-label="Previous"
          >
            &#8249;
          </button>
          <img
            src={projects[lightboxIndex].image}
            alt={projects[lightboxIndex].alt}
            className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 text-white text-5xl leading-none hover:text-white/70 transition-colors px-2"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % projects.length); }}
            aria-label="Next"
          >
            &#8250;
          </button>
          <p className="absolute bottom-6 left-0 right-0 text-center text-white/80 text-sm">
            {projects[lightboxIndex].alt} &nbsp;·&nbsp; {lightboxIndex + 1} / {projects.length}
          </p>
        </div>
      )}
    </section>
  );
};

export default Gallery;

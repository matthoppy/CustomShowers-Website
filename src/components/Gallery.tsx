import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";

const projects = [
  { image: gallery1, alt: "Custom shower enclosure with gold fixtures" },
  { image: gallery2, alt: "Custom glass shower installation" },
  { image: gallery3, alt: "Glass shower with blue tile finish" },
  { image: gallery4, alt: "Frameless glass shower with skylight" },
];

const Gallery = () => {
  const [current, setCurrent] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const prev = () => setCurrent((c) => (c - 1 + projects.length) % projects.length);
  const next = () => setCurrent((c) => (c + 1) % projects.length);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex !== null) {
        if (e.key === "Escape") setLightboxIndex(null);
        if (e.key === "ArrowRight") setLightboxIndex((i) => (i! + 1) % projects.length);
        if (e.key === "ArrowLeft") setLightboxIndex((i) => (i! - 1 + projects.length) % projects.length);
      } else {
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
      }
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
            Explore our portfolio of completed installations
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-3xl mx-auto">
          {/* Image */}
          <div
            className="relative aspect-[4/3] overflow-hidden bg-background cursor-pointer group"
            onClick={() => setLightboxIndex(current)}
          >
            <img
              key={current}
              src={projects[current].image}
              alt={projects[current].alt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-overlay/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="text-white text-lg font-semibold">View Full Size</span>
            </div>
          </div>

          {/* Prev Arrow */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 bg-white text-primary w-10 h-10 flex items-center justify-center shadow-lg hover:bg-white/90 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Next Arrow */}
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 bg-white text-primary w-10 h-10 flex items-center justify-center shadow-lg hover:bg-white/90 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {projects.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/30"}`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
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
            {projects[lightboxIndex].alt}
          </p>
        </div>
      )}
    </section>
  );
};

export default Gallery;

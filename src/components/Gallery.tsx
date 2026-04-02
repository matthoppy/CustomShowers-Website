import { useState, useEffect } from "react";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";

const Gallery = () => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const projects = [
    {
      image: gallery1,
      alt: "Bespoke frameless shower enclosure with gold fixtures, London installation",
    },
    {
      image: gallery2,
      alt: "Custom frameless glass shower walk-in installation, London",
    },
    {
      image: gallery3,
      alt: "Frameless glass shower enclosure with blue tile surround, London",
    },
    {
      image: gallery4,
      alt: "Bespoke frameless shower enclosure with overhead skylight, London",
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i! + 1) % projects.length);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i! - 1 + projects.length) % projects.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, projects.length]);

  return (
    <section id="gallery" className="py-24 bg-primary">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4 uppercase">
            Our Projects
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Explore our portfolio of completed installations
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2">
          {projects.map((project, index) => (
            <div
              key={index}
              className="relative aspect-[3/4] overflow-hidden group cursor-pointer bg-background"
              onClick={() => setLightboxIndex(index)}
            >
              <img
                src={project.image}
                alt={project.alt}
                loading="lazy"
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-overlay/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-primary-foreground text-lg font-semibold">
                  View Project
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white text-4xl leading-none hover:text-white/70 transition-colors"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
          >
            &times;
          </button>

          {/* Prev button */}
          <button
            className="absolute left-4 text-white text-4xl leading-none hover:text-white/70 transition-colors px-2"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + projects.length) % projects.length); }}
            aria-label="Previous"
          >
            &#8249;
          </button>

          {/* Image */}
          <img
            src={projects[lightboxIndex].image}
            alt={projects[lightboxIndex].alt}
            className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next button */}
          <button
            className="absolute right-4 text-white text-4xl leading-none hover:text-white/70 transition-colors px-2"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % projects.length); }}
            aria-label="Next"
          >
            &#8250;
          </button>

          {/* Caption */}
          <p className="absolute bottom-6 left-0 right-0 text-center text-white/80 text-sm">
            {projects[lightboxIndex].alt}
          </p>
        </div>
      )}
    </section>
  );
};

export default Gallery;

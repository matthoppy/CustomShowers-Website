import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

// Image paths using direct URLs to bypass Vite's uppercase extension handling issues
const img1 = "/images/balustrade-channel.JPG";
const img2 = "/images/balustrade-internal.JPG";
const img3 = "/images/balustrade-juliette.JPG";
const img4 = "/images/balustrade-posts1.JPG";
const img5 = "/images/balustrade-standoff.JPG";
const img6 = "/images/balustrade-standoff2.JPG";
const img7 = "/images/balustrade-internal2.JPG";
const img8 = "/images/balustrade-channel2.JPG";
const img9 = "/images/balustrade-posts2.JPG";
const img10 = "/images/balustrade-posts3.JPG";
const img11 = "/images/balustrade-internal5.JPG";
const img12 = "/images/balustrade-internal6.JPG";

const images = [
  { src: img1, alt: "Channel-fixed frameless glass balustrade" },
  { src: img2, alt: "Internal glass staircase balustrade" },
  { src: img3, alt: "Frameless Juliet balcony" },
  { src: img4, alt: "Post-fixed glass balustrade" },
  { src: img5, alt: "Standoff glass balustrade" },
  { src: img6, alt: "Standoff glass balustrade detail" },
  { src: img7, alt: "Internal glass balustrade landing" },
  { src: img8, alt: "Channel-fixed glass balustrade detail" },
  { src: img9, alt: "Post-fixed glass balustrade installation" },
  { src: img10, alt: "Post-fixed glass balustrade with posts" },
  { src: img11, alt: "Internal glass staircase installation" },
  { src: img12, alt: "Internal glass balustrade detail" },
];

const BalustradesSection = () => {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let animationId: number;
    let scrollPosition = 0;

    const scroll = () => {
      scrollPosition += scrollSpeed * 0.5;

      // Seamless loop - reset when we've scrolled past half (for infinite loop effect)
      if (scrollPosition >= container.scrollWidth / 2) {
        scrollPosition = 0;
      }

      container.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationId);
  }, [scrollSpeed]);

  const speedUp = () => {
    setScrollSpeed((prev) => Math.min(prev + 0.5, 5));
  };

  const slowDown = () => {
    setScrollSpeed((prev) => Math.max(prev - 0.5, 0.5));
  };

  return (
    <section className="bg-background">
      <div className="py-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <p className="uppercase tracking-widest text-sm font-semibold mb-4">
              We also specialise in
            </p>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-wider mb-6">Glass Balustrades</h2>
            <p className="text-xl text-muted-foreground">
              Frameless glass balustrade systems for staircases, Juliet balconies, terraces, and landings.
              Supply only UK wide. Supply and fit across London.
            </p>
          </div>

          <h3 className="text-2xl font-bold mb-6">Featured Installations</h3>

          {/* Horizontal Scrolling Gallery */}
          <div className="relative mb-8">
            {/* Scroll Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-hidden pb-4 scroll-smooth"
              style={{ scrollBehavior: "smooth" }}
            >
              {/* Original images */}
              {images.map((img, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-80 h-60 overflow-hidden rounded-xl cursor-pointer group"
                  onClick={() => setLightboxSrc(img.src)}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              ))}
              {/* Duplicate images for seamless loop */}
              {images.map((img, i) => (
                <div
                  key={`duplicate-${i}`}
                  className="flex-shrink-0 w-80 h-60 overflow-hidden rounded-xl cursor-pointer group"
                  onClick={() => setLightboxSrc(img.src)}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>

            {/* Arrow Controls */}
            <button
              onClick={slowDown}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 bg-primary text-primary-foreground rounded-full p-3 hover:bg-primary/90 transition-colors shadow-lg"
              title="Slow down scroll"
            >
              ←
            </button>
            <button
              onClick={speedUp}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 bg-primary text-primary-foreground rounded-full p-3 hover:bg-primary/90 transition-colors shadow-lg"
              title="Speed up scroll"
            >
              →
            </button>

            {/* Speed Indicator */}
            <div className="absolute bottom-0 right-0 bg-primary/10 px-3 py-1 rounded text-sm text-muted-foreground">
              Speed: {scrollSpeed.toFixed(1)}x
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/balustrades"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded font-semibold hover:bg-primary/90 transition-colors duration-200"
            >
              View Balustrades →
            </Link>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt="Balustrade detail"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 bg-white/80 hover:bg-white text-black rounded-full p-3 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
};

export default BalustradesSection;

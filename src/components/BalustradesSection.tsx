import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let animationId: number;
    let scrollPosition = 0;

    const scroll = () => {
      scrollPosition += 0.5;
      if (scrollPosition >= container.scrollWidth / 2) {
        scrollPosition = 0;
      }
      container.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, []);

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
          <div className="overflow-x-hidden mb-8">
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-hidden"
            >
              {[...images, ...images].map((img, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-80 h-60 overflow-hidden cursor-pointer group"
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
            className="max-h-[90vh] max-w-full object-contain"
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

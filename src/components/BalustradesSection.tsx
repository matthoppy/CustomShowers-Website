import { Link } from "react-router-dom";
import { useState } from "react";

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

const carouselImages = [
  { src: "/images/balustrade-internal5.JPG", alt: "Internal glass staircase installation" },
  { src: "/images/balustrade-channel2.JPG", alt: "Channel-fixed glass balustrade detail" },
  { src: "/images/balustrade-standoff2.JPG", alt: "Standoff glass balustrade detail" },
];

const BalustradesSection = () => {
  const [carouselIndex, setCarouselIndex] = useState(0);

  const nextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCarouselIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  return (
    <section className="bg-background">
      {/* Carousel Section */}
      <div className="relative w-full h-96 md:h-[500px] overflow-hidden bg-black">
        <div className="relative w-full h-full">
          {carouselImages.map((img, i) => (
            <img
              key={i}
              src={img.src}
              alt={img.alt}
              className={`absolute w-full h-full object-cover transition-opacity duration-1000 ${
                i === carouselIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>

        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-black rounded-full p-3 transition-colors"
        >
          ←
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-black rounded-full p-3 transition-colors"
        >
          →
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {carouselImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCarouselIndex(i)}
              className={`w-3 h-3 rounded-full transition-all ${
                i === carouselIndex ? "bg-white w-8" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <p className="text-secondary uppercase tracking-widest text-sm font-semibold mb-4">
              Complementary Services
            </p>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-wider mb-6">Glass Balustrades</h2>
            <p className="text-xl text-muted-foreground">
              Frameless glass balustrade systems for staircases, Juliet balconies, terraces, and landings.
              Supply only UK wide. Supply and fit across London.
            </p>
          </div>

          <h3 className="text-2xl font-bold mb-8">Featured Installations</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {images.map((img, i) => (
              <div key={i} className="overflow-hidden rounded-xl aspect-[4/3]">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
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
    </section>
  );
};

export default BalustradesSection;

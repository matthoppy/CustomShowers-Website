import { useState, useRef } from "react";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import screenSizedToLandscape from "@/assets/screen-sizedtolandscape.png";
import showerScreenMain from "@/assets/shower-screenmain.JPG";
import screenClamps from "@/assets/screen-clamps.JPG";
import screenCrittal from "@/assets/screen-crittal.JPG";
import screenSizedToLandscape1 from "@/assets/screen-sizedtolandscape1.jpg";
import enclosureClamps from "@/assets/enclosure-clamps.JPG";
import enclosureClamps2 from "@/assets/enclosure-clamps2.JPG";
import enclosureLandscape from "@/assets/enclosure-landscape.png";
import slidingLandscape from "@/assets/sliding-landscape.png";

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

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
    {
      image: screenSizedToLandscape,
      alt: "Sized to landscape shower screen design",
    },
    {
      image: showerScreenMain,
      alt: "Main shower screen installation",
    },
    {
      image: screenClamps,
      alt: "Shower screen with clamp fixtures",
    },
    {
      image: screenCrittal,
      alt: "Crittal-style shower screen enclosure",
    },
    {
      image: screenSizedToLandscape1,
      alt: "Landscape-oriented shower screen",
    },
    {
      image: enclosureClamps,
      alt: "Enclosure with professional clamps",
    },
    {
      image: enclosureClamps2,
      alt: "Dual clamp enclosure system",
    },
    {
      image: enclosureLandscape,
      alt: "Landscape shower enclosure",
    },
    {
      image: slidingLandscape,
      alt: "Sliding door landscape shower",
    },
  ];

  return (
    <section id="gallery" className="py-24 bg-primary">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4 uppercase">
            Our Shower Projects
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Hover to pause, click any image to enlarge
          </p>
        </div>

        {/* Horizontal Scrolling Carousel */}
        <div
          ref={carouselRef}
          className="relative overflow-hidden bg-background/10 py-8"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <style>{`
            @keyframes scroll-left {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            .carousel-track {
              animation: ${isHovering ? "none" : "scroll-left 80s linear infinite"};
            }
          `}</style>

          <div className="carousel-track flex gap-6 w-max">
            {[...projects, ...projects].map((project, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-80 h-64 overflow-hidden bg-background border border-primary/20 cursor-pointer group"
                onClick={() => setSelectedImage({ src: project.image, alt: project.alt })}
              >
                <img
                  src={project.image}
                  alt={project.alt}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-black rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm px-4">
              {selectedImage.alt}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;

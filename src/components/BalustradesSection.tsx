import { Link } from "react-router-dom";
import img1 from "@/assets/balustrade-channel.JPG";
import img2 from "@/assets/balustrade-internal.JPG";
import img3 from "@/assets/balustrade-juliette.JPG";
import img4 from "@/assets/balustrade-posts1.JPG";
import img5 from "@/assets/balustrade-standoff.JPG";
import img6 from "@/assets/balustrade-standoff2.JPG";

const images = [
  { src: img1, alt: "Channel-fixed frameless glass balustrade" },
  { src: img2, alt: "Internal glass staircase balustrade" },
  { src: img3, alt: "Frameless Juliet balcony" },
  { src: img4, alt: "Post-fixed glass balustrade" },
  { src: img5, alt: "Standoff glass balustrade" },
  { src: img6, alt: "Standoff glass balustrade detail" },
];

const BalustradesSection = () => {
  return (
    <section className="py-24 bg-muted/40">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold uppercase mb-4">Glass Balustrades</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Frameless glass balustrade systems for staircases, Juliet balconies, terraces, and landings.
            Supply only UK wide. Supply and fit across London.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10 max-w-5xl mx-auto">
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
    </section>
  );
};

export default BalustradesSection;

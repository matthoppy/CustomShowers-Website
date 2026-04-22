import balustrade from "@/assets/hero-balustrading.jpg";

const tiles = Array(8).fill(balustrade);
const doubled = [...tiles, ...tiles];

const BalustradeCarousel = () => (
  <section className="overflow-hidden bg-background">
    <div className="flex animate-marquee w-max">
      {doubled.map((src, i) => (
        <img
          key={i}
          src={src}
          alt="Bespoke glass balustrade installation"
          className="h-56 w-auto object-cover flex-shrink-0"
          loading="lazy"
        />
      ))}
    </div>
  </section>
);

export default BalustradeCarousel;

import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { useState, useEffect, useRef } from "react";
import QuoteModal from "../components/QuoteModal";

import imgChannel1 from "../assets/balustrade-channel.JPG";
import imgChannel2 from "../assets/balustrade-channel2.JPG";
import imgInternal1 from "../assets/balustrade-internal.JPG";
import imgInternal2 from "../assets/balustrade-internal2.JPG";
import imgJuliette from "../assets/balustrade-juliette.JPG";
import imgPosts1 from "../assets/balustrade-posts1.JPG";
import imgPosts2 from "../assets/balustrade-posts2.JPG";
import imgHero from "../assets/hero-balustrading.jpg";
import imgStandoff1 from "../assets/balustrade-standoff.JPG";
import imgStandoff2 from "../assets/balustrade-standoff2.JPG";

const galleryImages = [
  { src: imgChannel1, alt: "Frameless channel-fixed glass balustrade" },
  { src: imgInternal1, alt: "Internal glass balustrade staircase" },
  { src: imgPosts1, alt: "Post-fixed glass balustrade" },
  { src: imgJuliette, alt: "Frameless glass Juliet balcony" },
  { src: imgStandoff1, alt: "Standoff-fixed glass balustrade" },
  { src: imgChannel2, alt: "Channel-fixed glass balustrade detail" },
  { src: imgInternal2, alt: "Internal glass balustrade landing" },
  { src: imgPosts2, alt: "Post-fixed glass balustrade installation" },
  { src: imgStandoff2, alt: "Standoff glass balustrade detail" },
];

const systems = [
  {
    name: "Channel Fixed",
    description:
      "Glass sits in a continuous floor or wall channel with no posts. The cleanest possible look — the glass appears to float. Best for straight runs with solid substrate.",
    images: [imgChannel1, imgChannel2],
  },
  {
    name: "Post Fixed",
    description:
      "Minimal stainless steel or powder-coated posts fix into the floor or stringer. Suits timber floors, steel staircases, and situations where a channel fix isn't practical.",
    images: [imgPosts1, imgPosts2],
  },
  {
    name: "Standoff Fixed",
    description:
      "Glass panels fixed directly to the wall or fascia via standoff fixings. Ideal for balconies, terraces, and staircase strings where floor fixing isn't possible.",
    images: [imgStandoff1, imgStandoff2],
  },
];

const applications = [
  {
    title: "Staircases",
    description:
      "Frameless glass balustrades open up stairwells and let light flow between floors. We manufacture panels to suit straight flights, winders, and angled staircases.",
    image: imgInternal1,
  },
  {
    title: "Juliet Balconies",
    description:
      "A clean, minimal alternative to traditional Juliet railings. Fixed directly to the structural opening with no visible posts, meeting all UK building regulations.",
    image: imgJuliette,
  },
  {
    title: "Terraces & Balconies",
    description:
      "Preserve the view from external terraces and balconies without the bulk of steel railings. Toughened and laminated glass panels rated to building regulation loads.",
    image: imgStandoff1,
  },
  {
    title: "Landing Infills",
    description:
      "Replace timber spindles or closed panels with frameless glass on internal landings. Dramatically brightens hallways in both period and new-build properties.",
    image: imgInternal2,
  },
];

const faqs = [
  {
    question: "Do your balustrades meet UK building regulations?",
    answer:
      "Yes. All our balustrade systems are designed to meet the relevant sections of Approved Document K and BS 6180. We use toughened and laminated glass rated to the required loadings for the specific application. For planning or building control purposes, we can provide technical specifications.",
  },
  {
    question: "What glass do you use for balustrades?",
    answer:
      "We use 10mm toughened safety glass as standard for interior applications, and 17.5mm or 21.5mm toughened laminated glass for external or high-load situations. Laminated glass is required in most external balcony and terrace applications to meet fall-arrest requirements.",
  },
  {
    question: "Do you supply only, or can you install too?",
    answer:
      "Both. We supply balustrade systems nationwide with full technical drawings and installation guides. Our installation team covers London and surrounding areas for supply-and-fit projects.",
  },
  {
    question: "What hardware finishes are available?",
    answer:
      "Posts, clamps, and handrails are available in satin stainless steel, brushed nickel, matt black, and brushed brass. Powder-coated finishes in RAL colours are available on request for commercial projects.",
  },
  {
    question: "Can you work with curved or shaped balustrades?",
    answer:
      "Straight and angled runs are our standard. Curved glass balustrades are possible but require specialist manufacture — contact us with your requirements and we'll advise on feasibility and lead times.",
  },
  {
    question: "How do I get a quote?",
    answer:
      "Send us your dimensions, a brief description of the application (indoor/outdoor, staircase/terrace etc.), and any photos if you have them. We'll come back with a detailed quote, usually within one business day.",
  },
];

const Balustrades = () => {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const total = galleryImages.length;

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation onOpenQuote={() => setQuoteModalOpen(true)} />

      {/* Hero */}
      <section
        className="text-white pt-32 pb-20 px-6 relative overflow-hidden"
        style={{ backgroundImage: `url(${imgHero})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-black/50 z-0" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <p className="text-secondary uppercase tracking-widest text-sm font-semibold mb-4">
            Staircases · Balconies · Terraces
          </p>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-wider mb-6">
            Frameless Glass Balustrades
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
            We also design and supply frameless glass balustrade systems for staircases, Juliet balconies,
            terraces, and landings — using the same precision and craftsmanship as our bespoke shower enclosures.
            Supply only UK wide. Supply and fit across London.
          </p>
          <Button
            variant="default"
            size="lg"
            className="bg-white text-primary hover:bg-white/90"
            onClick={() => setQuoteModalOpen(true)}
          >
            Get A Quote
          </Button>
        </div>
      </section>

      {/* Photo Carousel */}
      <section className="py-20 bg-background">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Our Work</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            A selection of recent balustrade installations across London.
          </p>
        </div>

        {/* Carousel — full bleed */}
        <div className="relative select-none">
          <div className="overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {galleryImages.map((img, i) => (
                <div key={i} className="w-full flex-shrink-0">
                  <img src={img.src} alt={img.alt} className="w-full max-h-[70vh] object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Prev arrow */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors duration-150"
            aria-label="Previous"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next arrow */}
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors duration-150"
            aria-label="Next"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {galleryImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 transition-colors duration-150 ${i === current ? "bg-white" : "bg-white/40"}`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="container mx-auto max-w-6xl px-6 mt-4">
          <div className="grid grid-cols-9 gap-1">
            {galleryImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`overflow-hidden aspect-square transition-opacity duration-150 ${
                  i === current ? "opacity-100 ring-2 ring-primary" : "opacity-50 hover:opacity-80"
                }`}
              >
                <img src={img.src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Applications */}
      <section className="py-20 px-6 bg-muted/40">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Applications</h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            Frameless glass balustrades for every setting — residential, commercial, interior, and external.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {applications.map((app) => (
              <div key={app.title} className="bg-background overflow-hidden shadow-sm">
                <img src={app.image} alt={app.title} className="w-full h-52 object-cover" />
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{app.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{app.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fixing Systems */}
      <section className="py-20 px-6 bg-background">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Fixing Systems</h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            We'll advise on the right system for your substrate and aesthetic. If you're unsure, just describe the application and we'll guide you.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {systems.map((system) => (
              <div key={system.name} className="overflow-hidden border border-border shadow-sm">
                <div className="grid grid-cols-2">
                  {system.images.map((src, i) => (
                    <img key={i} src={src} alt={`${system.name} example`} className="w-full h-36 object-cover" />
                  ))}
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{system.name}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{system.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-muted/40">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Common Questions</h2>
          <div className="space-y-8">
            {faqs.map((faq) => (
              <div key={faq.question} className="border-b border-border pb-8 last:border-0 last:pb-0">
                <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-primary-foreground/80 mb-8">
            Send us your dimensions and application details — we'll come back with a quote within one business day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-white text-primary hover:bg-white/90"
              size="lg"
              onClick={() => setQuoteModalOpen(true)}
            >
              Get A Quote
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <QuoteModal open={quoteModalOpen} onOpenChange={setQuoteModalOpen} />
    </div>
  );
};

export default Balustrades;

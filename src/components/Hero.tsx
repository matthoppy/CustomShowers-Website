import { Button } from "./ui/button";
import heroImage from "@/assets/hero-shower.jpg";

interface HeroProps {
  onOpenQuote?: () => void;
}

const Hero = ({ onOpenQuote }: HeroProps) => {
  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
        role="img"
        aria-label="Bespoke frameless glass shower enclosure installation"
      >
        <div className="absolute inset-0 bg-overlay/50" />
      </div>

      {/* Hero Content */}
      <div className="relative h-full flex items-center justify-center text-center px-6">
        <div className="max-w-5xl">
          <h1 className="text-5xl md:text-7xl font-black text-primary-foreground uppercase tracking-wider mb-6 animate-fade-in">
            Bespoke Frameless Shower Enclosures London
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto font-light">
            Premium frameless shower enclosures. Supply only UK wide. Professional survey and installation in London.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Button variant="hero" onClick={onOpenQuote}>
              Get A Quote
            </Button>
            <Button variant="outline" size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
              <a href="#gallery">View Our Work</a>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-primary-foreground/80 text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              5★ Google Reviews
            </span>
            <span className="w-px h-4 bg-white/30 hidden sm:block" />
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              BS EN 12150 Safety Glass
            </span>
            <span className="w-px h-4 bg-white/30 hidden sm:block" />
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              London &amp; UK Wide
            </span>
            <span className="w-px h-4 bg-white/30 hidden sm:block" />
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Survey &amp; Quote
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

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

        </div>
      </div>
    </section>
  );
};

export default Hero;

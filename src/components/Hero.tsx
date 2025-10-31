import { Button } from "./ui/button";
import heroImage from "@/assets/hero-balustrading.jpg";

const Hero = () => {
  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-overlay/50" />
      </div>

      {/* Hero Content */}
      <div className="relative h-full flex items-center justify-center text-center px-6">
        <div className="max-w-5xl">
          <h1 className="text-5xl md:text-7xl font-black text-primary-foreground uppercase tracking-wider mb-6 animate-fade-in">
            Premium Glass Balustrading Solutions
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto font-light">
            Transform your space with elegant, frameless glass balustrading systems
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" asChild>
              <a href="#contact">Get A Free Quote</a>
            </Button>
            <Button variant="outline" size="lg" className="bg-background/10 backdrop-blur-sm" asChild>
              <a href="#gallery">View Our Work</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

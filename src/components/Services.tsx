import { ClipboardCheck, PenTool, Wrench } from "lucide-react";

const Services = () => {
  return (
    <section id="services" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase">
            Our Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Custom frameless shower solutions for your home
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card p-8 border border-border text-center h-full">
            <div className="mb-6 flex justify-center">
              <ClipboardCheck className="w-14 h-14 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-card-foreground mb-4">
              Professional Survey
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              We offer a comprehensive on-site survey across London to assess your space and provide tailored recommendations for your custom frameless shower enclosure.
            </p>
          </div>

          <div className="bg-card p-8 border border-border text-center h-full">
            <div className="mb-6 flex justify-center">
              <PenTool className="w-14 h-14 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-card-foreground mb-4">
              Design Shower
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Work with our expert designers to create a custom frameless shower enclosure perfectly suited to your bathroom and style preferences.
            </p>
          </div>
          <div className="bg-card p-8 border border-border text-center h-full">
            <div className="mb-6 flex justify-center">
              <Wrench className="w-14 h-14 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-card-foreground mb-4">
              Installation
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Every supply-only order comes with detailed installation instructions, so your installer has everything they need to fit your frameless shower enclosure with confidence.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Services;

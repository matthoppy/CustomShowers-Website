import { ClipboardCheck } from "lucide-react";

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
            Bespoke frameless shower solutions for your home
          </p>
        </div>

        {/* Service Card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-card p-8 transition-all duration-300 hover:shadow-xl border border-border text-center">
            <div className="mb-6 flex justify-center">
              <ClipboardCheck className="w-14 h-14 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-card-foreground mb-4">
              Professional Survey
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              We offer a comprehensive on-site survey to assess your space and provide tailored recommendations for your bespoke frameless shower enclosure.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;

import { ClipboardCheck, PenTool } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <Link to="/design-shower" className="block">
            <div className="bg-card p-8 transition-all duration-300 hover:shadow-xl border border-border text-center h-full">
              <div className="mb-6 flex justify-center">
                <ClipboardCheck className="w-14 h-14 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-4">
                Professional Survey
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                We offer a comprehensive on-site survey to assess your space and provide tailored recommendations for your custom frameless shower enclosure.
              </p>
            </div>
          </Link>

          <Link to="/design-shower" className="block">
            <div className="bg-card p-8 transition-all duration-300 hover:shadow-xl border border-border text-center h-full">
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
          </Link>
        </div>

        {/* Design Shower Button */}
        <div className="mt-12 text-center">
          <Link to="/design-shower">
            <Button size="lg" className="px-8 py-6 text-lg">
              Design Your Shower
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Services;

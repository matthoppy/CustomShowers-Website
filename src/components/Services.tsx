import { Building2, Home, Wrench, Shield, Ruler, Sparkles } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Home,
      title: "Residential Showers",
      description: "Custom shower enclosures and wet rooms for luxury homes and apartments.",
    },
    {
      icon: Building2,
      title: "Commercial Projects",
      description: "Large-scale installations for hotels, spas, gyms, and commercial developments.",
    },
    {
      icon: Ruler,
      title: "Bespoke Design",
      description: "Custom designs tailored to your exact specifications and space requirements.",
    },
    {
      icon: Wrench,
      title: "Professional Installation",
      description: "Expert installation by certified professionals with meticulous attention to detail.",
    },
    {
      icon: Shield,
      title: "Quality Assurance",
      description: "All installations meet UK building regulations and safety standards.",
    },
    {
      icon: Sparkles,
      title: "Custom Mirrors",
      description: "Bespoke mirrors for bathrooms, bedrooms, and commercial spaces.",
    },
  ];

  return (
    <section id="services" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase">
            Our Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive shower and mirror solutions for every need
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="bg-card p-8 transition-all duration-300 hover:shadow-xl border border-border"
              >
                <div className="mb-6">
                  <Icon className="w-14 h-14 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-card-foreground mb-4">
                  {service.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;

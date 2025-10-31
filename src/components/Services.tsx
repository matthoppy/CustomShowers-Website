import { Building2, Home, Wrench, Shield, Ruler, Sparkles } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Home,
      title: "Residential Balustrading",
      description: "Custom glass balustrading solutions for homes, balconies, and staircases.",
    },
    {
      icon: Building2,
      title: "Commercial Projects",
      description: "Large-scale installations for offices, shopping centers, and public spaces.",
    },
    {
      icon: Ruler,
      title: "Custom Design",
      description: "Bespoke designs tailored to your specific requirements and vision.",
    },
    {
      icon: Wrench,
      title: "Professional Installation",
      description: "Expert installation by certified professionals with attention to detail.",
    },
    {
      icon: Shield,
      title: "Safety Compliance",
      description: "All installations meet Australian building codes and safety standards.",
    },
    {
      icon: Sparkles,
      title: "Maintenance & Repair",
      description: "Comprehensive maintenance services to keep your systems looking pristine.",
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
            Comprehensive glass balustrading solutions for every need
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

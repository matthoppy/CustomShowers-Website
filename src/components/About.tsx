import { CheckCircle } from "lucide-react";
import aboutImage from "@/assets/about-image.jpg";

const About = () => {
  const features = [
    "Over 15 years of industry experience",
    "New Zealand owned and operated",
    "Premium quality materials",
    "Expert installation team",
    "Competitive pricing",
    "Full warranty coverage",
  ];

  return (
    <section id="about" className="py-24 bg-secondary">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 uppercase">
              About Balustrading Concepts NZ
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Balustrading Concepts NZ for all your glass and aluminium balustrades, fencing and gates.
            </p>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              We work with residential and commercial clients, creating the balustrade, fence or gate that suits their exact needs. Whether you want a simple hand rail for your back steps, or an elegant glass balustrade for your high-rise apartment, a sliding gate for your driveway entrance, or a fence and gate for your pool – Our Balustrading experts in NZ can do it. We have been providing balustrading services for Auckland NZ homes and businesses with high quality balustrades for over a decade, it's no wonder we are one of City of Sail's preferred design, manufacturing and installation teams. Give us a call today on 09 828 8858 to learn more about how our experienced team can provide balustrades which exceed all your expectations.
            </p>
            
            {/* Features List */}
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <img
              src={aboutImage}
              alt="Quality glass balustrading craftsmanship"
              className="w-full h-[600px] object-cover shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

import { CheckCircle } from "lucide-react";
import aboutImage from "@/assets/about-image.jpg";
import aboutImage2 from "@/assets/about-image-2.jpg";

const About = () => {
  const features = [
    "Expert craftsmanship and design",
    "UK based and operated",
    "Premium quality glass and materials",
    "Professional installation team",
    "Lifetime warranty on materials",
    "5 year warranty on workmanship",
  ];

  return (
    <section id="about" className="py-24 bg-secondary">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 uppercase">
              About Bespoke Showers and Mirrors Ltd
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              At Bespoke Showers and Mirrors Ltd, we specialise in the design, manufacture, and installation of premium shower enclosures and custom mirrors throughout the UK.
            </p>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Our expert team works with residential and commercial clients, delivering bespoke solutions that combine elegance, functionality, and quality. Whether you need a frameless glass shower enclosure, a walk-in wet room, or custom-designed mirrors for your bathroom or commercial space, we provide tailored products that suit your exact specifications and meet all UK building standards.
            </p>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Our commitment to exceptional craftsmanship, innovative design, and reliable installation has made us a trusted name for luxury bathroom solutions. Every project – from a private residence to a hotel or spa development – is handled with precision and care, ensuring a result that looks stunning and stands the test of time.
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

          {/* Images */}
          <div className="relative space-y-6">
            <img
              src={aboutImage}
              alt="Premium shower enclosure installation"
              className="w-full h-[600px] object-cover shadow-2xl"
            />
            <img
              src={aboutImage2}
              alt="Bespoke mirror design and craftsmanship"
              className="w-full h-[600px] object-cover shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

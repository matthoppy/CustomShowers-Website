import { CheckCircle } from "lucide-react";
import aboutShower1 from "@/assets/about-shower-1.jpg";
import aboutShower2 from "@/assets/about-shower-2.jpg";

const About = () => {
  const features = [
    "Expert craftsmanship and design",
    "London based and operated",
    "Premium quality glass and materials",
    "Professional installation team",
    "Lifetime warranty on materials",
    "5 year warranty on workmanship",
  ];

  return (
    <section id="about" className="py-16 bg-primary">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Text Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 uppercase">
              About Bespoke Frameless Showers
            </h2>
            <p className="text-base text-gray-300 mb-3 leading-relaxed">
              At Bespoke Frameless Showers, we specialise in the design and supply of premium frameless shower enclosures across London.
            </p>
            <p className="text-base text-gray-300 mb-3 leading-relaxed">
              We work closely with homeowners, interior designers, and contractors to create stunning bespoke glass solutions tailored to your exact specifications. From frameless shower screens to walk-in wet rooms, every product is crafted to the highest standards using premium quality materials.
            </p>
            <p className="text-base text-gray-300 mb-5 leading-relaxed">
              Whether you're looking for supply only or require professional installation, we offer flexible options to suit your project needs. Our experienced team can handle the complete process from design consultation through to fitting, or simply provide you with beautifully crafted glass products ready for your own installer.
            </p>
            
            {/* Features List */}
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-white flex-shrink-0" />
                  <span className="text-white font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="relative space-y-4">
            <img
              src={aboutShower1}
              alt="Bespoke frameless glass shower enclosure with gold trim and geometric tile flooring"
              className="w-full h-[400px] object-cover shadow-2xl"
            />
            <img
              src={aboutShower2}
              alt="Custom frameless shower installation with hexagonal tile design and black frame"
              className="w-full h-[400px] object-cover shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
